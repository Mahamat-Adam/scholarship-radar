/**
 * Reading an award off a block of text.
 *
 * Every field here is allowed exactly one source of truth: a sentence the
 * institution actually published. If no sentence says it, the field comes back
 * unstated and the card says so. Guessing would make the index bigger and worth
 * less — the whole point of linking only to official pages is undone the moment
 * we start inventing what those pages say.
 *
 * So each extractor returns its value together with the sentence it read it
 * from, and that sentence is shown on the card as evidence.
 */

import fs from 'node:fs'

/**
 * A GPA out of four as the UK percentage it is generally taken to be worth,
 * interpolated between the published anchor points. The table lives in
 * src/data/grade-scale.json so the site and the collector cannot drift apart:
 * a bar read off a page and a grade typed by a visitor have to end up on the
 * same scale or the comparison between them is meaningless.
 */
const GRADE_ANCHORS = JSON.parse(
  fs.readFileSync(new URL('../../src/data/grade-scale.json', import.meta.url), 'utf8')
).gpaToPercent

function gpaToPercent(gpa) {
  const first = GRADE_ANCHORS[0]
  const last = GRADE_ANCHORS[GRADE_ANCHORS.length - 1]
  if (gpa <= first[0]) return first[1]
  if (gpa >= last[0]) return last[1]
  for (let i = 1; i < GRADE_ANCHORS.length; i++) {
    const [hiGpa, hiPct] = GRADE_ANCHORS[i]
    if (gpa > hiGpa) continue
    const [loGpa, loPct] = GRADE_ANCHORS[i - 1]
    const t = (gpa - loGpa) / (hiGpa - loGpa)
    return Math.round(loPct + t * (hiPct - loPct))
  }
  return last[1]
}

const MONTHS = {
  january: 1, jan: 1, februar: 2, february: 2, feb: 2, march: 3, mar: 3,
  april: 4, apr: 4, may: 5, june: 6, jun: 6, july: 7, jul: 7,
  august: 8, aug: 8, september: 9, sept: 9, sep: 9, october: 10, oct: 10,
  november: 11, nov: 11, december: 12, dec: 12,
}

const CURRENCY = [
  [/£\s?([\d][\d,.]*)/, 'GBP'],
  [/(?:US)?\$\s?([\d][\d,.]*)/, 'USD'],
  [/€\s?([\d][\d,.]*)/, 'EUR'],
  [/(?:¥|RMB|CNY)\s?([\d][\d,.]*)/i, 'CNY'],
  [/(?:₩|KRW)\s?([\d][\d,.]*)/i, 'KRW'],
  [/(?:₺|TRY|TL)\s?([\d][\d,.]*)/i, 'TRY'],
  [/(?:CHF)\s?([\d][\d,.]*)/i, 'CHF'],
  [/(?:SEK)\s?([\d][\d,.]*)/i, 'SEK'],
  [/(?:NOK)\s?([\d][\d,.]*)/i, 'NOK'],
  [/(?:DKK)\s?([\d][\d,.]*)/i, 'DKK'],
  [/(?:PLN|zł)\s?([\d][\d,.]*)/i, 'PLN'],
  [/(?:HUF|Ft)\s?([\d][\d,.]*)/i, 'HUF'],
  [/(?:RM|MYR)\s?([\d][\d,.]*)/i, 'MYR'],
  [/(?:SGD|S\$)\s?([\d][\d,.]*)/i, 'SGD'],
  [/(?:HKD|HK\$)\s?([\d][\d,.]*)/i, 'HKD'],
  [/(?:AED)\s?([\d][\d,.]*)/i, 'AED'],
  [/(?:SAR)\s?([\d][\d,.]*)/i, 'SAR'],
  [/(?:NT\$|TWD)\s?([\d][\d,.]*)/i, 'TWD'],
  [/([\d][\d,.]*)\s?(?:元|人民币)/, 'CNY'],
  [/([\d][\d,.]*)\s?(?:円)/, 'JPY'],
]

/** Split into sentences we can quote back. Kept crude on purpose — it only has to be quotable. */
export function sentences(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?。！？])\s+|\s*[;•·]\s+|\s{2,}/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12 && s.length < 400)
}

