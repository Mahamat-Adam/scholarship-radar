/**
 * Finding the funding pages on one university's site.
 *
 * A large university publishes six figures' worth of URLs and a handful of them
 * are scholarships. Three ways in, cheapest first:
 *
 *   1. The sitemap. When a site has one it is by far the best route, because it
 *      reaches pages buried four clicks deep that a link crawl would never see.
 *   2. Guessing the usual paths. `/scholarships`, `/fees-and-funding` and their
 *      cousins are right often enough to be worth one request each.
 *   3. Following links from the homepage. Slow and shallow, but it is the only
 *      option on the sites with neither of the above — which, as it turns out,
 *      includes most universities in China.
 *
 * Everything is budgeted. No single institution may spend more than its share
 * of a run, however inviting its sitemap looks.
 */

import { get, sitemapsFromRobots, hostOf } from './http.mjs'
import { urlLooksRelevant, URL_HINTS } from './vocab.mjs'

/** Paths worth one speculative request each. Ordered by how often they land. */
const GUESSES = [
  '/scholarships',
  '/scholarships/',
  '/study/scholarships',
  '/admissions/scholarships',
  '/international/scholarships',
  '/fees-and-funding',
  '/study/fees-and-funding',
  '/financial-aid',
  '/study/international-students/scholarships',
  '/international/fees-and-funding',
  '/en/scholarships',
  '/en/study/scholarships',
  '/en/admissions/scholarship',
  '/scholarship',
  '/funding',
  '/en/funding',
]

/**
 * Where an English or international-student section tends to live when it is not
 * on the main host. The Chinese entries are not guesses — they are the actual
 * subdomains international offices use, and `en.` alone finds barely half of them.
 */
const SUBDOMAINS = [
  'en', 'english', 'international', 'admissions', 'admission', 'apply',
  'iso', 'isd', 'sie', 'intl', 'istudy', 'ie', 'ies', 'lxs', 'study',
]

const MAX_SITEMAP_FILES = 8
const GUESS_ALLOWANCE = 16
// Every international-office prefix gets a turn. These are the whole strategy
// for a site with no sitemap, so cutting the list short is cutting the coverage.
const SUBDOMAIN_ALLOWANCE = 15
const MAX_SITEMAP_URLS = 40_000
const MAX_CANDIDATES = 14

function locs(xml) {
  const out = []
  const re = /<loc>\s*([^<\s][^<]*?)\s*<\/loc>/gi
  let m
  while ((m = re.exec(xml))) {
    out.push(m[1].replace(/&amp;/g, '&').trim())
    if (out.length > MAX_SITEMAP_URLS) break
  }
  return out
}

const isIndex = (xml) => /<sitemapindex/i.test(xml)

/**
 * URLs from a site's sitemaps that look like funding pages.
 *
 * Child sitemaps are chosen rather than crawled wholesale: a name like
 * `page-sitemap.xml` is worth opening, `posts-sitemap.xml` is not, and on a site
 * with forty child sitemaps that distinction is the difference between eight
 * requests and forty.
 */
async function fromSitemaps(origin, hostAllowed) {
  const roots = [
    ...(await sitemapsFromRobots(origin)),
    `${origin}/sitemap.xml`,
    `${origin}/sitemap_index.xml`,
    `${origin}/sitemap-index.xml`,
  ]

  const seen = new Set()
  const found = []
  let opened = 0

  const queue = [...new Set(roots)].slice(0, 6)

  while (queue.length && opened < MAX_SITEMAP_FILES) {
    const next = queue.shift()
    if (!next || seen.has(next)) continue
    seen.add(next)
    if (!hostAllowed(next)) continue

    const res = await get(next, { probe: true })
    opened++
    if (!res.ok) continue
    const body = res.body
    if (!/<(urlset|sitemapindex)/i.test(body)) continue

    const entries = locs(body)
    if (isIndex(body)) {
      // Open the children most likely to hold ordinary content pages, and skip
      // the ones that plainly hold news, images or people.
      const ranked = entries
        .filter(hostAllowed)
        .filter((u) => !/(news|post|blog|image|video|author|tag|category|event|profile|people|staff)/i.test(u))
        .sort((a, b) => {
          const score = (u) => (/(page|content|main|study|international|admission)/i.test(u) ? 0 : 1)
          return score(a) - score(b)
        })
      queue.push(...ranked.slice(0, MAX_SITEMAP_FILES))
      continue
    }

    for (const u of entries) {
      if (!hostAllowed(u)) continue
      if (urlLooksRelevant(u)) found.push(u)
    }
  }

  return found
}

