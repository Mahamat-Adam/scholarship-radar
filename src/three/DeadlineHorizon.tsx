import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

import { useI18n } from '../i18n'
import { daysUntil } from '../lib/filters'
import type { Award } from '../lib/types'

/**
 * The deadline horizon.
 *
 * Every award in the current results is a mark on a receding grid, placed by how
 * long you have left: what closes this week sits large and near, what closes
 * next spring shrinks toward the vanishing point. Dragging scans forward and
 * back through the months.
 *
 * It is drawn as a chart rather than as a starfield because the page is paper.
 * Additive blending and soft haloes make light on black; on white they make
 * mud, so these are solid marks with edges, in ink that holds against cream.
 *
 * It is not decoration bolted onto a list — it is the same sort order the list
 * uses, drawn. That is the only reason it earns the download.
 *
 * Everything below degrades quietly. No WebGL, a lost context, or a stated
 * preference for reduced motion all end with a still gradient and a working
 * page, because nothing here is load-bearing.
 */

const HORIZON_DAYS = 365
const DEPTH = 62

/**
 * Time to distance, with a square root in it.
 *
 * A straight mapping is the obvious choice and it makes an unreadable picture:
 * most deadlines are months away, so almost every point lands at the vanishing
 * point in one grey smudge, while the handful closing this week — the only ones
 * anybody urgently needs to see — share the front two percent of the frame.
 *
 * The square root spends most of the depth on the near term. A week out and a
 * month out are visibly different distances; a nine-month wait and a ten-month
 * wait are not, and do not need to be.
 */
function depthFor(days: number): number {
  return Math.sqrt(Math.min(Math.max(days, 0), HORIZON_DAYS) / HORIZON_DAYS)
}

// Solid, saturated and dark enough to hold their own against paper. The dark
// theme's glowing pastels would be invisible here — a light background wants
// ink, not light.
const COLOURS = {
  urgent: new THREE.Color('#B91C1C'),
  soon: new THREE.Color('#9A3412'),
  calm: new THREE.Color('#166534'),
  quiet: new THREE.Color('#0F766E'),
}

function toneFor(days: number | null): keyof typeof COLOURS {
  if (days === null) return 'quiet'
  if (days <= 7) return 'urgent'
  if (days <= 30) return 'soon'
  if (days <= 90) return 'calm'
  return 'quiet'
}

