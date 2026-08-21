/**
 * Turning a page into awards.
 *
 * The awkward truth about university funding pages is that most of them are not
 * one scholarship. They are thirty, stacked into an accordion or a table, under
 * a single URL. Treating each page as one record would produce an index that is
 * technically accurate and useless — "Fees and funding" is not something you can
 * decide to apply for.
 *
 * So this tries a series of splitters, in order of how confidently they identify
 * an individual award, and takes the first one that finds more than one. If none
 * do, the page is treated as a single award, which is the right answer for the
 * many universities that do give each scholarship its own page.
 */

import { parse } from 'node-html-parser'

import { LANGS, LANG_ORDER, hasTerm } from './vocab.mjs'

const STRIP = [
  'script', 'style', 'noscript', 'template', 'svg', 'iframe',
  'nav', 'header', 'footer', 'form',
  '[role=navigation]', '[role=banner]', '[role=contentinfo]', '[role=search]',
  '.nav', '.navbar', '.menu', '.breadcrumb', '.breadcrumbs', '.cookie',
  '.cookies', '.skip-link', '.site-header', '.site-footer', '.social',
  '#nav', '#menu', '#header', '#footer', '#cookie-banner',
]

/** Text of an element, with block boundaries preserved as newlines. */
function textOf(el) {
  if (!el) return ''
  const html = el.innerHTML || ''
  return html
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|tr|h[1-6]|section|article|dd|dt|td|th)>/gi, '\n')
    .replace(/<li\b[^>]*>/gi, '\n• ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#39;|&rsquo;|&apos;/gi, "'")
    .replace(/&quot;|&ldquo;|&rdquo;/gi, '"')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&(?:mdash|ndash);/gi, '-')
    .replace(/&pound;/gi, '£')
    .replace(/&euro;/gi, '€')
    .replace(/&#(\d+);/g, (_, d) => {
      const n = Number.parseInt(d, 10)
      return n > 31 && n < 0x10ffff ? String.fromCodePoint(n) : ' '
    })
    .replace(/[ \t ]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim()
}

function clean(root) {
  for (const sel of STRIP) {
    try {
      for (const el of root.querySelectorAll(sel)) el.remove()
    } catch {
      /* selector unsupported by the parser; skipping it is harmless */
    }
  }
  return root
}

/** Does this text mention a scholarship in any language we read? */
function marksAward(text) {
  const hay = text.toLowerCase()
  for (const code of LANG_ORDER) {
    for (const term of LANGS[code].mark) if (hasTerm(hay, term)) return true
  }
  return false
}

const NAME_NOISE =
  /^(apply|apply now|how to apply|applying|read more|find out more|more info(rmation)?|learn more|details|back|next|previous|home|search|menu|close|expand|show|hide|view|download|overview|introduction|contact|faqs?|key dates|important dates|eligibility|how it works|what you get|terms and conditions|who can apply|when to apply)\b/i

/**
 * The award's name lifted out of its own description, for the panels whose
 * heading is a process label. The name is nearly always spelled out in the
 * first line or two — "The scholarship will take the form of..." is preceded by
 * something calling it by name.
 */
const NAME_IN_TEXT =
  /\b((?:[A-Z][\w''’-]+|The)(?:\s+(?:[A-Z][\w''’-]+|of|for|the|and|in|to|a))*\s+(?:Scholarship|Bursary|Award|Grant|Fund|Prize)s?)\b/

function nameFromText(text) {
  const head = String(text || '').slice(0, 700)
  const m = head.match(NAME_IN_TEXT)
  if (!m) return ''
  const candidate = m[1].replace(/^The\s+/i, '').trim()
  return candidate.split(/\s+/).length >= 2 ? candidate : ''
}

/**
 * An accordion panel's heading is often about the award rather than being its
 * name — "How to apply for the Dean's Scholarship", "Terms and Conditions for
 * the Chancellor's Award". The award is in there; the wrapper is not part of it.
 */
const NAME_WRAPPER =
  /^(?:the\s+)?(?:terms\s+and\s+conditions|eligibility|how\s+to\s+apply|applying|apply|about|details?|overview|criteria|key\s+facts?)\s*(?:for|of|to)?\s*(?:the\s+)?/i