/**
 * Links from a page that is an index of awards rather than an award.
 *
 * A great many funding sections — nearly all of them in China — are a list of
 * titles pointing at one page per scholarship. The list page itself holds no
 * facts at all: `iso.zjnu.edu.cn/jxj_19165/list.htm` is eight hundred bytes of
 * navigation whose entire content is links to 浙江省政府来华留学生奖学金 and its
 * siblings. Stopping at that page finds nothing and concludes, wrongly, that the
 * university has no scholarships.
 *
 * So when a page yields no awards, the links it offers get one level of
 * follow-up — bounded, on-domain, and only where the link itself names an award.
 */
const AWARD_LINK = /scholar|bursary|award|grant|fellowship|奖学金|獎學金|奨学金|장학금|jxj|stipendium|burs|beca|bourse/i

export function awardLinksFrom(html, base, hostAllowed, limit = 8) {
  const out = []
  const seen = new Set()
  const re = /<a\b[^>]*href\s*=\s*["']([^"'#]+)["'][^>]*>([\s\S]{0,200}?)<\/a>/gi
  let m
  while ((m = re.exec(html))) {
    let href
    try {
      const u = new URL(m[1], base)
      u.hash = ''
      href = u.toString()
    } catch {
      continue
    }
    if (seen.has(href) || !hostAllowed(href)) continue
    // A link back to another listing is not a detail page.
    if (/\/(list|index)\.(htm|html|jsp|php|psp)$/i.test(href)) continue

    const label = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    const hay = decodeURIComponent(href) + ' ' + label
    if (!AWARD_LINK.test(hay)) continue
    if (label.length < 4) continue

    seen.add(href)
    out.push(href)
    if (out.length >= limit) break
  }
  return out
}

/** Links off a page that look like they lead to funding, for sites with no sitemap. */
function linksFrom(html, base, hostAllowed) {
  const out = []
  const re = /<a\b[^>]*href\s*=\s*["']([^"'#]+)["'][^>]*>([\s\S]{0,200}?)<\/a>/gi
  let m
  while ((m = re.exec(html))) {
    let href
    try {
      const u = new URL(m[1], base)
      u.hash = ''
      href = u.toString()
    } catch {
      continue
    }
    if (!hostAllowed(href)) continue
    const label = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase()
    const hay = (decodeURIComponent(href) + ' ' + label).toLowerCase()
    if (URL_HINTS.some((h) => hay.includes(h))) out.push(href)
    if (out.length > 400) break
  }
  return [...new Set(out)]
}

/**
 * Candidate funding URLs for one institution.
 *
 * Every URL that comes out of here has had its *final* host checked, after
 * redirects, against the domains the institution actually owns. Checking the
 * requested URL is not enough: universities merge, and a request to a
 * predecessor's domain lands somewhere else entirely. Trusting the URL we asked
 * for rather than the one we got is how an approved-domains rule quietly stops
 * being one.
 *
 * `ownerOf` resolves a URL to whichever registered institution owns its host,
 * or null. It is what lets a genuine merger be followed — a redirect to another
 * institution in the registry is still a real university — while a redirect to
 * anywhere else is dropped.
 */
