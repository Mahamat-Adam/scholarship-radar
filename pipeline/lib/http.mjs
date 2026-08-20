/**
 * Fetching, done politely.
 *
 * We are a guest on several thousand university web servers, most of them run
 * by a small team with better things to do. So: one request at a time per host,
 * a real delay between them, robots.txt obeyed including its Crawl-delay, an
 * honest user agent with a link explaining who we are, and a hard timeout so a
 * hanging server can never stall a run.
 *
 * Identifying as a bot costs us some pages — a fair number of sites block
 * anything that admits to being automated, and would have let a browser string
 * straight through. That trade is deliberate. A crawler that lies about what it
 * is has no business claiming the rest of this project's promises.
 */

import { gunzipSync, brotliDecompressSync, inflateSync } from 'node:zlib'

export const UA =
  'Mozilla/5.0 (compatible; ScholarshipRadar/1.0; +https://mahamat-adam.github.io/scholarship-radar/)'

/** Shortest gap between two requests to the same host, unless robots asks for more. */
const DEFAULT_DELAY_MS = 1500
const MAX_DELAY_MS = 15_000
const TIMEOUT_MS = 25_000

/**
 * A shorter deadline for guesses.
 *
 * Most of what this crawler asks for does not exist: a sitemap at one of four
 * conventional paths, `/scholarships` on a site that files it elsewhere, an
 * international-office subdomain that was worth a try. Giving each of those the
 * full twenty-five seconds is how one slow university comes to cost eleven
 * minutes — which is exactly what Chinese sites, with no robots.txt and no
 * sitemap to short-circuit any of it, actually did.
 *
 * A page that is really there answers quickly or not at all.
 */
const PROBE_TIMEOUT_MS = 8_000
const MAX_BYTES = 4 * 1024 * 1024

const lastHit = new Map()
const robotsCache = new Map()
const failures = new Map()

/** After this many consecutive failures a host is left alone for the rest of the run. */
const GIVE_UP_AFTER = 4

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export function hostOf(url) {
  try {
    return new URL(url).host.toLowerCase().replace(/^www\./, '')
  } catch {
    return ''
  }
}

/**
 * A deliberately small robots.txt reader: the directives that actually bind us.
 * Anything it cannot parse is treated as permission, which matches how the
 * standard is written — robots.txt restricts, it does not grant.
 */
function parseRobots(text) {
  const rules = { disallow: [], allow: [], delay: 0, sitemaps: [] }
  let applies = false

  for (const line of text.split(/\r?\n/)) {
    const clean = line.replace(/#.*$/, '').trim()
    if (!clean) continue
    const idx = clean.indexOf(':')
    if (idx < 0) continue
    const key = clean.slice(0, idx).trim().toLowerCase()
    const value = clean.slice(idx + 1).trim()

    // Sitemap lines are global — they are not scoped to a user-agent group.
    if (key === 'sitemap') {
      rules.sitemaps.push(value)
      continue
    }
    if (key === 'user-agent') {
      const ua = value.toLowerCase()
      applies = ua === '*' || ua.includes('scholarshipradar')
      continue
    }
    if (!applies) continue

    if (key === 'disallow' && value) rules.disallow.push(value)
    else if (key === 'allow' && value) rules.allow.push(value)
    else if (key === 'crawl-delay') {
      const n = Number.parseFloat(value)
      if (Number.isFinite(n) && n > 0) rules.delay = Math.min(n * 1000, MAX_DELAY_MS)
    }
  }
  return rules
}

async function robotsFor(origin) {
  if (robotsCache.has(origin)) return robotsCache.get(origin)

  // Placed in the cache before the await so that concurrent callers for the
  // same origin share one fetch instead of racing to make several.
  const pending = (async () => {
    try {
      const res = await fetch(`${origin}/robots.txt`, {
        headers: { 'user-agent': UA, accept: 'text/plain,*/*' },
        redirect: 'follow',
        signal: AbortSignal.timeout(12_000),
      })
      if (!res.ok) return parseRobots('')
      const text = await res.text()
      // A robots.txt that comes back as a web page is a 404 handler in
      // disguise; several universities serve their whole site that way.
      if (/^\s*</.test(text)) return parseRobots('')
      return parseRobots(text.slice(0, 200_000))
    } catch {
      return parseRobots('')
    }
  })()

  robotsCache.set(origin, pending)
  return pending
}

function pathAllowed(rules, pathname) {
  const match = (pattern) => {
    // robots.txt wildcards: * for any run of characters, $ for end of path.
    const escaped = pattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/\\\$$/, '$')
    try {
      return new RegExp('^' + escaped).test(pathname)
    } catch {
      return false
    }
  }
  // Longest match wins, and Allow beats Disallow at equal length.
  let verdict = true
  let best = -1
  for (const d of rules.disallow) {
    if (d === '/') {
      if (best < 1) {
        verdict = false
        best = 1
      }
      continue
    }
    if (match(d) && d.length > best) {
      verdict = false
      best = d.length
    }
  }
  for (const a of rules.allow) {
    if (match(a) && a.length >= best) {
      verdict = true
      best = a.length
    }
  }
  return verdict
}

