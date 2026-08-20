import { useState } from 'react'
import { GraduationCap, Search, Sparkles } from 'lucide-react'

import CountryMark from './CountryMark'
import { useI18n } from '../i18n'
import { DESTINATIONS, NATIONALITIES, REGIONS } from '../lib/countries'
import { FAMILIES, familiesFor } from '../lib/fields'
import type { GradeScale } from '../lib/grades'
import { classifications, describeGrade, gpaToPercent, percentToGpa } from '../lib/grades'
import type { Filters } from '../lib/filters'
import { EMPTY_FILTERS } from '../lib/filters'
import type { FundingTier, Level } from '../lib/types'

/**
 * The guided search.
 *
 * It asks six questions and writes the answers into the same filter state that
 * browsing uses, so there is one set of rules rather than two that can drift
 * apart. Nothing here is required except the level — every other question can be
 * skipped, and skipping one means "don't narrow on this", never "no".
 *
 * The nationality question is the one that earns the form. Country restrictions
 * are the commonest reason a promising scholarship turns out to be a dead end,
 * and nobody thinks to filter by their own passport.
 */

interface Props {
  onSearch: (filters: Filters) => void
  initial?: Filters | null
}

export default function FindForMe({ onSearch, initial }: Props) {
  const { t, countryName } = useI18n()

  const [level, setLevel] = useState<Level | null>(initial?.level ?? null)
  const [nationality, setNationality] = useState<string>(initial?.nationality ?? '')
  const [countries, setCountries] = useState<string[]>(initial?.countries ?? [])
  const [fields, setFields] = useState<string[]>(initial?.fields ?? [])
  const [tiers, setTiers] = useState<FundingTier[]>(initial?.tiers ?? [])
  const [grade, setGrade] = useState<number | null>(initial?.gradePercent ?? null)
  const [gradeScale, setGradeScale] = useState<GradeScale>('gpa')
  const [subjectQuery, setSubjectQuery] = useState('')

  const suggestions = familiesFor(subjectQuery).slice(0, 4)

  const tierOptions: Array<{ value: FundingTier[]; label: string; hint: string }> = [
    { value: ['full-ride'], label: t.find.coverAll, hint: t.find.coverAllHint },
    { value: ['full-ride', 'full-tuition'], label: t.find.coverTuition, hint: t.find.coverTuitionHint },
    { value: [], label: t.find.coverAny, hint: t.find.coverAnyHint },
  ]

  const nationalityOptions = NATIONALITIES.map((n) => ({ cc: n.cc, label: countryName(n.cc) })).sort(
    (a, b) => a.label.localeCompare(b.label)
  )

  const toggle = (list: string[], value: string, set: (v: string[]) => void) => {
    set(list.includes(value) ? list.filter((x) => x !== value) : [...list, value])
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch({
      ...EMPTY_FILTERS,
      level,
      nationality: nationality || null,
      countries,
      fields,
      tiers,
      gradePercent: grade,
    })
  }

  return (
    <form onSubmit={submit} className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <header className="text-center">
        <p className="inline-flex items-center gap-2 rounded-full border border-moss/40 bg-tint px-3 py-1 text-xs font-semibold text-mossdeep">
          <Sparkles size={13} /> {t.find.badge}
        </p>
        <h1 className="mt-4 font-display text-3xl font-bold text-ink sm:text-4xl">{t.find.title}</h1>
        <p className="mx-auto mt-3 max-w-xl text-muted">{t.find.intro}</p>
      </header>

      {/* 1 — level. The only required answer, because a bachelor's list and a
          master's list have almost nothing in common. */}
      <fieldset className="panel p-5">
        <legend className="label mb-3 px-1">
          <GraduationCap size={15} className="me-1.5 inline" />
          {t.find.levelQ}
        </legend>
        <div className="flex flex-wrap gap-2">
          {(['bachelor', 'master'] as Level[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLevel(level === l ? null : l)}
              className={`chip ${level === l ? 'chip-on' : ''}`}
              aria-pressed={level === l}
            >
              {l === 'bachelor' ? t.find.bachelor : t.find.master}
            </button>
          ))}
        </div>
      </fieldset>

      {/* 2 — nationality, the question that does the most work. */}
      <fieldset className="panel p-5">
        <legend className="label mb-1 px-1">{t.find.nationalityQ}</legend>
        <p className="mb-3 px-1 text-sm text-faint">{t.find.nationalityHelp}</p>
        <select className="field" value={nationality} onChange={(e) => setNationality(e.target.value)}>
          <option value="">{t.find.nationalitySkip}</option>
          {nationalityOptions.map((n) => (
            <option key={n.cc} value={n.cc}>
              {n.label}
            </option>
          ))}
        </select>
      </fieldset>

      {/* 3 — destinations, grouped, because forty-five flat chips is a wall. */}
      <fieldset className="panel p-5">
        <legend className="label mb-1 px-1">{t.find.whereQ}</legend>
        <p className="mb-3 px-1 text-sm text-faint">{t.find.whereHelp}</p>
        <div className="space-y-4">
          {REGIONS.map((region) => (
            <div key={region}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">
                {t.regions[region]}
              </p>
              <div className="flex flex-wrap gap-2">
                {DESTINATIONS.filter((d) => d.region === region).map((d) => (
                  <button
                    key={d.cc}
                    type="button"
                    onClick={() => toggle(countries, d.cc, setCountries)}
                    className={`chip ${countries.includes(d.cc) ? 'chip-on' : ''}`}
                    aria-pressed={countries.includes(d.cc)}
                  >
                    <CountryMark cc={d.cc} />
                    {countryName(d.cc)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </fieldset>

      {/* 4 — subject. Each family shows what is inside it, because "Computing"
          does not tell somebody looking for computer science that they have
          found the right box. */}
      <fieldset className="panel p-5">
        <legend className="label mb-1 px-1">{t.find.subjectQ}</legend>
        <p className="mb-3 px-1 text-sm text-faint">{t.find.subjectHelp}</p>

        <div className="relative mb-4">
          <Search
            size={15}
            className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-faint"
          />
          <input
            className="field ps-9"
            placeholder={t.find.subjectSearch}
            value={subjectQuery}
            onChange={(e) => setSubjectQuery(e.target.value)}
            aria-label={t.find.subjectQ}
          />
          {subjectQuery.trim().length >= 2 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {suggestions.length === 0 ? (
                <p className="text-sm text-faint">{t.find.subjectNoMatch}</p>
              ) : (
                suggestions.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => {
                      if (!fields.includes(f.key)) setFields([...fields, f.key])
                      setSubjectQuery('')
                    }}
                    className="chip border-moss/40 text-mossdeep"
                  >
                    {t.find.subjectAdd(t.fields[f.key as keyof typeof t.fields])}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {FAMILIES.map((f) => {
            const on = fields.includes(f.key)
            const key = f.key as keyof typeof t.fields
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => toggle(fields, f.key, setFields)}
                className={`rounded-xl border p-3 text-start transition-colors ${
                  on ? 'border-moss/50 bg-tint' : 'border-line bg-card hover:border-edge'
                }`}
                aria-pressed={on}
              >
                <span className={`block text-sm font-semibold ${on ? 'text-mossdeep' : 'text-ink'}`}>
                  {t.fields[key]}
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-faint">
                  {(t.fieldExamples[key] ?? []).join(' · ')}
                </span>
              </button>
            )
          })}
        </div>
      </fieldset>

      {/* 5 — how much of it needs paying for. */}
      <fieldset className="panel p-5">
        <legend className="label mb-1 px-1">{t.find.coverQ}</legend>
        <p className="mb-3 px-1 text-sm text-faint">{t.find.coverHelp}</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {tierOptions.map((opt) => {
            const active = JSON.stringify(opt.value) === JSON.stringify(tiers)
            return (
              <button
                key={opt.label}
                type="button"
                onClick={() => setTiers(opt.value)}
                className={`rounded-xl border p-3 text-start transition-colors ${
                  active ? 'border-moss/50 bg-tint' : 'border-line bg-card hover:border-edge'
                }`}
                aria-pressed={active}
              >
                <span className="block text-sm font-semibold text-ink">{opt.label}</span>
                <span className="mt-1 block text-xs text-faint">{opt.hint}</span>
              </button>
            )
          })}
        </div>
      </fieldset>

      {/* 6 — grades, in whatever scale you actually think in.
          A percentage slider was the first attempt and it quietly assumed
          everybody grades the way Britain does. Most of the world does not, and
          being asked to convert your own GPA in your head before you can use a
          filter is precisely the friction this question exists to remove. */}
      <fieldset className="panel p-5">
        <legend className="label mb-1 px-1">{t.find.gradesQ}</legend>
        <p className="mb-4 px-1 text-sm text-faint">{t.find.gradesHelp}</p>

        <div className="mb-4 flex flex-wrap gap-2">
          {(
            [
              ['gpa', t.find.scaleGpa],
              ['percent', t.find.scalePercent],
              ['class', t.find.scaleClass],
            ] as Array<[GradeScale, string]>
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setGradeScale(value)}
              className={`chip py-1 text-xs ${gradeScale === value ? 'chip-on' : ''}`}
              aria-pressed={gradeScale === value}
            >
              {label}
            </button>
          ))}
        </div>

        {gradeScale === 'class' ? (
          <div className="flex flex-wrap gap-2">
            {classifications(t).map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setGrade(grade === c.percent ? null : c.percent)}
                className={`chip ${grade === c.percent ? 'chip-on' : ''}`}
                aria-pressed={grade === c.percent}
              >
                {c.label}
                <span className="text-faint" dir="ltr">
                  {c.note}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-4">
            <input
              type="range"
              min={gradeScale === 'gpa' ? 20 : 40}
              max={gradeScale === 'gpa' ? 40 : 100}
              step={1}
              value={gradeScale === 'gpa' ? Math.round(percentToGpa(grade ?? 60) * 10) : (grade ?? 60)}
              onChange={(e) => {
                const raw = Number(e.target.value)
                setGrade(gradeScale === 'gpa' ? gpaToPercent(raw / 10) : raw)
              }}
              className="h-2 min-w-[200px] flex-1 cursor-pointer appearance-none rounded-full bg-line accent-moss"
              aria-label={t.find.gradesQ}
            />
            <span className="min-w-[6rem] text-lg font-semibold tabular-nums text-ink" dir="ltr">
              {grade === null
                ? '—'
                : gradeScale === 'gpa'
                  ? percentToGpa(grade).toFixed(1)
                  : `${grade}%`}
            </span>
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-xs text-faint">
            {grade === null ? t.find.gradesNotSet : describeGrade(grade, gradeScale, t)}
          </p>
          {grade !== null && (
            <button
              type="button"
              className="text-xs text-faint underline"
              onClick={() => setGrade(null)}
            >
              {t.find.ratherNotSay}
            </button>
          )}
        </div>

        <p className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-faint">
          {t.grades.caveat}
        </p>
      </fieldset>

      <button type="submit" className="btn-primary self-center px-8 py-3 text-base">
        <Search size={18} />
        {t.find.submit}
      </button>
    </form>
  )
}