function cleanName(raw) {
  let s = String(raw || '')
    .replace(/\s+/g, ' ')
    .replace(/^[\s\-–—•*·|]+|[\s\-–—•*·|]+$/g, '')
    .trim()
  // Headings often carry a chevron or a count as part of the control.
  s = s.replace(/\s*[+▶▼↓→]\s*$/, '').trim()

  const unwrapped = s.replace(NAME_WRAPPER, '').trim()
  // Only take the unwrapped form when something recognisable is left; otherwise
  // the heading really was just "How to apply" and the block has no name of its own.
  if (unwrapped && unwrapped.length >= 6 && /scholarship|bursary|award|grant|fund|prize/i.test(unwrapped)) {
    s = unwrapped
  }

  s = s.replace(/^[\s\-–—:,]+/, '').trim()
  if (s.length > 160) s = s.slice(0, 157).trimEnd() + '…'
  return s
}

/**
 * A question is a question, not an award.
 *
 * University funding pages put their FAQ in the same accordion as their
 * scholarships — "How Do You Apply?", "Are there deadlines?", "Are fee waivers
 * available for CSS Profile?" — and structurally there is nothing to tell them
 * apart. The question mark is the tell.
 */
const IS_QUESTION = /\?\s*$/

/**
 * Field labels lifted out of a table or a definition list. "Application" is the
 * left-hand cell of a row whose right-hand cell says "No separate application
 * required"; the splitter is right that it is a row and wrong that it is an
 * award. Only rejected when the label is the entire name, so "Presidential
 * Award" and "Hardship Fund" are untouched.
 */
const BARE_LABEL =
  /^(?:the\s+)?(?:application|applications|amount|value|award|awards|benefit|benefits|eligibility|criteria|requirements?|deadline|duration|overview|description|details|type|category|number|purpose|selection|process|notes?)\s*:?$/i

function plausibleName(name) {
  if (!name) return false
  const n = name.trim()
  if (IS_QUESTION.test(n)) return false
  if (BARE_LABEL.test(n)) return false
  if (n.length < 6 || n.length > 160) return false
  if (NAME_NOISE.test(n)) return false
  if (!/[A-Za-zÀ-ÿĀ-￿]/.test(n)) return false
  // "II. Scholarship Coverage" and "3. Eligibility" are sections of a page
  // about an award, not awards. A numbered heading never names one.
  if (/^(?:[IVXivx]{1,4}|\d{1,2})\s*[.、)]\s/.test(n)) return false
  // A name that is only a number, a date or a currency figure is a table cell
  // that happened to be first, not the name of an award.
  if (/^[\d\s.,%£$€¥/-]+$/.test(n)) return false
  return true
}

function absolute(href, base) {
  if (!href) return null
  try {
    const u = new URL(href, base)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
    u.hash = ''
    return u.toString()
  } catch {
    return null
  }
}

/** The most specific link inside a block that looks like it leads to the award. */
function bestLink(el, base) {
  const links = el.querySelectorAll('a')
  for (const a of links) {
    const href = absolute(a.getAttribute('href'), base)
    if (!href) continue
    const label = cleanName(a.text)
    if (!label) continue
    if (/scholarship|bursary|award|apply|find out|details|more/i.test(label + ' ' + href)) return href
  }
  const first = links[0]
  return first ? absolute(first.getAttribute('href'), base) : null
}

/* ---------------------------------------------------------------- splitters */

/**
 * Blackbaud AcademicWorks. Hundreds of US public universities run their whole
 * scholarship catalogue on it, under a tenant subdomain, with markup that is
 * identical everywhere — so one splitter here is worth several hundred bespoke ones.
 */
function splitAcademicWorks(root, base) {
  const rows = root.querySelectorAll('tr')
  const out = []
  for (const tr of rows) {
    const link = tr.querySelector('a[href*="/opportunities/"]')
    if (!link) continue
    const name = cleanName(link.text)
    if (!plausibleName(name)) continue
    out.push({
      name,
      link: absolute(link.getAttribute('href'), base),
      text: textOf(tr),
      how: 'academicworks',
    })
  }
  return out
}

