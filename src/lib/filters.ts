import { matchesCountry } from './countries'
import { fieldsMatchQuery } from './fields'
import type { Award, Band, FundingTier, Level } from './types'

/**
 * One filter state, shared by the guided search and by browsing.
 *
 * Both views write into this and read out of it, so answering the questions and
 * clicking the chips cannot disagree with each other — there is only one set of
 * rules, and it lives here.
 */
export interface Filters {
  level: Level | null
  nationality: string | null
  countries: string[]
  fields: string[]
  tiers: FundingTier[]
  includeSelective: boolean
  onlyAutomatic: boolean
  gradePercent: number | null
  withinDays: number | null
  query: string
}

export const EMPTY_FILTERS: Filters = {
  level: null,
  nationality: null,
  countries: [],
  fields: [],
  tiers: [],
  includeSelective: false,
  onlyAutomatic: false,
  gradePercent: null,
  withinDays: null,
  query: '',
}

/**
 * Why an award was ruled out.
 *
 * Kept as a value rather than thrown away, because a filter that silently
 * removes forty things somebody was eligible for is worse than no filter. The
 * counts feed the line under the results that says what was hidden and offers
 * to show it.
 */
export type ExclusionReason =
  | 'level'
  | 'nationality'
  | 'country'
  | 'field'
  | 'tier'
  | 'selective'
  | 'automatic'
  | 'grades'
  | 'deadline'
  | 'query'

export const REASON_LABELS: Record<ExclusionReason, string> = {
  level: 'a different level of study',
  nationality: 'not open to your nationality',
  country: 'a country you did not pick',
  field: 'a different field of study',
  tier: 'a different kind of funding',
  selective: 'aimed at exceptional candidates',
  automatic: 'needing a separate application',
  grades: 'asking for higher grades than you entered',
  deadline: 'a deadline outside the window you chose',
  query: 'not matching your search',
}

function haystack(a: Award): string {
  return [
    a.name,
    a.institution.name,
    a.covers ?? '',
    a.note ?? '',
    a.fields.join(' '),
    a.selectivity.notes.join(' '),
  ]
    .join(' ')
    .toLowerCase()
}

/**
 * The nationality test.
 *
 * Only an explicit list on the page can rule somebody out. An award that says
 * nothing about nationality stays in — silence is not exclusion, and treating it
 * as though it were would quietly delete most of the index.
 */
function nationalityAllows(a: Award, cc: string): boolean {
  if (a.excludedCountries?.some((name) => matchesCountry(name, cc))) return false
  if (!a.eligibleCountries || a.eligibleCountries.length === 0) return true
  return a.eligibleCountries.some((name) => matchesCountry(name, cc))
}

/** The first rule an award fails, or null if it passes them all. */
export function firstFailure(a: Award, f: Filters): ExclusionReason | null {
  if (f.level && !a.levels.includes(f.level)) return 'level'
  if (f.nationality && !nationalityAllows(a, f.nationality)) return 'nationality'
  if (f.countries.length && !f.countries.includes(a.institution.cc)) return 'country'
  if (f.fields.length && a.fields.length && !a.fields.some((x) => f.fields.includes(x))) return 'field'
  if (f.tiers.length && !f.tiers.includes(a.funding.tier)) return 'tier'
  if (!f.includeSelective && a.selectivity.band === 'highly-selective') return 'selective'
  if (f.onlyAutomatic && a.application !== 'automatic') return 'automatic'
  if (f.gradePercent !== null && a.gradeBar && a.gradeBar.percent > f.gradePercent) return 'grades'
  if (f.withinDays !== null) {
    const days = daysUntil(a.deadline)
    if (days === null || days > f.withinDays) return 'deadline'
  }
  if (f.query.trim()) {
    const needle = f.query.trim().toLowerCase()
    // Searching "artificial intelligence" should find the computing awards even
    // though not one of them contains that phrase — almost no scholarship names
    // a major, so a plain text search on a subject finds nothing and looks broken.
    if (!haystack(a).includes(needle) && !fieldsMatchQuery(a.fields, needle)) return 'query'
  }
  return null
}

export function daysUntil(deadline: string | null): number | null {
  if (!deadline) return null
  const today = new Date()
  const then = new Date(deadline + 'T00:00:00Z')
  const now = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.round((then.getTime() - now) / 86_400_000)
}

const BAND_ORDER: Record<Band, number> = {
  'open-to-most': 0,
  competitive: 1,
  'highly-selective': 2,
}

/**
 * What closes next comes first.
 *
 * Awards with no stated deadline are not sorted to the bottom as an
 * afterthought — most of them are the automatic ones, which are the best thing
 * on the site for an ordinary applicant, so they sit just behind the things
 * that are genuinely about to close rather than below everything.
 */
export function sortAwards(list: Award[]): Award[] {
  return [...list].sort((a, b) => {
    const ad = daysUntil(a.deadline)
    const bd = daysUntil(b.deadline)
    const rank = (d: number | null, x: Award) => {
      if (d !== null && d <= 45) return d
      if (x.application === 'automatic') return 60
      if (d !== null) return d
      return 400
    }
    const diff = rank(ad, a) - rank(bd, b)
    if (diff !== 0) return diff
    const band = BAND_ORDER[a.selectivity.band] - BAND_ORDER[b.selectivity.band]
    if (band !== 0) return band
    return a.name.localeCompare(b.name)
  })
}

export interface FilterOutcome {
  results: Award[]
  excluded: Partial<Record<ExclusionReason, number>>
  total: number
}

export function applyFilters(awards: Award[], f: Filters): FilterOutcome {
  const results: Award[] = []
  const excluded: Partial<Record<ExclusionReason, number>> = {}
  for (const a of awards) {
    const failed = firstFailure(a, f)
    if (failed) excluded[failed] = (excluded[failed] ?? 0) + 1
    else results.push(a)
  }
  return { results: sortAwards(results), excluded, total: awards.length }
}

/** Is anything actually narrowing the list? Drives the "clear all" affordance. */
export function isActive(f: Filters): boolean {
  return (
    f.level !== null ||
    f.nationality !== null ||
    f.countries.length > 0 ||
    f.fields.length > 0 ||
    f.tiers.length > 0 ||
    f.includeSelective ||
    f.onlyAutomatic ||
    f.gradePercent !== null ||
    f.withinDays !== null ||
    f.query.trim() !== ''
  )
}
