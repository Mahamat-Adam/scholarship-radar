/**
 * Builds the published index.
 *
 * Runs on a schedule in CI and is deliberately conservative. Institutions are
 * crawled a slice at a time, one that fails is skipped rather than fatal, and
 * the previously published index is read first — so a bad network day degrades
 * to "nothing new today" instead of wiping the site.
 *
 * The index is never committed to the repository. Each run pulls the currently
 * published copy back from the live site, updates it, and republishes. That is
 * what keeps a daily crawler from turning into a repository that grows forever.
 *
 *   node pipeline/index.mjs                 one slice of the registry
 *   node pipeline/index.mjs --all           every institution, for a full rebuild
 *   node pipeline/index.mjs --cc=HU --limit=20   one country, for development
 *   node pipeline/index.mjs --probe         report what it would find, write nothing
 */

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

import { get, hostOf } from './lib/http.mjs'
import { discover, awardLinksFrom } from './lib/discover.mjs'
import { extractAwards } from './lib/extract.mjs'
import { detectLang, LANGS, pageLooksRelevant } from './lib/vocab.mjs'
import {
  readFunding, readDate, readCycle, readIntakeYear, readApplication,
  readAudience, readLevels, readSelectivity, readRequirements, readGradeBar,
  readEligibleCountries, readFields,
} from './lib/classify.mjs'
import { PROGRAMMES } from './sources/programmes.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const REGISTRY = path.join(root, 'pipeline/data/institutions.json')
const OUTDIR = path.join(root, 'public/data')
const CACHE = path.join(root, 'pipeline/.cache')