/** Bootstrap-style accordions, where one panel is reliably one award. */
function splitAccordion(root, base) {
  const items = [
    ...root.querySelectorAll('.accordion-item'),
    ...root.querySelectorAll('.accordion__item'),
    ...root.querySelectorAll('details'),
  ]
  const out = []
  for (const item of items) {
    const head =
      item.querySelector('.accordion-button') ||
      item.querySelector('.accordion-header') ||
      item.querySelector('summary') ||
      item.querySelector('h2, h3, h4, button')
    const text = textOf(item)
    if (text.length < 60) continue

    let name = stripSiteName(head ? head.text : '')
    // A panel headed "How to apply" is still an award — it just names itself in
    // its own text rather than in its heading.
    if (!plausibleName(name)) name = cleanName(nameFromText(text))
    if (!plausibleName(name)) continue

    out.push({ name, link: bestLink(item, base), text, how: 'accordion' })
  }
  return out
}

/**
 * Tables where each row is an award. Needs a header row naming something we
 * recognise, otherwise every layout table on the page qualifies.
 */
function splitTable(root, base) {
  const out = []
  for (const table of root.querySelectorAll('table')) {
    const headText = textOf(table.querySelector('thead') || table.querySelector('tr') || table).toLowerCase()
    const looksRight =
      /(scholarship|award|bursary|name)/.test(headText) &&
      /(value|amount|award|criteria|deadline|gpa|worth|eligib)/.test(headText)
    if (!looksRight) continue

    const rows = table.querySelectorAll('tr')
    for (let i = 0; i < rows.length; i++) {
      const cells = rows[i].querySelectorAll('td, th')
      if (cells.length < 2) continue
      const first = cleanName(cells[0].text)
      if (!plausibleName(first)) continue
      const text = textOf(rows[i])
      if (!marksAward(text) && !marksAward(first)) continue
      out.push({ name: first, link: bestLink(rows[i], base), text, how: 'table' })
    }
  }
  return out
}

/**
 * Headings with the award's detail underneath. The commonest layout and the
 * least reliable, so it is tried last and held to a higher bar: a section only
 * counts if it names a scholarship and says something substantive about it.
 */
function splitHeadings(root, base) {
  const nodes = []
  const walk = (el) => {
    for (const child of el.childNodes || []) {
      if (child.nodeType !== 1) continue
      nodes.push(child)
      walk(child)
    }
  }
  walk(root)

  const heads = nodes.filter((n) => /^h[23]$/i.test(n.tagName || ''))
  if (heads.length < 2) return []

  const out = []
  for (let i = 0; i < heads.length; i++) {
    const head = heads[i]
    const name = cleanName(head.text)
    if (!plausibleName(name)) continue
    if (!marksAward(name) && !/award|scholarship|bursary|grant|fund|prize|burs|beca|bourse|stipend/i.test(name)) {
      continue
    }

    // Everything between this heading and the next one, taken from the raw
    // HTML of the shared parent so nesting differences do not matter.
    const parent = head.parentNode
    if (!parent) continue
    const siblings = parent.childNodes || []
    const start = siblings.indexOf(head)
    if (start < 0) continue
    let body = ''
    for (let j = start + 1; j < siblings.length; j++) {
      const sib = siblings[j]
      if (sib.nodeType === 1 && /^h[1-3]$/i.test(sib.tagName || '')) break
      body += sib.nodeType === 1 ? textOf(sib) + '\n' : String(sib.rawText || '')
    }
    body = body.replace(/[ \t]+/g, ' ').trim()
    if (body.length < 80) continue

    out.push({
      name,
      link: bestLink(head.parentNode, base),
      text: `${name}\n${body}`,
      how: 'heading',
    })
  }
  return out
}

/* -------------------------------------------------------------------- entry */

/**
 * Awards found on one page.
 *
 * `link` on each award is a candidate only — the caller is responsible for
 * checking it lands on an approved domain, and for falling back to the page's
 * own URL when it does not. Nothing in here is allowed to decide what a card
 * links to.
 */