/** A soft round sprite, drawn once, so points are discs rather than squares. */
function discTexture(): THREE.Texture {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  // A crisp disc with only enough feathering to avoid a jagged edge. The dark
  // theme wanted a soft halo because it was drawing light; this is drawing a
  // mark on a page, and a mark has an edge.
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.62, 'rgba(255,255,255,1)')
  g.addColorStop(0.78, 'rgba(255,255,255,0.55)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

/** Deterministic spread, so a given award always sits in the same place. */
function scatter(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return ((h % 2000) / 2000) * 2 - 1
}

interface Props {
  awards: Award[]
  onSelect?: (award: Award) => void
}

export default function DeadlineHorizon({ awards, onSelect }: Props) {
  const mount = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)
  const [hovered, setHovered] = useState<Award | null>(null)
  const { t } = useI18n()
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect

  useEffect(() => {
    const host = mount.current
    if (!host) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' })
    } catch {
      setFailed(true)
      return
    }

    const width = host.clientWidth
    const height = host.clientHeight
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(width, height)
    host.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 300)
    camera.position.set(0, 3.4, 16)
    camera.lookAt(0, 1.2, -26)

    // Points, positioned by time to deadline.
    const usable = awards.slice(0, 3000)
    const count = usable.length
    const positions = new Float32Array(count * 3)
    const colours = new Float32Array(count * 3)

    usable.forEach((a, i) => {
      const days = daysUntil(a.deadline)
      const noDeadline = days === null

      // Awards with no closing date are not "far away in time" — most of them
      // are the automatic ones, which are open whenever you apply. Putting them
      // at the horizon would say the opposite, so they get their own band below
      // the timeline instead of a place on it.
      const depth = noDeadline ? 0.42 : depthFor(days)

      positions[i * 3] = scatter(a.id) * (7 + depth * 22)
      positions[i * 3 + 1] = noDeadline ? -2.4 + scatter(a.id + 'y') * 0.6 : 1 + scatter(a.id + 'y') * 2
      positions[i * 3 + 2] = 7 - depth * DEPTH

      const c = COLOURS[toneFor(days)]
      colours[i * 3] = c.r
      colours[i * 3 + 1] = c.g
      colours[i * 3 + 2] = c.b
    })

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colours, 3))

    const sprite = discTexture()
    const material = new THREE.PointsMaterial({
      // Size attenuation does the rest: a point close to the camera is large
      // because it is close, which is the whole language of the picture.
      size: 2.2,
      map: sprite,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      // Normal blending, not additive: stacked marks on paper should get
      // denser, not brighter towards white.
      blending: THREE.NormalBlending,
      sizeAttenuation: true,
    })
    const points = new THREE.Points(geometry, material)
    scene.add(points)

    // A faint floor, so depth reads as distance rather than as scatter.
    const grid = new THREE.GridHelper(140, 28, 0xd3cabb, 0xe7e1d7)
    grid.position.set(0, -4, -22)
    ;(grid.material as THREE.Material).opacity = 0.55
    ;(grid.material as THREE.Material).transparent = true
    scene.add(grid)

    // Month markers, so the depth is a scale and not just an impression.
    const marks = new THREE.Group()
    for (const months of [1, 3, 6, 12]) {
      const depth = depthFor(months * 30.4)
      const z = 7 - depth * DEPTH
      const half = 7 + depth * 22
      const line = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-half, -3.6, z),
        new THREE.Vector3(half, -3.6, z),
      ])
      const mat = new THREE.LineBasicMaterial({
        color: 0x0f766e,
        transparent: true,
        opacity: months === 1 ? 0.34 : 0.18,
      })
      marks.add(new THREE.Line(line, mat))
    }
    scene.add(marks)

    // Interaction: drag to scan through the months.
    let scan = 0
    let target = 0
    let dragging = false
    let lastX = 0

    const pointer = new THREE.Vector2()
    const raycaster = new THREE.Raycaster()
    raycaster.params.Points = { threshold: 1.2 }

    const onDown = (e: PointerEvent) => {
      dragging = true
      lastX = e.clientX
      renderer.domElement.setPointerCapture(e.pointerId)
    }
    const onMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      if (!dragging) return
      target = Math.max(-10, Math.min(90, target + (e.clientX - lastX) * -0.12))
      lastX = e.clientX
    }
    const onUp = (e: PointerEvent) => {
      dragging = false
      try {
        renderer.domElement.releasePointerCapture(e.pointerId)
      } catch {
        /* the pointer may already be gone */
      }
    }
    const onClick = () => {
      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster.intersectObject(points)[0]
      if (hit?.index !== undefined && usable[hit.index]) onSelectRef.current?.(usable[hit.index])
    }

    renderer.domElement.addEventListener('pointerdown', onDown)
    renderer.domElement.addEventListener('pointermove', onMove)
    renderer.domElement.addEventListener('pointerup', onUp)
    renderer.domElement.addEventListener('pointerleave', onUp)
    renderer.domElement.addEventListener('click', onClick)

    let frame = 0
    let alive = true
    let hoverTick = 0

    const loop = () => {
      if (!alive) return
      frame = requestAnimationFrame(loop)
      scan += (target - scan) * 0.08
      points.position.z = scan
      grid.position.z = -22 + scan
      marks.position.z = scan

      // Hover lookup is comparatively expensive, so it runs a few times a second
      // rather than on every frame.
      if (++hoverTick % 8 === 0 && !dragging) {
        raycaster.setFromCamera(pointer, camera)
        const hit = raycaster.intersectObject(points)[0]
        const found = hit?.index !== undefined ? usable[hit.index] ?? null : null
        setHovered((prev) => (prev?.id === found?.id ? prev : found))
      }

      renderer.render(scene, camera)
    }

    if (reduced) {
      renderer.render(scene, camera)
    } else {
      loop()
    }

    const onResize = () => {
      const w = host.clientWidth
      const h = host.clientHeight
      if (!w || !h) return
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    window.addEventListener('resize', onResize)

    const onLost = (e: Event) => {
      e.preventDefault()
      alive = false
      cancelAnimationFrame(frame)
      setFailed(true)
    }
    renderer.domElement.addEventListener('webglcontextlost', onLost)

    return () => {
      alive = false
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', onResize)
      renderer.domElement.removeEventListener('pointerdown', onDown)
      renderer.domElement.removeEventListener('pointermove', onMove)
      renderer.domElement.removeEventListener('pointerup', onUp)
      renderer.domElement.removeEventListener('pointerleave', onUp)
      renderer.domElement.removeEventListener('click', onClick)
      renderer.domElement.removeEventListener('webglcontextlost', onLost)
      geometry.dispose()
      material.dispose()
      sprite.dispose()
      for (const m of marks.children) {
        const line = m as THREE.Line
        line.geometry.dispose()
        ;(line.material as THREE.Material).dispose()
      }
      grid.geometry.dispose()
      ;(grid.material as THREE.Material).dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement)
    }
  }, [awards])

  if (failed) {
    return (
      <div className="h-full w-full rounded-2xl bg-gradient-to-b from-tint to-transparent" />
    )
  }

  return (
    <div className="relative h-full w-full">
      <div ref={mount} className="h-full w-full cursor-grab active:cursor-grabbing" />

      {/* Without this the picture is pretty and unreadable. The colours carry
          the urgency and the lower band is a different thing entirely, and
          neither is guessable. */}
      <div className="pointer-events-none absolute end-3 top-3 hidden flex-col gap-1 text-[11px] text-faint sm:flex">
        {[
          ['#B91C1C', t.results.legendWeek],
          ['#9A3412', t.results.legendMonth],
          ['#166534', t.results.legendQuarter],
          ['#0F766E', t.results.legendLater],
        ].map(([colour, label]) => (
          <span key={label} className="flex items-center justify-end gap-1.5">
            {label}
            <span className="h-2 w-2 rounded-full" style={{ background: colour }} />
          </span>
        ))}
        <span className="mt-1 max-w-[11rem] text-end leading-snug text-faint/80">
          {t.results.legendBand}
        </span>
      </div>

      {hovered && (
        <div className="pointer-events-none absolute bottom-3 start-3 end-3 rounded-xl border border-line bg-paper/90 px-3 py-2 backdrop-blur">
          <p className="truncate text-sm font-semibold text-ink">{hovered.name}</p>
          <p className="truncate text-xs text-muted">{hovered.institution.name}</p>
        </div>
      )}
    </div>
  )
}