export async function discover(inst, { ownerOf = null } = {}) {
  let effective = inst
  let allowed = new Set(inst.domains.map((d) => d.toLowerCase()))

  const onAllowlist = (u) => {
    const h = hostOf(u)
    if (!h) return false
    for (const d of allowed) {
      if (h === d || h.endsWith('.' + d)) return true
    }
    return false
  }

  let origin = `https://${inst.domain}`
  const candidates = new Set()

  const accept = (u) => {
    if (onAllowlist(u)) candidates.add(u)
  }

  // 0. Resolve the institution's own front door before spending anything else,
  // so a merger or a domain change is discovered once rather than per request.
  const front = await get(origin)
  if (front.ok && front.url) {
    const landedOn = hostOf(front.url)
    if (landedOn && !onAllowlist(front.url)) {
      const owner = ownerOf ? ownerOf(front.url) : null
      if (!owner) {
        // Redirected off every domain we recognise. Nothing here can be trusted
        // to still be this university, so the institution is skipped entirely.
        return { urls: [], institution: inst, movedTo: landedOn, reachable: false }
      }
      effective = owner
      allowed = new Set(owner.domains.map((d) => d.toLowerCase()))
      origin = `https://${owner.domain}`
    }
  }

  // Each strategy gets its own allowance rather than drawing on one pot.
  //
  // A shared budget looked tidier and quietly broke China. Sitemaps and the
  // path guesses consumed all of it before the subdomain probes ran, so only
  // `en.` was ever tried — and Chinese international offices live on `iso.`,
  // `isd.`, `sie.` and a dozen others. Every one of those universities came
  // back "no scholarships found" while `iso.zjnu.edu.cn` sat there with seven
  // of them on it.
  //
  // The apex being dead is also informative rather than incidental: guessing
  // sixteen paths on a host that has just refused a connection cannot work, so
  // when the front door fails those strategies are skipped outright and the
  // subdomains are tried instead — which is faster as well as more effective.
  const apexAlive = front.ok

  // 1. Sitemaps, if the apex answers at all.
  if (apexAlive) {
    try {
      const viaSitemap = await fromSitemaps(origin, onAllowlist)
      for (const u of viaSitemap) accept(u)
    } catch {
      /* a broken sitemap is not a broken institution */
    }
  }

  // 2. Guessed paths, only if the sitemap was thin and the host is answering.
  if (apexAlive && candidates.size < 4) {
    let tried = 0
    for (const path of GUESSES) {
      if (tried >= GUESS_ALLOWANCE || candidates.size >= MAX_CANDIDATES) break
      const res = await get(origin + path, { probe: true })
      tried++
      if (res.ok && /<html/i.test(res.body)) accept(res.url || origin + path)
    }
  }

  // 3. The homepage we already have, and the subdomains an international office
  // might live on. This is the only route that works on a site with no sitemap,
  // no robots.txt and a dead apex, so it gets an allowance of its own.
  if (candidates.size < 3) {
    const roots = [
      ...(front.ok && onAllowlist(front.url || origin) ? [{ url: front.url || origin, body: front.body }] : []),
      ...SUBDOMAINS.map((s) => ({ url: `https://${s}.${effective.domain}`, body: null })),
    ]
    let tried = 0
    for (const rootDoc of roots) {
      if (tried >= SUBDOMAIN_ALLOWANCE || candidates.size >= MAX_CANDIDATES) break
      let { url, body } = rootDoc
      if (!body) {
        if (!onAllowlist(url)) continue
        const res = await get(url, { probe: true })
        tried++
        if (!res.ok || !onAllowlist(res.url || url)) continue
        body = res.body
        url = res.url || url
      }
      for (const u of linksFrom(body, url, onAllowlist)) {
        accept(u)
        if (candidates.size >= MAX_CANDIDATES) break
      }
    }
  }

  // Prefer pages that name the level we care about, and shallow paths over deep
  // ones — a deep path is usually one award, a shallow one usually a list.
  const ranked = [...candidates].sort((a, b) => {
    const score = (u) => {
      const s = decodeURIComponent(u).toLowerCase()
      let n = s.split('/').length
      if (/international/.test(s)) n -= 3
      if (/scholarship|奖学金|burs|stipendium|beca|bourse/.test(s)) n -= 2
      if (/undergraduate|postgraduate|master|bachelor/.test(s)) n -= 1
      return n
    }
    return score(a) - score(b)
  })

  return {
    urls: ranked.slice(0, MAX_CANDIDATES),
    institution: effective,
    movedTo: effective === inst ? null : effective.domain,
    // Reachable means we got somewhere on this institution, not that its apex
    // answered. Chinese universities routinely refuse a connection on the bare
    // domain while their international office answers happily on a subdomain,
    // and reporting those as unreachable both understates the coverage and
    // hides where the real gaps are.
    reachable: front.ok || candidates.size > 0,
  }
}