export function extractAwards(html, { url }) {
  let root
  try {
    root = parse(html, { blockTextElements: { script: false, noscript: false, style: false } })
  } catch {
    return { awards: [], pageText: '', title: '' }
  }

  const title = cleanName(root.querySelector('title')?.text || '')
  const main =
    root.querySelector('main') ||
    root.querySelector('[role=main]') ||
    root.querySelector('#main') ||
    root.querySelector('#content') ||
    root.querySelector('.main-content') ||
    root

  clean(main)
  const pageText = textOf(main)

  for (const splitter of [splitAcademicWorks, splitAccordion, splitTable, splitHeadings]) {
    const found = splitter(main, url)
    // One result from a splitter is usually a false positive from page chrome;
    // the page-level fallback below handles genuinely single-award pages better.
    if (found.length >= 2) {
      const seen = new Set()
      const unique = []
      for (const a of found) {
        const key = a.name.toLowerCase()
        if (seen.has(key)) continue
        seen.add(key)
        unique.push(a)
      }
      if (unique.length >= 2) return { awards: unique, pageText, title }
    }
  }

  // A single award, or a page we could not split.
  const h1 = cleanName(root.querySelector('h1')?.text || '')
  const name = plausibleName(h1) ? h1 : stripSiteName(title)
  if (!plausibleName(name) || pageText.length < 150) return { awards: [], pageText, title }

  // A page called "Scholarships and bursaries" is an index of awards we failed
  // to split, not an award. Listing it would put a card on the site that names
  // nothing you can apply for, which is worse than the gap it fills — so it is
  // dropped, and the institution simply contributes nothing from this page.
  if (GENERIC_PAGE_NAME.test(name)) return { awards: [], pageText, title }

  // The name has to be the name of an award.
  //
  // Without this, a fees page qualifies: "Collegegeld en kosten" is Dutch for
  // "tuition fees and costs", it sits on the funding section of the site, it
  // mentions scholarships in passing, and it has a number with a euro sign on
  // it — so the extractor reads the tuition fee as the size of the award and
  // publishes a card offering somebody €2,694 that does not exist. Requiring
  // the title to actually name an award costs a few real single-award pages
  // whose titles are vague, and removes an entire class of invention.
  if (!namesAnAward(name)) return { awards: [], pageText, title }

  return {
    awards: [{ name, link: null, text: pageText, how: 'page' }],
    pageText,
    title,
  }
}

/**
 * "Scholarships | Anytown University" is two things; only the first is a name.
 *
 * Chinese and Japanese sites append the site name with a bare hyphen and no
 * spaces — "MOFCOM Scholarship-中南大学国际教育学院" — which the usual separators
 * miss entirely. Splitting on every hyphen would wreck legitimate names like
 * "Vice-Chancellor's Award", so the trailing part is only dropped when it names
 * an institution rather than an award.
 */
const SITE_SUFFIX =
  /\s*[-–—|·]\s*[^-–—|·]*(?:大学|學|学院|大學|University|College|Admissions? Office|Office of|School of)[^-–—|·]*$/i

function stripSiteName(title) {
  let s = String(title || '').split(/\s+[|·–—]\s+/)[0]
  const trimmed = s.replace(SITE_SUFFIX, '').trim()
  if (trimmed.length >= 6) s = trimmed
  return cleanName(s)
}

/**
 * Words that make a title the name of an award rather than the name of a page
 * about money. Every language we read, because a Dutch or Hungarian fees page
 * is exactly as capable of impersonating a scholarship as an English one.
 */
const AWARD_WORD =
  /(scholarship|bursary|bursaries|fellowship|award|grant|prize|stipend|waiver|studentship|beurs|beurzen|stipendium|stipendien|ösztöndíj|burs(?:u|lar)?|beca|bolsa|bourse|borsa|stypendium|奖学金|獎學金|奨学金|장학금)/i

function namesAnAward(name) {
  return AWARD_WORD.test(name)
}

const GENERIC_PAGE_NAME =
  /^(scholarships?|bursaries|bursary|grants?|awards?|funding|financial\s+aid|fees?\s*(and|&)\s*funding|fees?\s+and\s+finance|tuition\s+fees?|money\s+matters|student\s+finance|scholarships?\s+and\s+(bursaries|funding|awards|financial\s+aid)|international\s+scholarships?|undergraduate\s+scholarships?|postgraduate\s+scholarships?|scholarships?\s+for\s+international\s+students?)$/i
