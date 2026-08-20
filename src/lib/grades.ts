import scale from '../data/grade-scale.json'
import type { Dictionary } from '../i18n/en'

/**
 * Putting three grading systems on one scale.
 *
 * A scholarship page states its bar in whatever the country uses — a GPA, a
 * percentage, or a British classification — and a visitor knows their own grade
 * in exactly one of those. Comparing them means converting, and converting means
 * admitting that the conversion is approximate: no official universal table
 * exists, every university publishes its own, and a borderline case is settled
 * by an admissions officer rather than by arithmetic.
 *
 * That is fine for what this is used for. The grade is only ever used to hide
 * awards whose published bar is clearly above somebody. It never ranks anyone,
 * and being a few points out at the margin costs a borderline listing, not an
 * opportunity — which is why the site says the number is rough and offers to
 * stop using it entirely.
 *
 * The numbers live in JSON so the collector can read the same table; the words
 * live in the dictionary so they can be read in either language.
 */

export type GradeScale = 'gpa' | 'percent' | 'class'

const ANCHORS = scale.gpaToPercent as Array<[number, number]>

const CLASS_KEYS = ['first', 'upper-second', 'lower-second', 'third'] as const

export const CLASS_PERCENTS = scale.classifications as Array<{
  key: string
  percent: number
}>

/** A GPA out of 4, as the UK percentage it is generally taken to be worth. */
export function gpaToPercent(gpa: number): number {
  const first = ANCHORS[0]
  const last = ANCHORS[ANCHORS.length - 1]
  if (gpa <= first[0]) return first[1]
  if (gpa >= last[0]) return last[1]

  for (let i = 1; i < ANCHORS.length; i++) {
    const [hiGpa, hiPct] = ANCHORS[i]
    if (gpa > hiGpa) continue
    const [loGpa, loPct] = ANCHORS[i - 1]
    const t = (gpa - loGpa) / (hiGpa - loGpa)
    return Math.round(loPct + t * (hiPct - loPct))
  }
  return last[1]
}

/** The inverse, for showing somebody the GPA their percentage is worth. */
export function percentToGpa(percent: number): number {
  const first = ANCHORS[0]
  const last = ANCHORS[ANCHORS.length - 1]
  if (percent <= first[1]) return first[0]
  if (percent >= last[1]) return last[0]

  for (let i = 1; i < ANCHORS.length; i++) {
    const [hiGpa, hiPct] = ANCHORS[i]
    if (percent > hiPct) continue
    const [loGpa, loPct] = ANCHORS[i - 1]
    const t = (percent - loPct) / (hiPct - loPct)
    return Math.round((loGpa + t * (hiGpa - loGpa)) * 10) / 10
  }
  return last[0]
}

const LABEL_KEY: Record<string, 'first' | 'upperSecond' | 'lowerSecond' | 'third'> = {
  first: 'first',
  'upper-second': 'upperSecond',
  'lower-second': 'lowerSecond',
  third: 'third',
}

/** The classifications, with their names in the language on screen. */
export function classifications(t: Dictionary) {
  return CLASS_KEYS.map((key) => {
    const row = CLASS_PERCENTS.find((c) => c.key === key)!
    const label = LABEL_KEY[key]
    return {
      key,
      percent: row.percent,
      label: t.grades[label],
      note: t.grades[`${label}Note` as 'firstNote'],
    }
  })
}

/** The British classification a percentage falls in. */
export function classificationFor(percent: number, t: Dictionary): string {
  for (const c of classifications(t)) {
    if (percent >= c.percent) return c.label
  }
  return t.grades.pass
}

/**
 * How a grade reads back to the person who entered it — in their own scale
 * first, with the others alongside, so they can see the conversion rather than
 * having it applied to them silently.
 */
export function describeGrade(percent: number, entered: GradeScale, t: Dictionary): string {
  const gpa = percentToGpa(percent).toFixed(1)
  const cls = classificationFor(percent, t)
  if (entered === 'gpa') return t.grades.fromGpa(gpa, percent, cls)
  if (entered === 'percent') return t.grades.fromPercent(percent, gpa, cls)
  return t.grades.fromClass(cls, percent, gpa)
}
