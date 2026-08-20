/**
 * Checks the published index against the promises the site makes about it.
 *
 * The claim that every link points at the awarding institution's own site is the
 * only reason to use this over anything else, and a claim like that is worth
 * exactly as much as the test that proves it. So this reads what was actually
 * written to public/data and fails loudly if any of it is untrue.
 *
 *   node scripts/verify-index.mjs
 *
 * Exits non-zero on a violation, so it can gate a deploy.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { PROGRAMMES } from '../pipeline/sources/programmes.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DATA = path.join(root, 'public/data')
const REGISTRY = path.join(root, 'pipeline/data/institutions.json')

const TODAY = new Date().toISOString().slice(0, 10)

const failures = []
const warnings = []

const fail = (rule, detail) => failures.push({ rule, detail })
const warn = (rule, detail) => warnings.push({ rule, detail })

function hostOf(url) {
  try {
    return new URL(url).host.toLowerCase().replace(/^www\./, '')
  } catch {
    return null
  }
}

function main() {
  if (!fs.existsSync(path.join(DATA, 'summary.json'))) {
    console.error('No index found. Run `npm run collect` first.')
    process.exit(1)
  }

  const registry = JSON.parse(fs.readFileSync(REGISTRY, 'utf8'))
  const summary = JSON.parse(fs.readFileSync(path.join(DATA, 'summary.json'), 'utf8'))

  const allowed = new Set()
  for (const inst of registry.institutions) {
    for (const d of inst.domains) allowed.add(d.toLowerCase())
  }
  for (const d of registry.hostedPortals || []) allowed.add(d.toLowerCase())
  // The official programme bodies are an allowlist of their own, checked by hand.
  for (const p of PROGRAMMES) {
    const h = hostOf(p.url)
    if (h) allowed.add(h)
  }

  const onAllowlist = (host) => {
    if (!host) return false
    let probe = host
    while (probe.includes('.')) {
      if (allowed.has(probe)) return true
      probe = probe.slice(probe.indexOf('.') + 1)
    }
    return false
  }

  const open = []
  for (const rel of Object.values(summary.shards || {})) {
    const file = path.join(DATA, rel)
    if (!fs.existsSync(file)) {
      fail('shard missing', rel)
      continue
    }
    open.push(...JSON.parse(fs.readFileSync(file, 'utf8')))
  }

  const closedFile = path.join(DATA, summary.closedShard || '')
  const closed = fs.existsSync(closedFile) ? JSON.parse(fs.readFileSync(closedFile, 'utf8')) : []

  console.log(`Checking ${open.length} open and ${closed.length} closed listings\n`)

  const ids = new Set()

  for (const a of [...open, ...closed]) {
    const where = `${a.id} (${a.institution?.name ?? 'unknown'})`

    // 1. The promise. Every link on an approved domain, after redirects.
    const host = hostOf(a.url)
    if (!onAllowlist(host)) fail('link is off the approved-domain list', `${where} -> ${a.url}`)
    if (host !== a.host) warn('stored host does not match the url', `${where}: ${a.host} vs ${host}`)
    if (!/^https:\/\//.test(a.url)) warn('link is not https', `${where} -> ${a.url}`)

    // 2. Nothing but bachelor's and master's.
    if (!Array.isArray(a.levels) || a.levels.length === 0) fail('no level', where)
    for (const l of a.levels || []) {
      if (l !== 'bachelor' && l !== 'master') fail('level outside the brief', `${where}: ${l}`)
    }

    // 3. Duplicate identities would make saving unreliable.
    if (ids.has(a.id)) fail('duplicate id', a.id)
    ids.add(a.id)

    // 4. Anything shown as a fact has to be traceable to something.
    //
    // For a crawled award that means a sentence quoted off the page. The
    // curated programmes are backed differently — by a person having read the
    // official page and written down what it covers — so their `covers` line is
    // what has to be there instead. Holding them to the scraped-quote rule
    // would produce a warning on every one of them and teach us to ignore it.
    if (a.kind === 'programme') {
      if (!a.covers) warn('curated programme with nothing recorded about what it covers', where)
    } else if (a.funding?.tier !== 'not-stated' && (!a.evidence || a.evidence.length === 0)) {
      warn('states funding with no quote to back it', where)
    }
  }

  // 5. The whole point of the open list: nothing in it has closed.
  for (const a of open) {
    if (a.status?.state === 'closed') fail('closed listing in the open index', a.id)
    if (a.deadline && a.deadline < TODAY) {
      fail('open listing whose deadline has passed', `${a.id} closed ${a.deadline}`)
    }
  }

  // 6. And nothing in it is last year's page left up.
  const currentIntake = new Date().getUTCFullYear() - (new Date().getUTCMonth() + 1 >= 8 ? 0 : 1)
  for (const a of open) {
    if (a.intakeYear && a.intakeYear < currentIntake) {
      fail('open listing advertising a past intake', `${a.id} says ${a.intakeYear}`)
    }
  }

  // 7. Counts in the summary have to match what was actually written.
  const shardTotal = open.length
  if (summary.total !== shardTotal) {
    fail('summary total disagrees with the shards', `${summary.total} vs ${shardTotal}`)
  }

  for (const { rule, detail } of failures.slice(0, 40)) console.error(`  FAIL  ${rule}: ${detail}`)
  for (const { rule, detail } of warnings.slice(0, 15)) console.warn(`  warn  ${rule}: ${detail}`)

  if (failures.length) {
    console.error(`\n${failures.length} violation(s).`)
    process.exit(1)
  }
  console.log(
    `\nAll checks passed.` +
      (warnings.length ? ` ${warnings.length} warning(s), none fatal.` : '')
  )
}

main()
