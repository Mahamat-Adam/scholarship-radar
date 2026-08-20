/**
 * Downloads the web fonts into public/fonts and writes src/fonts.css.
 *
 * Self-hosting matters here for the same reason the rest of the project has no
 * backend: a page that pulls a font from somebody else's CDN tells that CDN who
 * is reading it. Nobody looking for a scholarship needs that.
 *
 *   npm run fonts
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = path.join(root, 'public/fonts')
const OUT_CSS = path.join(root, 'src/fonts.css')

/**
 * Must match `base` in vite.config.ts.
 *
 * A relative `../fonts/` would happen to resolve correctly in a production
 * build, because the bundled stylesheet lands in dist/assets and public/ lands
 * in dist/ — and would 404 through the whole of development, where the
 * stylesheet is served from /src. An absolute path under the base is right in
 * both, which is worth more than avoiding one hardcoded string.
 */
const BASE = '/scholarship-radar/'

const FACES = [
  { family: 'Sora', weights: [600, 700], subsets: ['latin'] },
  { family: 'Inter', weights: [400, 500, 600], subsets: ['latin'] },
  // Arabic needs a face of its own. Inter has no Arabic glyphs at all, so an
  // Arabic page without this falls back to whatever the operating system
  // happens to have — which on Windows is a font that looks nothing like the
  // rest of the site and sets at a visibly different size.
  { family: 'IBM Plex Sans Arabic', weights: [400, 500, 600, 700], subsets: ['arabic', 'latin'] },
]

// Google serves a different stylesheet per user agent; this one gets woff2.
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

async function text(url) {
  const res = await fetch(url, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(60_000) })
  if (!res.ok) throw new Error(`${res.status} for ${url}`)
  return res.text()
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  const blocks = []

  for (const face of FACES) {
    const spec = `${face.family}:wght@${face.weights.join(';')}`
    const css = await text(
      `https://fonts.googleapis.com/css2?family=${encodeURIComponent(spec)}&display=swap`
    )

    // Google labels each block with a comment naming its subset, immediately
    // before the rule it describes. Capturing the two together is the only way
    // to keep them paired — splitting on @font-face leaves each comment
    // stranded at the end of the previous block, which silently mislabels every
    // subset by one and makes two different files fight over one name.
    const blocksIn = [...css.matchAll(/\/\*\s*([\w-]+)\s*\*\/\s*@font-face\s*\{([\s\S]*?)\}/g)]
    for (const [, subset, chunk] of blocksIn) {
      const url = chunk.match(/url\((https:[^)]+\.woff2)\)/)?.[1]
      const weight = chunk.match(/font-weight:\s*(\d+)/)?.[1]
      const range = chunk.match(/unicode-range:\s*([^;]+);/)?.[1]
      if (!url || !weight) continue
      // Only the subsets a face is actually needed for. Shipping every subset
      // Google offers would multiply the download for glyphs no page uses.
      if (!face.subsets.some((wanted) => subset === wanted || subset === wanted + '-ext')) continue

      // Slugified: "IBM Plex Sans Arabic" would otherwise put spaces in a URL.
      const slug = face.family.toLowerCase().replace(/[^a-z0-9]+/g, "-")
      const file = `${slug}-${weight}-${subset}.woff2`
      const bytes = Buffer.from(
        await (await fetch(url, { signal: AbortSignal.timeout(60_000) })).arrayBuffer()
      )
      fs.writeFileSync(path.join(OUT_DIR, file), bytes)

      blocks.push(
        [
          '@font-face {',
          `  font-family: '${face.family}';`,
          '  font-style: normal;',
          `  font-weight: ${weight};`,
          '  font-display: swap;',
          `  src: url('${BASE}fonts/${file}') format('woff2');`,
          range ? `  unicode-range: ${range};` : null,
          '}',
        ]
          .filter(Boolean)
          .join('\n')
      )
      process.stdout.write(`  ${file} (${(bytes.length / 1024).toFixed(1)} kB)\n`)
    }
  }

  const header = [
    '/* Written by scripts/fetch-fonts.mjs — do not edit by hand.',
    '   Re-run `npm run fonts` to change families or weights. */',
    '',
  ].join('\n')

  fs.writeFileSync(OUT_CSS, header + blocks.join('\n\n') + '\n')
  console.log(`\nWrote ${blocks.length} faces to src/fonts.css`)
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
