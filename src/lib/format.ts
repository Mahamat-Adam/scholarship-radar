import type { Dictionary } from '../i18n/en'
import type { Award, Band, FundingTier, Money } from './types'

/**
 * Turning the index into the words on a card.
 *
 * Every function here takes the dictionary rather than reaching for English,
 * because the same award has to be describable in either language. What none of
 * them do is invent: if the page did not say it, the label reads "not stated" in
 * whichever language is on screen, rather than smoothing over the gap.
 */

export function tierLabel(a: Award, t: Dictionary): string {
  if (a.funding.tier === 'partial' && a.funding.percent) {
    return t.tiers.percentOfTuition(a.funding.percent)
  }
  return t.tiers[a.funding.tier]
}

/** Fully funded and full tuition are the two worth colouring differently. */
export function tierTone(tier: FundingTier): 'brass' | 'moss' | 'muted' {
  if (tier === 'full-ride') return 'brass'
  if (tier === 'full-tuition' || tier === 'partial') return 'moss'
  return 'muted'
}

export const bandLabel = (b: Band, t: Dictionary) => t.bands[b]

const NARROW: Record<string, string> = {
  GBP: '£', USD: '$', EUR: '€', CNY: '¥', JPY: '¥', KRW: '₩',
  TRY: '₺', PLN: 'zł', HUF: 'Ft', CHF: 'CHF', SEK: 'kr', NOK: 'kr',
  DKK: 'kr', MYR: 'RM', SGD: 'S$', HKD: 'HK$', TWD: 'NT$', AED: 'AED', SAR: 'SAR',
}

const PERIOD_EN: Record<Money['period'], string> = {
  month: ' a month',
  year: ' a year',
  semester: ' a semester',
  total: '',
}

const PERIOD_AR: Record<Money['period'], string> = {
  month: ' شهريًا',
  year: ' سنويًا',
  semester: ' لكل فصل',
  total: '',
}

export function money(m: Money, t: Dictionary): string {
  const symbol = NARROW[m.currency] ?? m.currency + ' '
  const digits = m.value >= 1000 ? m.value.toLocaleString('en-GB') : String(m.value)
  const period = t.locale.startsWith('ar') ? PERIOD_AR : PERIOD_EN
  // The figure keeps Western digits and its own symbol, because a currency
  // amount is read as a unit rather than as prose.
  return `${symbol}${digits}${period[m.period]}`
}

/**
 * The line that does most of the work on a card. Urgency is the message, so it
 * leads with the number of days whenever there are few enough of them to matter.
 */
export function deadlineLine(
  a: Award,
  t: Dictionary,
  fmt: { formatDate: (iso: string) => string; monthName: (m: number) => string }
): { text: string; tone: 'urgent' | 'soon' | 'calm' | 'quiet' } {
  const days = a.status.days ?? null

  if (a.deadline && days !== null) {
    if (days <= 0) return { text: t.deadline.today, tone: 'urgent' }
    if (days === 1) return { text: t.deadline.tomorrow, tone: 'urgent' }
    if (days <= 7) return { text: t.deadline.inDays(days), tone: 'urgent' }
    if (days <= 30) return { text: t.deadline.inDays(days), tone: 'soon' }
    if (days <= 90) return { text: t.deadline.on(fmt.formatDate(a.deadline)), tone: 'calm' }
    return { text: t.deadline.on(fmt.formatDate(a.deadline)), tone: 'quiet' }
  }

  if (a.application === 'automatic') {
    return { text: t.deadline.automatic, tone: 'calm' }
  }
  if (a.status.state === 'upcoming') {
    const month = a.status.reopenMonth ? fmt.monthName(a.status.reopenMonth) : ''
    return { text: month ? t.deadline.reopens(month) : t.deadline.unannounced, tone: 'quiet' }
  }
  return { text: t.deadline.none, tone: 'quiet' }
}

export function applicationLabel(a: Award, t: Dictionary): string {
  return t.application[a.application]
}

/** How long ago the link was confirmed to still be live on the institution's site. */
export function verifiedLine(a: Award, t: Dictionary): string {
  const then = new Date(a.lastVerified + 'T00:00:00Z').getTime()
  const days = Math.floor((Date.now() - then) / 86_400_000)
  if (days <= 0) return t.card.checkedToday
  if (days === 1) return t.card.checkedYesterday
  if (days < 7) return t.card.checkedDays(days)
  if (days < 14) return t.card.checkedLastWeek
  return t.card.checkedWeeks(Math.floor(days / 7))
}

/**
 * Scholarship systems universities run under a vendor's domain.
 *
 * Hundreds of American public universities keep their entire scholarship
 * catalogue on a tenant of one of these, and that tenant is the university's own
 * system — it is where the application is actually made, the way a company's job
 * board can live on a hosted recruiting platform and still be that company's job
 * board. Excluding them would drop those universities' funding entirely, which
 * serves nobody.
 *
 * It is still not the university's own domain, so the card says so rather than
 * letting the address bar surprise anyone. The line between this and a
 * commercial recruiter is not the vendor — it is who the tenant belongs to and
 * who takes a fee. A tenant only gets in when its subdomain resolves to an
 * institution already in the registry.
 */
const HOSTED_PORTALS = ['academicworks.com', 'blackbaud.com']

export function hostedPortalOf(host: string): string | null {
  const h = (host || '').toLowerCase()
  return HOSTED_PORTALS.find((p) => h === p || h.endsWith('.' + p)) ?? null
}