/** The first sentence matching `re`, so a claim can always be shown its source. */
function quote(text, re) {
  for (const s of sentences(text)) {
    if (re.test(s)) return s
  }
  const m = String(text).match(re)
  return m ? m[0].trim() : null
}

function num(raw) {
  if (!raw) return null
  // 1,250.50 and 1.250,50 both occur; the last separator is the decimal one.
  let s = String(raw).replace(/\s/g, '')
  const lastComma = s.lastIndexOf(',')
  const lastDot = s.lastIndexOf('.')
  if (lastComma > lastDot) s = s.replace(/\./g, '').replace(',', '.')
  else s = s.replace(/,/g, '')
  const n = Number.parseFloat(s)
  return Number.isFinite(n) ? n : null
}

/* ------------------------------------------------------------------ amounts */

export function readAmount(text) {
  for (const [re, code] of CURRENCY) {
    const m = text.match(re)
    if (!m) continue
    const value = num(m[1])
    if (value === null || value < 50) continue
    const around = text.slice(Math.max(0, m.index - 80), m.index + 140).toLowerCase()
    let period = 'total'
    if (/per\s?month|monthly|a month|\/mo\b|月額|每月|monatlich|aylık|havi/.test(around)) period = 'month'
    else if (/per\s?year|annually|a year|per annum|\/yr\b|each year|jährlich|yıllık|每年/.test(around)) period = 'year'
    else if (/per\s?semester|a semester|每学期/.test(around)) period = 'semester'
    return { value, currency: code, period, evidence: quote(text, re) }
  }
  return null
}

export function readPercent(text) {
  const m = text.match(/(\d{1,3})\s?%\s*(?:of\s*)?(?:the\s*)?(?:tuition|fee|course fee|discount|reduction|off)/i)
    || text.match(/(?:tuition|fee)[^.]{0,30}?(\d{1,3})\s?%/i)
  if (!m) return null
  const pct = Number.parseInt(m[1], 10)
  if (!(pct > 0 && pct <= 100)) return null
  return { percent: pct, evidence: quote(text, new RegExp(`${m[1]}\\s?%`)) }
}

/* ----------------------------------------------------------------- deadlines */

/**
 * Dates, in the formats institutions actually publish them.
 *
 * `usStyle` decides what 10/31/2026 versus 31/10/2026 means, from the country
 * of the institution rather than from the string, because the string genuinely
 * cannot tell you.
 */
export function readDate(text, { usStyle = false } = {}) {
  const t = text.replace(/(\d)(st|nd|rd|th)\b/gi, '$1')

  // 12 March 2026 / 12 March, 2026
  let m = t.match(/\b(\d{1,2})\s+([A-Za-zÀ-ÿ]{3,12})\.?,?\s+(\d{4})\b/)
  if (m && MONTHS[m[2].toLowerCase()]) {
    return iso(+m[3], MONTHS[m[2].toLowerCase()], +m[1], t, m[0])
  }
  // March 12, 2026
  m = t.match(/\b([A-Za-zÀ-ÿ]{3,12})\.?\s+(\d{1,2}),?\s+(\d{4})\b/)
  if (m && MONTHS[m[1].toLowerCase()]) {
    return iso(+m[3], MONTHS[m[1].toLowerCase()], +m[2], t, m[0])
  }
  // 2026年3月12日
  m = t.match(/(\d{4})\s*[年\/-]\s*(\d{1,2})\s*[月\/-]\s*(\d{1,2})\s*日?/)
  if (m) return iso(+m[1], +m[2], +m[3], t, m[0])
  // 12/03/2026 or 10/31/2026 — the string itself cannot tell you which, so the
  // country decides, unless one of the numbers is too large to be a month.
  m = t.match(/\b(\d{1,2})[\/.](\d{1,2})[\/.](\d{4})\b/)
  if (m) {
    const first = +m[1]
    const second = +m[2]
    let d
    let mo
    if (second > 12) {
      // The second slot cannot be a month, so this is month-first.
      mo = first
      d = second
    } else if (first > 12) {
      // The first slot cannot be a month, so this is day-first.
      d = first
      mo = second
    } else if (usStyle) {
      mo = first
      d = second
    } else {
      d = first
      mo = second
    }
    return iso(+m[3], mo, d, t, m[0])
  }
  return null
}