export async function isAllowed(url) {
  let u
  try {
    u = new URL(url)
  } catch {
    return false
  }
  const rules = await robotsFor(u.origin)
  return pathAllowed(rules, u.pathname + u.search)
}

export async function sitemapsFromRobots(origin) {
  const rules = await robotsFor(origin)
  return rules.sitemaps
}

async function waitTurn(host, origin) {
  const rules = await robotsFor(origin)
  const delay = Math.max(DEFAULT_DELAY_MS, rules.delay || 0)
  const since = Date.now() - (lastHit.get(host) || 0)
  if (since < delay) await sleep(delay - since)
  lastHit.set(host, Date.now())
}

function decompress(buf, encoding) {
  try {
    if (encoding === 'gzip') return gunzipSync(buf)
    if (encoding === 'br') return brotliDecompressSync(buf)
    if (encoding === 'deflate') return inflateSync(buf)
  } catch {
    /* fall through and use the bytes as they came */
  }
  return buf
}

/**
 * Fetch a URL, or explain why not.
 *
 * Always resolves — never throws — because a run touches thousands of hosts and
 * a single unreachable one must not be able to end it. The caller gets `{ ok:
 * false, reason }` and moves on.
 */
export async function get(url, { as = 'text', ignoreRobots = false, probe = false } = {}) {
  let u
  try {
    u = new URL(url)
  } catch {
    return { ok: false, reason: 'bad-url' }
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    return { ok: false, reason: 'bad-protocol' }
  }

  const host = hostOf(url)
  if ((failures.get(host) || 0) >= GIVE_UP_AFTER) {
    return { ok: false, reason: 'host-giving-trouble' }
  }

  if (!ignoreRobots && !(await isAllowed(url))) {
    return { ok: false, reason: 'robots' }
  }

  await waitTurn(host, u.origin)

  try {
    const res = await fetch(url, {
      headers: {
        'user-agent': UA,
        accept: 'text/html,application/xhtml+xml,application/xml,text/plain;q=0.9,*/*;q=0.8',
        'accept-language': 'en,*;q=0.5',
        'accept-encoding': 'gzip, deflate, br',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(probe ? PROBE_TIMEOUT_MS : TIMEOUT_MS),
    })

    if (!res.ok) {
      // 4xx is the site telling us something true about this URL, so it does
      // not count against the host. 5xx and blocks do.
      if (res.status >= 500 || res.status === 403 || res.status === 429) {
        failures.set(host, (failures.get(host) || 0) + 1)
      }
      return { ok: false, reason: `http-${res.status}`, status: res.status, url: res.url }
    }

    failures.set(host, 0)

    const type = (res.headers.get('content-type') || '').toLowerCase()
    const full = Buffer.from(await res.arrayBuffer())
    // A few institutions serve enormous single pages. Truncating is better than
    // refusing: the scholarship details are near the top, and the alternative is
    // dropping a real award because its page carries half a megabyte of markup.
    const raw = full.length > MAX_BYTES ? full.subarray(0, MAX_BYTES) : full
    const truncated = full.length > MAX_BYTES

    // A .gz sitemap arrives as bytes the runtime has not unwrapped for us,
    // because the compression is part of the file rather than the transfer.
    const body =
      as === 'buffer'
        ? raw
        : decompress(raw, url.endsWith('.gz') ? 'gzip' : '').toString('utf8')

    return { ok: true, body, type, url: res.url, status: res.status, truncated }
  } catch (err) {
    failures.set(host, (failures.get(host) || 0) + 1)
    const reason = err?.name === 'TimeoutError' ? 'timeout' : (err?.cause?.code || err?.code || 'network')
    return { ok: false, reason: String(reason).toLowerCase() }
  }
}

/** Reset between test runs so one run's blocklist cannot leak into the next. */
export function resetHttpState() {
  lastHit.clear()
  robotsCache.clear()
  failures.clear()
}