const args = process.argv.slice(2)
const flag = (name, fallback = null) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`))
  return hit ? hit.slice(name.length + 3) : fallback
}
const has = (name) => args.includes(`--${name}`)

const PROBE = has('probe')
const ALL = has('all')
const ONLY_CC = flag('cc')
const LIMIT = Number.parseInt(flag('limit', '0'), 10) || 0
const SLICES = Number.parseInt(flag('slices', '7'), 10)

const TODAY = new Date().toISOString().slice(0, 10)
const NOW = new Date(TODAY + 'T00:00:00Z')

/**
 * The academic year a page has to be talking about to still be live. In August
 * the next intake is this year's; before August it is last year's that is still
 * running. A page advertising an earlier year is last year's page left up.
 */
const CURRENT_INTAKE = NOW.getUTCFullYear() - (NOW.getUTCMonth() + 1 >= 8 ? 0 : 1)

const US_STYLE_DATES = new Set(['US'])

/* --------------------------------------------------------------------- util */

const slug = (s) =>
  String(s)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70)

const hash = (s) => crypto.createHash('sha1').update(s).digest('hex').slice(0, 8)

const daysBetween = (iso) => Math.round((new Date(iso + 'T00:00:00Z') - NOW) / 86_400_000)

function log(...parts) {
  process.stdout.write(parts.join(' ') + '\n')
}

/* ---------------------------------------------------------- carrying forward */

/**
 * The previously published index.
 *
 * Its only job is memory: when a listing was first seen, and what we knew about
 * it before today. Crawling a slice of the registry each day means most of the
 * index is not re-checked on any given run, so without this the site would
 * shrink to whatever one slice found.
 */
function loadPrevious() {
  const summaryPath = path.join(OUTDIR, 'summary.json')
  if (!fs.existsSync(summaryPath)) return { awards: new Map(), institutions: new Map() }

  try {
    const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'))
    const awards = new Map()
    // Both halves. The closed list is not a by-product to be regenerated — it is
    // the memory of every award that has ever been open, and it is what lets the
    // site say when something reopens. Reading only the open shards would empty
    // the "opens later" page on every single run.
    const files = [...Object.values(summary.shards || {}), summary.closedShard].filter(Boolean)
    for (const rel of files) {
      const file = path.join(OUTDIR, rel)
      if (!fs.existsSync(file)) continue
      for (const a of JSON.parse(fs.readFileSync(file, 'utf8'))) awards.set(a.id, a)
    }
    const institutions = new Map()
    const srcPath = path.join(OUTDIR, 'sources.json')
    if (fs.existsSync(srcPath)) {
      for (const s of JSON.parse(fs.readFileSync(srcPath, 'utf8')).institutions || []) {
        institutions.set(s.id, s)
      }
    }
    log(`Carried forward ${awards.size} listings from the published index`)
    return { awards, institutions }
  } catch (err) {
    log(`Could not read the published index (${err.message}); starting fresh`)
    return { awards: new Map(), institutions: new Map() }
  }
}

/* ------------------------------------------------------------ status of a record */

/**
 * Open, opening soon, or closed.
 *
 * The site shows only what somebody can act on today, so this is the decision
 * that determines whether a listing is on the main index at all. It is
 * deliberately willing to say "closed" on thin evidence: showing a passed
 * deadline as though it were open is the failure that makes every other
 * scholarship site untrustworthy.
 */
function statusOf({ deadline, cycle, intakeYear, application }) {
  if (cycle.closedNow) {
    return { state: 'closed', reopenMonth: cycle.reopenMonth, why: 'The page says applications are closed' }
  }
  if (intakeYear && intakeYear < CURRENT_INTAKE) {
    return { state: 'closed', reopenMonth: null, why: `The page is still advertising ${intakeYear} entry` }
  }
  if (deadline) {
    const days = daysBetween(deadline)
    if (days < 0) return { state: 'closed', reopenMonth: cycle.reopenMonth, why: 'The deadline has passed' }
    return { state: 'open', days, why: null }
  }
  if (cycle.reopenMonth) {
    return { state: 'upcoming', reopenMonth: cycle.reopenMonth, why: 'The page names the month it reopens' }
  }
  if (application === 'automatic') {
    // Nothing to miss: you are considered when you apply for the course, so
    // there is no separate window that can have closed.
    return { state: 'open', days: null, why: null }
  }
  if (cycle.unannounced) {
    return { state: 'upcoming', reopenMonth: null, why: 'Dates for the next round are not published yet' }
  }
  return { state: 'open', days: null, why: null }
}

/**
 * Headings that belong to a page about money rather than to an award.
 *
 * These sit in the same accordion, table or heading structure as the real
 * scholarships and are structurally indistinguishable from them, which is
 * exactly why a splitter finds them.
 */
const NOT_AN_AWARD_TERMS = [
  'disbursement', 'recipients?', 'deadlines?', 'how to apply', 'how do i',
  'faqs?', 'frequently asked', 'calendar', 'policy', 'policies', 'verification',
  'appeals?', 'appealing', 'withdrawal', 'refunds?', 'cost of attendance',
  'net price', 'work.?study', 'glossary', 'contact us', 'staff directory',
  'available forms', 'checklists?', 'timeline', 'newsletter', 'announcements?',
  'privacy', 'sitemap', 'search results', 'terms and conditions',
  'important dates', 'application dates', 'consumer information',
  // Sections of a finance page rather than awards, found by probing.
  'payment plans?', 'renewable status', 'review process', 'financial aid counseling',
  'how do you', 'how does', 'what is', 'what are', 'who can', 'when is', 'when are',
]

/**
 * Aid an international student cannot have.
 *
 * These sit in the same list as the institutional scholarships on almost every
 * American financial-aid page, and they are gated on the FAFSA and on
 * citizenship or permanent residency. The pages seldom say so in so many words,
 * because to the audience they are written for it does not need saying — which
 * is exactly why a crawler reads them as open and a filter for "not available
 * to international students" never fires.
 *
 * Listing one here would not be untidy, it would be false: the whole site is
 * for people who are ineligible for every item on this list.
 */
const DOMESTIC_ONLY_AID = new RegExp(
  '(?<![\\p{L}])(?:' +
    [
      'pell grant', 'fseog', 'seog', 'supplementary educational opportunity',
      'supplemental educational opportunity', 'cal grant', 'fafsa',
      'federal work.?study', 'work.?study award', 'stafford', 'direct (?:subsidised|subsidized|unsubsidised|unsubsidized) loan',
      'plus loan', 'perkins loan', 'yellow ribbon', 'gi bill', 'post.?9/11',
      'tuition assistance program', 'state grant program', 'bright futures',
      'hope scholarship program', 'excelsior scholarship',
    ].join('|') +
    ')(?![\\p{L}])',
  'iu'
)

/**
 * Whole words only. Without the boundaries "loan" fires inside "Sloane
 * Scholarship" and "forms" inside "Uniform", which would quietly delete real
 * awards in the name of tidying up — a worse failure than the one being fixed.
 */
const NOT_AN_AWARD = new RegExp(
  '(?<![\\p{L}])(?:' + NOT_AN_AWARD_TERMS.join('|') + ')(?![\\p{L}])',
  'iu'
)

/* ---------------------------------------------------------------- one award */

function buildRecord({ award, inst, pageUrl, lang, allowedHosts }) {
  const text = award.text
  const usStyle = US_STYLE_DATES.has(inst.cc)

  const levels = readLevels(text)

  // Doctoral-only is outside the brief and goes.
  if (levels.doctoralOnly) return null

  // An award that names no level stays, marked as not stating one.
  //
  // Requiring a stated level was throwing away nine tenths of the hosted
  // scholarship catalogues, which are the single richest source there is:
  // a listing row carries a name, an amount and a deadline, and the level sits
  // on the detail page behind it. Forty-five of fifty awards on one American
  // university's catalogue were being dropped for saying nothing about a
  // question most of them do not answer at that level of the page.
  //
  // This mirrors how subjects already work — an award that names no subject
  // stays in the list whatever subject you pick — and it does not invent
  // anything: the card says the level is not stated rather than claiming both.

  const audience = readAudience(text)
  // The brief is international students. An award that says in so many words
  // that it is for home students is not a near miss, it is the wrong thing.
  if (audience.open === false) return null

  const funding = readFunding(text)
  const deadlineHit = readDate(text, { usStyle })
  const cycle = readCycle(text)
  const intake = readIntakeYear(text)
  const application = readApplication(text)
  const selectivity = readSelectivity(text)
  const requirements = readRequirements(text)
  const gradeBar = readGradeBar(text)
  const eligible = readEligibleCountries(text)
  const fields = readFields(text)

  // The link a card opens. A candidate link is only used when it lands on a
  // domain this institution owns; otherwise the page we read it from is used,
  // which is by definition already approved.
  let link = pageUrl
  if (award.link) {
    const h = hostOf(award.link)
    if (h && allowedHosts.some((d) => h === d || h.endsWith('.' + d))) link = award.link
  }

  const status = statusOf({
    deadline: deadlineHit?.date || null,
    cycle,
    intakeYear: intake?.year || null,
    application: application.mode,
  })

  // A page about scholarships is not a scholarship.
  //
  // American financial-aid sections are full of headings that a splitter is
  // right to find and wrong to publish: "2026-2027 Disbursement Dates",
  // "Appeal Procedure", "Award / Scholarship Recipients", "Are there
  // deadlines?". They sit in the same accordion as the real awards and read
  // like them structurally.
  if (NOT_AN_AWARD.test(award.name)) return null

  // Federal and state aid that no international student can apply for.
  if (DOMESTIC_ONLY_AID.test(award.name)) return null

  const evidence = []
  const push = (label, quoted) => {
    if (quoted && !evidence.some((e) => e.quote === quoted)) evidence.push({ label, quote: quoted })
  }
  push('What it covers', funding.evidence)
  push('Deadline', deadlineHit?.evidence)
  push('How to apply', application.evidence)
  push('Who it is for', audience.evidence)
  push('Entry requirement', selectivity.barEvidence)
  push('How many', selectivity.countEvidence)
  push('Renewal', funding.renewalEvidence)
  push('Duration', funding.timeLimitedEvidence)
  push('Countries', eligible?.evidence)
  push('Cycle', cycle.evidence)

  // Something has to be known about it.
  //
  // A record with no funding tier, no deadline and not one quotable sentence
  // is a name and a link — it tells a visitor nothing they could act on, and it
  // contradicts the one rule this project runs on, that nothing appears on a
  // card unless a sentence on the page says it. Seven in ten of the awards a
  // first American pass produced were exactly that.
  //
  // Dropping them costs volume and buys back the only thing that makes the
  // index worth reading.
  // A date on its own is not enough.
  //
  // "Medical Field" is a category heading on a page that groups scholarships by
  // subject. It cleared the first version of this gate because a deadline was
  // found somewhere in its block, and its entire evidence was the string
  // "Oct. 31, 2026" — a date, attached to a heading, describing nothing. So a
  // record with no stated funding and nothing quotable beyond its deadline now
  // has to at least call itself an award to get through.
  const beyondADate = evidence.some((e) => e.label !== 'Deadline')
  const namesAnAward =
    /scholarship|bursary|award|grant|fund|prize|fellowship|stipend|endowed|memorial|scholar/i.test(
      award.name
    )

  const saysSomething =
    funding.tier !== 'not-stated' ||
    beyondADate ||
    (Boolean(deadlineHit?.date) && namesAnAward)
  if (!saysSomething) return null

  return {
    id: `${inst.id}--${slug(award.name)}`,
    name: award.name,
    url: link,
    host: hostOf(link),
    institution: { id: inst.id, name: inst.name, cc: inst.cc, domain: inst.domain },
    kind: 'university',
    levels: levels.levels,
    levelsStated: levels.levels.length > 0,
    fields,
    funding: {
      tier: funding.tier,
      percent: funding.percent,
      amount: funding.amount ? { value: funding.amount.value, currency: funding.amount.currency, period: funding.amount.period } : null,
      timeLimited: funding.timeLimited,
      renewable: funding.renewable,
    },
    deadline: deadlineHit?.date || null,
    intakeYear: intake?.year || null,
    status,
    application: application.mode,
    selectivity: { band: selectivity.band, awardCount: selectivity.awardCount, notes: selectivity.notes },
    requirements: requirements.map((r) => ({ kind: r.kind, label: r.label })),
    gradeBar: gradeBar ? { kind: gradeBar.kind, percent: gradeBar.percent, label: gradeBar.evidence ? null : undefined } : null,
    eligibleCountries: eligible?.only || null,
    excludedCountries: eligible?.excluded?.length ? eligible.excluded : null,
    lang,
    langName: LANGS[lang]?.name || 'English',
    evidence: evidence.slice(0, 5),
    foundBy: award.how,
    firstSeen: TODAY,
    lastVerified: TODAY,
  }
}

/* ------------------------------------------------------------ one institution */

async function crawlInstitution(inst, ownerOf) {
  const out = []
  const found = await discover(inst, { ownerOf })
  const owner = found.institution
  if (!found.urls.length) {
    return { awards: out, pagesRead: 0, pagesFound: 0, reachable: found.reachable, movedTo: found.movedTo }
  }

  let read = 0

  // A queue rather than a list, because a page that turns out to be an index of
  // awards puts the awards themselves on the end of it.
  const queue = found.urls.slice(0, 8)
  const visited = new Set()
  let followed = 0
  const MAX_PAGES = 18
  const MAX_FOLLOWED = 10

  while (queue.length && read < MAX_PAGES) {
    const url = queue.shift()
    if (!url || visited.has(url)) continue
    visited.add(url)

    const res = await get(url)
    if (!res.ok) continue
    if (!/html/i.test(res.type || '')) continue

    // The URL we end up on is the one a visitor would end up on, so it is the
    // one that has to satisfy the approved-domain rule — not the one we asked
    // for. A page that redirects off the allowlist is dropped here.
    const finalUrl = res.url || url
    if (!ownerOf(finalUrl)) continue
    read++

    const { awards, pageText, title } = extractAwards(res.body, { url: finalUrl })

    if (!awards.length) {
      // No award here. If it is a list pointing at award pages, follow it once.
      if (followed < MAX_FOLLOWED) {
        const links = awardLinksFrom(res.body, finalUrl, (u) => Boolean(ownerOf(u)), MAX_FOLLOWED - followed)
        for (const link of links) {
          if (visited.has(link)) continue
          queue.push(link)
          followed++
        }
      }
      continue
    }

    if (!pageLooksRelevant(pageText)) continue

    // The title carries the language on pages whose body is mostly links — a
    // Chinese page headed 奖学金 with eight hundred bytes of navigation would
    // otherwise be read as English and sent through the wrong extractor.
    const lang = detectLang(`${title} ${pageText}`)
    for (const award of awards) {
      const record = buildRecord({
        award,
        inst: owner,
        pageUrl: finalUrl,
        lang,
        allowedHosts: owner.domains,
      })
      if (record) out.push(record)
    }
  }

  // One page listing forty awards is normal; one institution yielding four
  // hundred means a splitter has latched onto page furniture. Cap it and move on.
  const seen = new Set()
  const unique = []
  for (const r of out) {
    if (seen.has(r.id)) continue
    seen.add(r.id)
    unique.push(r)
  }
  return {
    awards: unique.slice(0, 120),
    pagesRead: read,
    pagesFound: found.urls.length,
    reachable: found.reachable,
    movedTo: found.movedTo,
  }
}

/* --------------------------------------------------------------- programmes */

/**
 * Official programmes, re-checked live.
 *
 * A page that is gone and a page that will not talk to a crawler are different
 * things, and treating them the same would quietly delete some of the best
 * awards on the site. Several of these — the Chinese ones especially — sit
 * behind a firewall that answers a datacentre IP with a challenge rather than a
 * page. That is not evidence the scholarship stopped existing.
 *
 * So: a 404 or a dead name drops the programme. A block, a timeout or a
 * challenge keeps it, because these entries are checked by hand and the link
 * still works for a person in a browser.
 */
const GONE = new Set(['http-404', 'http-410', 'enotfound', 'bad-url'])

async function checkProgrammes() {
  const out = []
  for (const p of PROGRAMMES) {
    const res = await get(p.url)
    if (!res.ok && GONE.has(res.reason)) {
      log(`  programme page is gone, dropped: ${p.name} (${res.reason})`)
      continue
    }
    if (!res.ok) {
      log(`  programme kept but could not be read today: ${p.name} (${res.reason})`)
    }

    const text = res.ok ? res.body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ') : ''
    const cycle = text ? readCycle(text) : { closedNow: false, reopenMonth: null, unannounced: false }
    const deadlineHit = text ? readDate(text) : null

    const status = statusOf({
      deadline: deadlineHit?.date || null,
      cycle,
      intakeYear: null,
      application: p.automatic ? 'automatic' : 'separate',
    })

    out.push({
      id: `programme--${p.id}`,
      name: p.name,
      url: p.url,
      host: hostOf(p.url),
      institution: { id: `programme-${p.id}`, name: p.body, cc: p.cc, domain: hostOf(p.url) },
      kind: 'programme',
      levels: p.levels,
      fields: [],
      funding: { tier: p.tier, percent: null, amount: null, timeLimited: false, renewable: false },
      covers: p.covers,
      coversAr: p.coversAr || null,
      noteAr: p.noteAr || null,
      deadline: deadlineHit?.date || null,
      intakeYear: null,
      window: p.window || null,
      status,
      application: p.automatic ? 'automatic' : 'separate',
      selectivity: { band: p.band, awardCount: null, notes: p.barNote ? [p.barNote] : [] },
      notesAr: p.barNoteAr ? [p.barNoteAr] : null,
      requirements: [],
      gradeBar: null,
      eligibleCountries: null,
      excludedCountries: null,
      lang: 'en',
      langName: 'English',
      note: p.note || null,
      evidence: deadlineHit?.evidence ? [{ label: 'Deadline', quote: deadlineHit.evidence }] : [],
      foundBy: 'curated',
      firstSeen: TODAY,
      lastVerified: TODAY,
    })
  }
  return out
}

/* --------------------------------------------------------------------- main */

function pickSlice(institutions) {
  // `--domains=a.edu,b.edu` crawls exactly those, for checking a specific set
  // rather than whichever ones happen to sort first.
  const only = flag('domains')
  if (only) {
    const wanted = new Set(only.toLowerCase().split(',').map((s) => s.trim()).filter(Boolean))
    return institutions.filter((i) => wanted.has(i.domain.toLowerCase()))
  }
  if (ONLY_CC) {
    // `--cc=GB,IE,NL --limit=6` means six from each, not six in total, so a
    // development run gets a spread rather than a deep dig into one country.
    const wanted = ONLY_CC.toUpperCase().split(',').map((s) => s.trim()).filter(Boolean)
    const out = []
    for (const cc of wanted) {
      const list = institutions.filter((i) => i.cc === cc)
      out.push(...(LIMIT ? list.slice(0, LIMIT) : list))
    }
    return out
  }
  if (ALL) return LIMIT ? institutions.slice(0, LIMIT) : institutions
  if (LIMIT) return institutions.slice(0, LIMIT)

  // One slice a day, so every institution is revisited about weekly without a
  // single run ever trying to crawl six thousand websites.
  const dayOfYear = Math.floor((NOW - new Date(Date.UTC(NOW.getUTCFullYear(), 0, 0))) / 86_400_000)
  const slice = dayOfYear % SLICES
  return institutions.filter((_, i) => i % SLICES === slice)
}

/**
 * Recompute what a carried-forward record's deadline means today.
 *
 * Only about a seventh of the index is re-crawled on any given day, so most
 * records arrive here with a status worked out up to a week ago. Left alone,
 * an award whose deadline passed on Tuesday would go on saying "open" until its
 * institution's turn came round again — which is precisely the failure this
 * site exists not to have.
 *
 * The stored deadline is a fact and does not change. What it implies does.
 */
function refresh(record) {
  if (!record?.status) return record
  if (record.status.state === 'closed') return record

  if (record.deadline) {
    const days = daysBetween(record.deadline)
    if (days < 0) {
      return {
        ...record,
        status: { state: 'closed', reopenMonth: record.status.reopenMonth ?? null, why: 'The deadline has passed' },
      }
    }
    return { ...record, status: { ...record.status, state: 'open', days } }
  }

  // An award still advertising a past intake year has been left up rather than
  // taken down, whatever its status said when we read it.
  if (record.intakeYear && record.intakeYear < CURRENT_INTAKE) {
    return {
      ...record,
      status: { state: 'closed', reopenMonth: null, why: `The page is still advertising ${record.intakeYear} entry` },
    }
  }
  return record
}

/**
 * Retire what is no longer there.
 *
 * Carrying the previous index forward gives the collector its memory, and left
 * alone it also gives it an inability to forget: an award whose page came down,
 * or one that only ever existed because an early version of the extractor
 * misread a fees page, would sit in the index for ever. Anything we published
 * once we would go on publishing.
 *
 * So when an institution is crawled and one of its previously known awards does
 * not turn up, that is counted as a miss. Two misses and it goes. One is not
 * enough: a timeout, a redirect or a site behind maintenance would otherwise be
 * able to delete real listings.
 *
 * Institutions not crawled on this run are untouched, because not looking is
 * not the same as looking and finding nothing.
 */
const MISSES_BEFORE_RETIRING = 2

function merge(previous, fresh, crawledInstitutions) {
  const out = new Map()
  const freshIds = new Set(fresh.map((r) => r.id))

  for (const [id, record] of previous) {
    const owner = record?.institution?.id
    const wasLookedAt = owner && crawledInstitutions.has(owner)

    if (wasLookedAt && !freshIds.has(id)) {
      const misses = (record.misses ?? 0) + 1
      if (misses >= MISSES_BEFORE_RETIRING) continue
      out.set(id, refresh({ ...record, misses }))
      continue
    }
    out.set(id, refresh(record))
  }

  for (const record of fresh) {
    const before = out.get(record.id)
    out.set(record.id, before ? { ...record, firstSeen: before.firstSeen, misses: 0 } : { ...record, misses: 0 })
  }
  return out
}

function write(all, health, previousHealth) {
  fs.mkdirSync(path.join(OUTDIR, 'c'), { recursive: true })

  const live = [...all.values()].filter((a) => a.status.state !== 'closed')
  const closed = [...all.values()].filter((a) => a.status.state === 'closed')

  const byCountry = new Map()
  for (const a of live) {
    const cc = a.institution.cc
    if (!byCountry.has(cc)) byCountry.set(cc, [])
    byCountry.get(cc).push(a)
  }

  const shards = {}
  const counts = {}
  for (const [cc, list] of byCountry) {
    list.sort((a, b) => {
      const ad = a.deadline || '9999'
      const bd = b.deadline || '9999'
      return ad.localeCompare(bd) || a.name.localeCompare(b.name)
    })
    const body = JSON.stringify(list)
    const file = `c/${cc}-${hash(body)}.json`
    fs.writeFileSync(path.join(OUTDIR, file), body)
    shards[cc] = file
    counts[cc] = list.length
  }

  const closedBody = JSON.stringify(closed)
  const closedFile = `closed-${hash(closedBody)}.json`
  fs.writeFileSync(path.join(OUTDIR, closedFile), closedBody)

  const institutionsSeen = new Set(live.map((a) => a.institution.id))

  // Which institutions have been looked at, and when. Published so the claim
  // about what this index covers can be checked rather than taken on trust —
  // including the ones that were checked and had nothing.
  const sources = new Map(previousHealth)
  for (const h of health) sources.set(h.id, h)
  fs.writeFileSync(
    path.join(OUTDIR, 'sources.json'),
    JSON.stringify({
      built: new Date().toISOString(),
      institutions: [...sources.values()].sort((a, b) => a.cc.localeCompare(b.cc) || a.name.localeCompare(b.name)),
    })
  )

  const summary = {
    built: new Date().toISOString(),
    day: TODAY,
    counts,
    total: live.length,
    closed: closed.length,
    institutions: institutionsSeen.size,
    checked: sources.size,
    countries: Object.keys(counts).length,
    shards,
    closedShard: closedFile,
  }
  fs.writeFileSync(path.join(OUTDIR, 'summary.json'), JSON.stringify(summary))

  // Content-hashed filenames make every published file immutable, which is what
  // lets a browser cache them for ever — and also means each run leaves the
  // previous run's files behind. Harmless in CI, where the checkout is fresh,
  // but locally it quietly fills the folder with dead copies of the index.
  const keep = new Set(['summary.json', 'sources.json', closedFile, ...Object.values(shards)])
  for (const dir of ['', 'c']) {
    const full = path.join(OUTDIR, dir)
    if (!fs.existsSync(full)) continue
    for (const entry of fs.readdirSync(full)) {
      if (!entry.endsWith('.json')) continue
      const rel = dir ? `${dir}/${entry}` : entry
      if (keep.has(rel)) continue
      fs.rmSync(path.join(full, entry), { force: true })
    }
  }

  return summary
}

async function main() {
  if (!fs.existsSync(REGISTRY)) {
    log('No institution registry. Run `npm run registry` first.')
    process.exit(1)
  }
  const registry = JSON.parse(fs.readFileSync(REGISTRY, 'utf8'))
  const { institutions } = registry
  const previous = loadPrevious()

  /**
   * Host to institution, for every domain in the registry plus the hosted
   * portals universities run their scholarship catalogues on. This is the
   * approved-domain rule in its entirety: a URL whose host is not resolvable
   * here cannot become a listing, whatever page it was linked from.
   */
  const byDomain = new Map()
  for (const inst of institutions) {
    for (const d of inst.domains) byDomain.set(d.toLowerCase(), inst)
  }
  const hostedPortals = (registry.hostedPortals || []).map((d) => d.toLowerCase())

  const ownerOf = (url) => {
    const h = hostOf(url)
    if (!h) return null
    let probe = h
    while (probe.includes('.')) {
      const hit = byDomain.get(probe)
      if (hit) return hit
      probe = probe.slice(probe.indexOf('.') + 1)
    }
    // A tenant on a portal the institution itself runs. The subdomain is the
    // university's, the platform underneath is just where it is hosted.
    if (hostedPortals.some((p) => h === p || h.endsWith('.' + p))) {
      const tenant = h.split('.')[0]
      for (const inst of institutions) {
        if (inst.id.startsWith(tenant) || inst.domain.split('.')[0] === tenant) return inst
      }
    }
    return null
  }

  // Re-check the curated programme list on its own. Their pages change on a
  // different rhythm from the universities', and being able to fix one broken
  // link without spending an hour re-crawling is worth the flag.
  const slice = has('programmes-only') ? [] : pickSlice(institutions)
  log(
    has('programmes-only')
      ? 'Programmes only — no institutions will be crawled'
      : `Registry holds ${institutions.length} institutions; this run takes ${slice.length}`
  )

  const fresh = []
  const health = []
  let done = 0
  let withAwards = 0

  /**
   * Several institutions at once.
   *
   * The rate limiting that matters is per host, and it lives in the fetcher, so
   * running institutions side by side is no less polite than running them in a
   * queue — each server still sees one request at a time with a gap between.
   *
   * Doing it one institution at a time was the obvious first version and it does
   * not survive contact with a real registry. A university with no robots.txt
   * and no sitemap makes forty requests that mostly time out, and China has
   * thousands of those: one slice took over fifteen minutes to get through
   * twenty-five of them, which for a daily run over the whole registry would
   * mean never finishing at all.
   */
  const WORKERS = 8
  let cursor = 0

  const worker = async () => {
    for (;;) {
      const index = cursor++
      if (index >= slice.length) return
      const inst = slice[index]
      try {
        const { awards, pagesRead, reachable, movedTo } = await crawlInstitution(inst, ownerOf)
        health.push({ id: inst.id, name: inst.name, cc: inst.cc, domain: inst.domain, reachable, movedTo, awards: awards.length, checked: TODAY })
        done++
        if (awards.length) {
          withAwards++
          fresh.push(...awards)
        }
        if (movedTo || awards.length || done % 25 === 0) {
          const moved = movedTo ? ` (now at ${movedTo})` : ''
          log(`  [${done}/${slice.length}] ${inst.name}${moved} — ${awards.length} award(s) from ${pagesRead} page(s)`)
        }
      } catch (err) {
        health.push({ id: inst.id, name: inst.name, cc: inst.cc, domain: inst.domain, reachable: false, awards: 0, checked: TODAY })
        done++
        log(`  [${done}/${slice.length}] ${inst.name} — failed: ${err.message}`)
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(WORKERS, slice.length) }, worker))

  const unreachable = health.filter((h) => !h.reachable).length
  log(
    `\n${withAwards}/${slice.length} institutions yielded something; ${fresh.length} listings read ` +
      `(${unreachable} unreachable)`
  )

  const programmes = await checkProgrammes()
  log(`${programmes.length}/${PROGRAMMES.length} official programmes still reachable`)

  if (PROBE) {
    fs.mkdirSync(CACHE, { recursive: true })
    fs.writeFileSync(path.join(CACHE, 'probe.json'), JSON.stringify([...fresh, ...programmes], null, 1))
    log(`\nProbe only — wrote pipeline/.cache/probe.json, published nothing`)
    return
  }

  // Every institution actually visited this run, whether or not it yielded
  // anything — including the ones a redirect reattributed to a different
  // institution, since their awards are filed under the new owner.
  const crawled = new Set(health.map((h) => h.id))
  for (const record of fresh) crawled.add(record.institution.id)
  if (PROGRAMMES.length) for (const p of PROGRAMMES) crawled.add(`programme-${p.id}`)

  const merged = merge(previous.awards, [...fresh, ...programmes], crawled)
  const summary = write(merged, health, previous.institutions)
  log(
    `\nPublished ${summary.total} open listings across ${summary.countries} countries ` +
      `(${summary.closed} closed, kept for the upcoming page)`
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
