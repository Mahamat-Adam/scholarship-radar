/**
 * Builds pipeline/data/institutions.json — the list of universities the
 * collector is allowed to crawl, and the domains their pages are allowed to
 * live on.
 *
 * This file is the spine of the whole project. A scholarship can only enter the
 * index if its URL sits on a domain that appears here (or on the separate list
 * of official programme bodies), which is what makes "no middlemen" a property
 * of the data rather than a promise in the README. Aggregators cannot get in,
 * because they were never in the registry to begin with.
 *
 * Run it by hand, not in CI: the source lists change a few times a year, the
 * output is committed, and a bad network day should never be able to shrink the
 * allowlist under a scheduled run.
 *
 *   npm run registry
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(root, 'pipeline/data/institutions.json')
const EXTRA = path.join(root, 'pipeline/data/institutions-extra.json')

/**
 * Where somebody can actually go and study. Deliberately a closed list rather
 * than "everywhere": each country here has to be worth the crawl budget, and
 * adding one is a decision, not an accident.
 */
const COUNTRIES = [
  // English-speaking
  'US', 'GB', 'IE', 'CA', 'AU', 'NZ',
  // EU + EEA + Switzerland
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR',
  'HU', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI',
  'ES', 'SE', 'IS', 'LI', 'NO', 'CH',
  // East and South-East Asia
  'CN', 'JP', 'KR', 'SG', 'HK', 'TW',
  // Gulf. Worth their own line: several of these are full rides with a
  // stipend that ask far less of an applicant than their Western equivalents,
  // which is exactly the kind of award this site exists to surface.
  'AE', 'SA', 'QA', 'KW', 'BH', 'OM',
  // Bridge
  'TR',
]

const HIPO =
  'https://raw.githubusercontent.com/Hipo/university-domains-list/master/world_universities_and_domains.json'

/**
 * Hosted portals that are the institution's own system rather than a third
 * party selling access to it. A tenant subdomain here is treated as if it were
 * the university's own domain, the same way a company's careers page on a
 * hosted recruiting platform is still that company's careers page.
 *
 * Commercial student-recruitment agents are the opposite of this and stay
 * banned: they insert themselves between the applicant and the university, take
 * a commission, and are exactly the middleman this project exists to remove.
 */
const HOSTED_PORTALS = ['academicworks.com', 'blackbaud.com']

const BANNED_AGENTS = [
  'at0086.cn', '17gz.org', 'cucas.cn', 'applysquare.com',
  'mastersportal.com', 'bachelorsportal.com', 'studyportals.com',
  'scholars4dev.com', 'scholarshipdb.net', 'scholarshiproar.com',
  'globaladmissions.com', 'mina7.net', 'collegedunia.com', 'greatyop.com',
]

function apex(host) {
  return String(host || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/^www\./, '')
    .replace(/\.$/, '')
}

/** Domains that are too broad to be an identity — a match on one proves nothing. */
const TOO_BROAD = new Set(['edu', 'ac.uk', 'edu.cn', 'edu.au', 'ac.jp', 'edu.tr'])

function isUsableDomain(d) {
  if (!d || d.length < 4) return false
  if (TOO_BROAD.has(d)) return false
  if (!d.includes('.')) return false
  if (BANNED_AGENTS.some((b) => d === b || d.endsWith('.' + b))) return false
  return true
}

/**
 * Stable id from the primary domain. Using the domain rather than the name
 * means a university that renames itself keeps its saved scholarships.
 */
function idFor(domain) {
  return domain.replace(/[^a-z0-9]+/g, '-')
}

async function getJson(url) {
  const res = await fetch(url, {
    headers: { 'user-agent': 'scholarship-radar registry build' },
    signal: AbortSignal.timeout(120_000),
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`)
  return res.json()
}

function readLocal(file) {
  if (!fs.existsSync(file)) return []
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (err) {
    console.error(`  ! ${path.basename(file)} is not valid JSON: ${err.message}`)
    return []
  }
}

async function main() {
  const wanted = new Set(COUNTRIES)

  console.log('Fetching the university domain list...')
  const raw = await getJson(HIPO)
  console.log(`  ${raw.length} institutions worldwide`)

  const byDomain = new Map()

  const add = (name, cc, domains, source) => {
    const clean = [...new Set((domains || []).map(apex).filter(isUsableDomain))]
    if (!clean.length) return
    // The shortest domain is nearly always the apex the institution actually
    // publishes under; the longer ones are departments and campuses.
    const primary = clean.slice().sort((a, b) => a.length - b.length)[0]
    const existing = byDomain.get(primary)
    if (existing) {
      existing.domains = [...new Set([...existing.domains, ...clean])]
      return
    }
    byDomain.set(primary, {
      id: idFor(primary),
      name: String(name || '').trim(),
      cc,
      domain: primary,
      domains: clean,
      source,
    })
  }

  for (const r of raw) {
    const cc = String(r.alpha_two_code || '').toUpperCase()
    if (!wanted.has(cc)) continue
    add(r.name, cc, r.domains, 'list')
  }

  const extra = readLocal(EXTRA)
  for (const r of extra) {
    if (!wanted.has(String(r.cc || '').toUpperCase())) continue
    add(r.name, String(r.cc).toUpperCase(), r.domains || [r.domain], 'curated')
  }
  if (extra.length) console.log(`  ${extra.length} curated additions merged`)

  const out = [...byDomain.values()].sort(
    (a, b) => a.cc.localeCompare(b.cc) || a.name.localeCompare(b.name)
  )

  const counts = {}
  for (const r of out) counts[r.cc] = (counts[r.cc] || 0) + 1

  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  fs.writeFileSync(
    OUT,
    JSON.stringify(
      { built: new Date().toISOString().slice(0, 10), hostedPortals: HOSTED_PORTALS, institutions: out },
      null,
      1
    )
  )

  console.log(`\nWrote ${out.length} institutions across ${Object.keys(counts).length} countries`)
  const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1])
  console.log(ranked.map(([cc, n]) => `${cc} ${n}`).join('  '))
  const missing = COUNTRIES.filter((cc) => !counts[cc])
  if (missing.length) console.log(`\nNo institutions found for: ${missing.join(', ')}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