function iso(y, mo, d, text, matched) {
  if (!(y >= 2020 && y <= 2035) || !(mo >= 1 && mo <= 12) || !(d >= 1 && d <= 31)) return null
  const date = `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  return { date, evidence: quote(text, new RegExp(matched.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))) }
}

const CLOSED_RE =
  /(applications?|deadline|application period|the (?:call|round))[^.]{0,60}?(now closed|has (?:now )?passed|are closed|is closed|have closed)|no longer accepting|closed for \d{4}/i
const REOPEN_RE =
  /(?:will\s+)?(?:re)?open(?:s|ing)?\s+(?:again\s+)?(?:in|on|from)\s+((?:early|mid|late)\s+)?([A-Za-zÀ-ÿ]{3,12})/i
const UNANNOUNCED_RE =
  /(details|dates|deadlines?)[^.]{0,60}?(not yet|will be (published|announced|available|confirmed)|to be confirmed|\bTBC\b)|check back|subject to change/i

export function readCycle(text) {
  const closed = CLOSED_RE.test(text)
  const reopen = text.match(REOPEN_RE)
  const reopenMonth = reopen && MONTHS[reopen[2].toLowerCase()] ? MONTHS[reopen[2].toLowerCase()] : null
  return {
    closedNow: closed,
    reopenMonth,
    unannounced: UNANNOUNCED_RE.test(text),
    evidence: closed ? quote(text, CLOSED_RE) : reopenMonth ? quote(text, REOPEN_RE) : null,
  }
}

/** The academic year an award is for — the difference between this year's page and last year's. */
export function readIntakeYear(text) {
  const m =
    text.match(/\b(20\d{2})\s?[\/–-]\s?(?:20)?(\d{2})\b/) ||
    text.match(/\bfor\s+(?:entry\s+in\s+)?(?:the\s+)?(?:academic\s+year\s+)?(20\d{2})\b/i) ||
    text.match(/\b(20\d{2})\s+(?:entry|intake|admission)/i) ||
    // "2022 Application Guide for the CSC Scholarship" is last year's page left
    // up, and the year is doing the same work as "2022 entry" — it just happens
    // to lead the title instead of following the word "for".
    text.match(/\b(20\d{2})\s*(?:年度?)?\s*(?:application|guide|admission|prospectus|announcement|call|申请|招生)/i) ||
    text.match(/^\s*(20\d{2})\b/)
  if (!m) return null
  const y = Number.parseInt(m[1], 10)
  if (y < 2024 || y > 2032) return null
  return { year: y, evidence: quote(text, new RegExp(m[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')) }
}

/* -------------------------------------------------------------- how much of it */

const FULL_RIDE_RE =
  /(fully funded|full scholarship|covers? (?:the )?full cost|tuition[^.]{0,40}(?:and|plus)[^.]{0,40}(?:living|stipend|accommodation|monthly)|全额奖学金|全額獎學金|전액장학금|tam burs|vollstipendium|teljes ösztöndíj)/i
const FULL_TUITION_RE =
  /(full tuition|100% of (?:the )?tuition|tuition (?:fees? )?(?:are|is|will be) (?:fully )?(?:waived|covered)|full fee waiver|免学费|免學費|学费全免|學費全免|全额学费|全額學費|全免学费|全額免除|tandíjmentesség)/i
/**
 * Living costs — but only where they are actually offered.
 *
 * Chinese pages state the absence as often as the presence: a tier reading
 * "覆盖全额学费（无生活费）" covers full tuition and explicitly no living
 * allowance, and a plain search for 生活费 finds the phrase inside its own
 * negation. Labelling that award "living costs" inverts what the page says,
 * which is worse than saying nothing.
 */
const STIPEND_ONLY_RE =
  /(monthly (?:allowance|stipend)|living (?:costs?|allowance)|maintenance grant|(?<![无無不未含])生活费|(?<![無不未含])生活費|월 생활비|学習奨励費)/i
const WAIVER_RE =
  /(fee waiver|tuition waiver|fee reduction|exemption from (?:tuition|fees)|授業料免除|学费减免|exonération|esonero|zwolnienie z czesnego)/i
const TIME_LIMITED_RE =
  /(first[- ]year (?:only|tuition)|only apply to your first year|first two years|for the first \d+ years?|maximum (?:of )?\d+ (?:years?|semesters?)|from year \d)/i
const RENEWABLE_RE =
  /(renewable|renewal is|subject to (?:maintaining|achieving|successful)|contingent upon|annual review|年度评审|年度审核)/i

/**
 * Funding tier, most specific first. A page describing tuition *and* living
 * costs is a full ride even though it also matches the tuition pattern, so the
 * order of these tests is the whole logic.
 */
const HALF_TUITION_RE = /(半额学费|半額學費|半免|50%s*(?:的)?学费)/i

export function readFunding(text) {
  const percent = readPercent(text)
  const halfTuition = HALF_TUITION_RE.test(text)
  const amount = readAmount(text)
  const timeLimited = TIME_LIMITED_RE.test(text)
  const renewable = RENEWABLE_RE.test(text)

  let tier = 'not-stated'
  let evidence = null

  if (FULL_RIDE_RE.test(text)) {
    tier = 'full-ride'
    evidence = quote(text, FULL_RIDE_RE)
  } else if (halfTuition && !FULL_TUITION_RE.test(text)) {
    tier = 'partial'
    evidence = quote(text, HALF_TUITION_RE)
  } else if (FULL_TUITION_RE.test(text)) {
    tier = 'full-tuition'
    evidence = quote(text, FULL_TUITION_RE)
  } else if (percent) {
    tier = percent.percent >= 100 ? 'full-tuition' : 'partial'
    evidence = percent.evidence
  } else if (WAIVER_RE.test(text)) {
    tier = 'waiver'
    evidence = quote(text, WAIVER_RE)
  } else if (STIPEND_ONLY_RE.test(text)) {
    tier = 'stipend'
    evidence = quote(text, STIPEND_ONLY_RE)
  } else if (amount) {
    tier = 'fixed'
    evidence = amount.evidence
  }

  return {
    tier,
    percent: percent ? percent.percent : null,
    amount,
    timeLimited,
    renewable,
    renewalEvidence: renewable ? quote(text, RENEWABLE_RE) : null,
    timeLimitedEvidence: timeLimited ? quote(text, TIME_LIMITED_RE) : null,
    evidence,
  }
}

/* ------------------------------------------------------------ who it is for */

const AUTO_RE =
  /(no (?:separate|additional|further)\s+(?:scholarship\s+)?application|automatically (?:considered|awarded|applied|included|assessed|reviewed)|you do not need to (?:apply|submit)|no application (?:form )?is (?:required|necessary)|offer will automatically include|without (?:the need for )?a separate application|application is not required)/i
const MANUAL_RE =
  /((?:complete|submit)[^.]{0,50}application form|separate application|letters? of recommendation|(?:two|2|three|3) (?:academic )?references?|personal statement|written essay|essay responses|interview|nomination by)/i

export function readApplication(text) {
  if (AUTO_RE.test(text)) return { mode: 'automatic', evidence: quote(text, AUTO_RE) }
  if (MANUAL_RE.test(text)) return { mode: 'separate', evidence: quote(text, MANUAL_RE) }
  return { mode: 'unclear', evidence: null }
}

const DOMESTIC_RE =
  /((?:home|domestic|in[- ]state)\s+(?:fee status|students only|applicants only)|not (?:available|open) to international|for (?:UK|home|domestic) students only|must be a (?:citizen|permanent resident) of|home fee status)/i
const INTL_RE =
  /(international students?|overseas (?:fee[- ]paying|students?|for tuition fee purposes)|non[- ]?(?:EU|EEA|UK|resident)|F-1|J-1|student visa|留学生|외국인 유학생|uluslararası öğrenci|internationale studierende|studenti internazionali)/i

export function readAudience(text) {
  if (DOMESTIC_RE.test(text) && !INTL_RE.test(text)) {
    return { open: false, evidence: quote(text, DOMESTIC_RE) }
  }
  if (INTL_RE.test(text)) return { open: true, evidence: quote(text, INTL_RE) }
  return { open: null, evidence: null }
}

const BACHELOR_RE =
  /(undergraduate|bachelor|freshman|first[- ]year entry|foundation year|BSc\b|BA\b|lisans\b|licence\b|grado\b|alapképzés|本科|학사|学部|laurea triennale)/i
const MASTER_RE =
  /(master'?s?\b|postgraduate taught|MSc\b|MA\b|MBA\b|graduate programme|yüksek lisans|mesterképzés|máster|laurea magistrale|硕士|碩士|석사|修士)/i
const DOCTORAL_ONLY_RE = /(PhD|doctoral|doctorate|postdoc)/i

export function readLevels(text) {
  const levels = []
  if (BACHELOR_RE.test(text)) levels.push('bachelor')
  if (MASTER_RE.test(text)) levels.push('master')
  const doctoralOnly = !levels.length && DOCTORAL_ONLY_RE.test(text)
  return { levels, doctoralOnly }
}

/* ------------------------------------------------------------ how hard it is */

const AWARD_COUNT_RE =
  /\b(?:over |up to |approximately |around )?(\d{1,4})\s+(?:scholarships?|awards?|places?|quotas?)\b/i
const SMALL_COUNT_WORDS =
  /\b(one|two|three|four|five)\s+(?:scholarships?|awards?)\s+(?:are|is|will be)\s+(?:available|awarded|offered)\b/i
const LIMITED_RE = /\b(?:a |only a )?(?:limited|select|small)\s+number\b/i
const ELITE_RE =
  /\b(exceptional|outstanding academic|world[- ]class|distinguished|extraordinary|highly competitive|top \d{1,2}%|demonstrated leadership|high[- ]achieving|academically talented|academic excellence)\b/i
const ORDINARY_BAR_RE =
  /\b(?:GPA|CGPA)\s*(?:of\s*)?(?:at least\s*)?([23]\.\d{1,2})\b|\b(2:1|2\.1|upper[- ]second|second class upper)\b|\b(5[0-9]|6[0-9]|7[0-5])\s?%\s*(?:average|overall|or above)\b/i

const WORD_NUM = { one: 1, two: 2, three: 3, four: 4, five: 5 }

export function readSelectivity(text) {
  const notes = []
  let count = null

  const wordM = text.match(SMALL_COUNT_WORDS)
  if (wordM) count = WORD_NUM[wordM[1].toLowerCase()] ?? null
  if (count === null) {
    const m = text.match(AWARD_COUNT_RE)
    if (m) {
      const n = Number.parseInt(m[1], 10)
      if (n > 0 && n < 5000) count = n
    }
  }

  const limited = LIMITED_RE.test(text)
  const elite = ELITE_RE.test(text)
  const barM = text.match(ORDINARY_BAR_RE)
  const ordinaryBar = Boolean(barM)
  const app = readApplication(text)

  // Scored rather than branched, so no single phrase can decide it alone.
  let score = 0
  if (app.mode === 'automatic') score -= 2
  if (ordinaryBar) score -= 2
  if (count !== null && count >= 20) score -= 2
  if (count !== null && count <= 5) score += 3
  if (limited) score += 1
  if (elite) score += 2
  if (app.mode === 'separate') score += 1
  if (/interview|nomination/i.test(text)) score += 2

  let band
  if (score <= -2) band = 'open-to-most'
  else if (score >= 3) band = 'highly-selective'
  else band = 'competitive'

  if (app.mode === 'automatic') notes.push('No separate application')
  if (barM) notes.push(`Stated bar: ${barM[0].trim()}`)
  if (count !== null) notes.push(`${count} award${count === 1 ? '' : 's'} stated`)
  if (elite) notes.push('Page uses selective language')

  return {
    band,
    awardCount: count,
    ordinaryBar,
    barEvidence: barM ? quote(text, ORDINARY_BAR_RE) : null,
    eliteEvidence: elite ? quote(text, ELITE_RE) : null,
    countEvidence: count !== null ? quote(text, wordM ? SMALL_COUNT_WORDS : AWARD_COUNT_RE) : null,
    notes,
  }
}

/* ---------------------------------------------------------------- what you need */

const IELTS_RE = /\bIELTS\s*(?:of\s*)?(\d(?:\.\d)?)/i
const TOEFL_RE = /\bTOEFL\s*(?:iBT\s*)?(?:of\s*)?(\d{2,3})/i
const HSK_RE = /\bHSK\s*(\d)/i

export function readRequirements(text) {
  const out = []
  const ielts = text.match(IELTS_RE)
  if (ielts) out.push({ kind: 'english', label: `IELTS ${ielts[1]}`, evidence: quote(text, IELTS_RE) })
  const toefl = text.match(TOEFL_RE)
  if (toefl && !ielts) out.push({ kind: 'english', label: `TOEFL ${toefl[1]}`, evidence: quote(text, TOEFL_RE) })
  const hsk = text.match(HSK_RE)
  if (hsk) out.push({ kind: 'language', label: `HSK ${hsk[1]}`, evidence: quote(text, HSK_RE) })

  const bar = text.match(ORDINARY_BAR_RE)
  if (bar) out.push({ kind: 'grades', label: bar[0].trim(), evidence: quote(text, ORDINARY_BAR_RE) })

  if (/(two|2) (?:academic )?references?|letters? of recommendation/i.test(text)) {
    out.push({ kind: 'documents', label: 'References required', evidence: quote(text, /references?|recommendation/i) })
  }
  if (/personal statement|motivation letter|written essay|essay responses/i.test(text)) {
    out.push({ kind: 'documents', label: 'Personal statement', evidence: quote(text, /personal statement|motivation letter|essay/i) })
  }
  if (/\binterview\b/i.test(text)) {
    out.push({ kind: 'process', label: 'Interview', evidence: quote(text, /\binterview\b/i) })
  }
  return out
}

/* ------------------------------------------------------- nationality limits */

/**
 * Country restrictions, which are the commonest reason a promising award turns
 * out to be a dead end. A page that names the countries it is open to is doing
 * the applicant a favour; this reads that list so the site can act on it instead
 * of leaving somebody to discover it on the application form.
 *
 * Only an explicit list counts. "Open to students from around the world" is not
 * a restriction, and neither is a page that simply never mentions the subject.
 */
const OPEN_TO_RE =
  /(?:only\s+)?open (?:to|for)[^.]{0,30}?(?:citizens?|nationals?|residents?|students?|applicants?)[^.]{0,20}?(?:of|from)\s+([^.;]{4,180})/i
const CITIZEN_RE =
  /must be (?:a )?(?:citizens?|nationals?|permanent residents?)\s+of\s+([^.;]{4,180})/i
const NOT_ELIGIBLE_RE =
  /(?:applicants?|candidates?|students?)\s+from\s+([^.;]{4,120}?)\s+are not eligible/i

/** Splits "Ghana, Kenya and Türkiye" into its parts without inventing any. */
function countryList(raw) {
  return String(raw)
    .replace(/\band\b|\bor\b/gi, ',')
    .split(',')
    .map((s) =>
      s
        .replace(/^\s*(the|either|both)\s+/i, '')
        .replace(/\b(is|are|who|which|that|resident|citizens?|nationals?)\b/gi, '')
        .replace(/[()"']/g, '')
        .trim()
    )
    .filter((s) => s.length > 2 && s.length < 40 && /^[A-Za-zÀ-ÿ' -]+$/.test(s))
    .slice(0, 40)
}

export function readEligibleCountries(text) {
  const excludedM = text.match(NOT_ELIGIBLE_RE)
  const excluded = excludedM ? countryList(excludedM[1]) : []

  const m = text.match(OPEN_TO_RE) || text.match(CITIZEN_RE)
  if (!m) {
    return excluded.length
      ? { only: null, excluded, evidence: quote(text, NOT_ELIGIBLE_RE) }
      : null
  }
  const only = countryList(m[1])
  // A phrase like "open to students from around the world" parses to nothing
  // usable, and that is the correct outcome — it is not a restriction.
  if (!only.length) return excluded.length ? { only: null, excluded, evidence: quote(text, NOT_ELIGIBLE_RE) } : null
  if (/world|any country|all countries|worldwide|overseas|international/i.test(m[1])) {
    return excluded.length ? { only: null, excluded, evidence: quote(text, NOT_ELIGIBLE_RE) } : null
  }
  return { only, excluded, evidence: quote(text, OPEN_TO_RE) || quote(text, CITIZEN_RE) }
}

/* ------------------------------------------------------------ field of study */

/**
 * Subjects, built from the same taxonomy the site renders. Keeping the list in
 * one file means a synonym added so somebody can type "machine learning" into
 * the search box also teaches the collector to recognise it on a page.
 */
const FIELD_TAXONOMY = JSON.parse(
  fs.readFileSync(new URL('../../src/data/fields.json', import.meta.url), 'utf8')
).families

const FIELDS = FIELD_TAXONOMY.map((family) => [
  family.key,
  new RegExp(family.match.map(termPattern).join('|'), 'iu'),
])

/**
 * One term as a pattern. Whole words unless the taxonomy marked it a stem with
 * a trailing asterisk — "art" has to be a word of its own or every mention of
 * "artificial" becomes an art scholarship, while "agricultur" is deliberately
 * a prefix so it covers both "agriculture" and "agricultural".
 */
function termPattern(term) {
  const isStem = term.endsWith('*')
  const body = (isStem ? term.slice(0, -1) : term).replace(/[.*+?^${}()|[\]\\]/g, (ch) => `\\${ch}`)
  return isStem ? `(?<![\\p{L}])${body}` : `(?<![\\p{L}])${body}(?![\\p{L}])`
}

/**
 * Subjects the award names. An award that names none is open to any subject,
 * which is the common case and is represented by an empty list rather than by
 * a guess.
 */
export function readFields(text) {
  const out = []
  for (const [key, re] of FIELDS) {
    if (re.test(text)) out.push(key)
  }
  // Everything matching is the same as nothing matching: a page that mentions a
  // dozen subjects is a general award listing them as examples.
  return out.length > 6 ? [] : out
}

export const FIELD_KEYS = FIELDS.map(([k]) => k)

/** The numeric grade bar, so the grade slider has something to compare against. */
export function readGradeBar(text) {
  const gpa = text.match(/\b(?:GPA|CGPA)\s*(?:of\s*)?(?:at least\s*)?(\d\.\d{1,2})\s*(?:\/\s*(\d\.?\d?))?/i)
  if (gpa) {
    const scale = gpa[2] ? Number.parseFloat(gpa[2]) : 4
    const value = Number.parseFloat(gpa[1])
    if (value > 0 && scale > 0 && value <= scale) {
      // Out of four, converted through the published equivalences. Scaling
      // linearly instead — (value / scale) * 100 — is the obvious move and it
      // turns GPA 3.0 into 75%, when 3.0 is level with a 2:1 and belongs at 60.
      // That made every American award read as stricter than an identical
      // British one and hid it from applicants who met the bar.
      const percent =
        scale === 4
          ? gpaToPercent(value)
          : gpaToPercent((value / scale) * 4)
      return { kind: 'gpa', value, scale, percent, evidence: quote(text, /GPA|CGPA/i) }
    }
  }
  const pct = text.match(/\b(4\d|5\d|6\d|7\d|8\d|9\d)\s?%\s*(?:average|overall|or above|or higher)/i)
  if (pct) {
    const value = Number.parseInt(pct[1], 10)
    return { kind: 'percent', value, scale: 100, percent: value, evidence: quote(text, /\d{2}\s?%/) }
  }
  // UK classifications, mapped to the percentage boundaries they are defined by.
  if (/\bfirst[- ]class\b/i.test(text)) return { kind: 'class', value: 70, scale: 100, percent: 70, evidence: quote(text, /first[- ]class/i) }
  if (/\b(2:1|2\.1|upper[- ]second|second class upper)\b/i.test(text)) {
    return { kind: 'class', value: 60, scale: 100, percent: 60, evidence: quote(text, /2:1|upper[- ]second/i) }
  }
  if (/\b(2:2|2\.2|lower[- ]second)\b/i.test(text)) {
    return { kind: 'class', value: 50, scale: 100, percent: 50, evidence: quote(text, /2:2|lower[- ]second/i) }
  }
  return null
}
