import { useState } from 'react'
import { ChevronDown, RotateCcw, Search, SlidersHorizontal } from 'lucide-react'

import CountryMark from './CountryMark'
import { useI18n } from '../i18n'
import { DESTINATIONS, NATIONALITIES, REGIONS } from '../lib/countries'
import { FAMILIES } from '../lib/fields'
import { percentToGpa } from '../lib/grades'
import type { Filters } from '../lib/filters'
import { EMPTY_FILTERS, isActive } from '../lib/filters'
import type { FundingTier, Level } from '../lib/types'

/**
 * The filters, for people who would rather poke around than answer questions.
 *
 * Countries are grouped and collapsed rather than laid out as forty-five chips:
 * a wall of chips looks thorough and is unusable, and the region a country is in
 * is how people think about this anyway.
 */

interface Props {
  filters: Filters
  onChange: (f: Filters) => void
  counts: Record<string, number>
}

const TIERS: FundingTier[] = ['full-ride', 'full-tuition', 'partial', 'waiver', 'fixed', 'stipend']

export default function FilterBar({ filters, onChange, counts }: Props) {
  const { t, countryName } = useI18n()
  const [open, setOpen] = useState(false)
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch })

  const toggleIn = <T extends string>(list: T[], value: T): T[] =>
    list.includes(value) ? list.filter((x) => x !== value) : [...list, value]

  const windows: Array<[number | null, string]> = [
    [null, t.filters.anyTime],
    [30, t.filters.closingMonth],
    [90, t.filters.closingQuarter],
  ]

  const pickedCountries = filters.countries.length

  return (
    <div className="panel sticky top-2 z-20 flex flex-col gap-3 p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-faint"
          />
          <input
            type="search"
            value={filters.query}
            onChange={(e) => set({ query: e.target.value })}
            placeholder={t.common.search}
            className="field ps-9"
            aria-label={t.common.search}
          />
        </div>

        {(['bachelor', 'master'] as Level[]).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => set({ level: filters.level === l ? null : l })}
            className={`chip ${filters.level === l ? 'chip-on' : ''}`}
            aria-pressed={filters.level === l}
          >
            {t.levels[l]}
          </button>
        ))}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`chip ${open ? 'chip-on' : ''}`}
          aria-expanded={open}
        >
          <SlidersHorizontal size={14} />
          {pickedCountries ? t.common.countriesPicked(pickedCountries) : t.common.moreFilters}
          <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {isActive(filters) && (
          <button
            type="button"
            onClick={() => onChange({ ...EMPTY_FILTERS })}
            className="chip text-faint"
          >
            <RotateCcw size={13} /> {t.common.clear}
          </button>
        )}
      </div>

      {open && (
        <div className="warm-scroll max-h-[60vh] space-y-5 overflow-y-auto border-t border-line pt-4">
          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">
              {t.filters.nationality}
            </p>
            <select
              className="field max-w-sm"
              value={filters.nationality ?? ''}
              onChange={(e) => set({ nationality: e.target.value || null })}
            >
              <option value="">{t.filters.nationalityNone}</option>
              {NATIONALITIES.map((n) => ({ cc: n.cc, label: countryName(n.cc) }))
                .sort((a, b) => a.label.localeCompare(b.label))
                .map((n) => (
                  <option key={n.cc} value={n.cc}>
                    {n.label}
                  </option>
                ))}
            </select>
          </section>

          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">
              {t.filters.where}
            </p>
            <div className="space-y-3">
              {REGIONS.map((region) => {
                const inRegion = DESTINATIONS.filter((d) => d.region === region && counts[d.cc])
                if (!inRegion.length) return null
                return (
                  <div key={region}>
                    <p className="mb-1.5 text-[11px] text-faint">{t.regions[region]}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {inRegion.map((d) => (
                        <button
                          key={d.cc}
                          type="button"
                          onClick={() => set({ countries: toggleIn(filters.countries, d.cc) })}
                          className={`chip py-1 text-xs ${filters.countries.includes(d.cc) ? 'chip-on' : ''}`}
                          aria-pressed={filters.countries.includes(d.cc)}
                        >
                          <CountryMark cc={d.cc} />
                          {countryName(d.cc)}
                          <span className="text-faint">{counts[d.cc]}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">
              {t.filters.funding}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {TIERS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => set({ tiers: toggleIn(filters.tiers, value) })}
                  className={`chip py-1 text-xs ${filters.tiers.includes(value) ? 'chip-on' : ''}`}
                  aria-pressed={filters.tiers.includes(value)}
                >
                  {t.tiers[value]}
                </button>
              ))}
            </div>
          </section>

          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">
              {t.filters.subject}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {FAMILIES.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => set({ fields: toggleIn(filters.fields, f.key) })}
                  className={`chip py-1 text-xs ${filters.fields.includes(f.key) ? 'chip-on' : ''}`}
                  aria-pressed={filters.fields.includes(f.key)}
                  title={(t.fieldExamples[f.key as keyof typeof t.fieldExamples] ?? []).join(' · ')}
                >
                  {t.fields[f.key as keyof typeof t.fields]}
                </button>
              ))}
            </div>
          </section>

          <section className="flex flex-wrap items-center gap-2">
            <p className="w-full text-xs font-semibold uppercase tracking-wide text-faint">
              {t.filters.deadline}
            </p>
            {windows.map(([days, label]) => (
              <button
                key={label}
                type="button"
                onClick={() => set({ withinDays: days })}
                className={`chip py-1 text-xs ${filters.withinDays === days ? 'chip-on' : ''}`}
                aria-pressed={filters.withinDays === days}
              >
                {label}
              </button>
            ))}
          </section>

          <section className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
            <button
              type="button"
              onClick={() => set({ onlyAutomatic: !filters.onlyAutomatic })}
              className={`chip py-1 text-xs ${filters.onlyAutomatic ? 'chip-on' : ''}`}
              aria-pressed={filters.onlyAutomatic}
            >
              {t.filters.onlyAutomatic}
            </button>
            <button
              type="button"
              onClick={() => set({ includeSelective: !filters.includeSelective })}
              className={`chip py-1 text-xs ${filters.includeSelective ? 'chip-on' : ''}`}
              aria-pressed={filters.includeSelective}
            >
              {t.filters.includeSelective}
            </button>
          </section>

          <section className="border-t border-line pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">
              {t.filters.yourGrades}
              <span className="ms-2 font-normal normal-case text-faint">{t.filters.gradesHint}</span>
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="range"
                min={40}
                max={100}
                step={1}
                value={filters.gradePercent ?? 60}
                onChange={(e) => set({ gradePercent: Number(e.target.value) })}
                className="h-2 min-w-[160px] max-w-xs flex-1 cursor-pointer appearance-none rounded-full bg-line accent-moss"
                aria-label={t.filters.yourGrades}
              />
              <span className="text-sm font-semibold tabular-nums text-ink" dir="ltr">
                {filters.gradePercent === null
                  ? t.common.notSet
                  : `${filters.gradePercent}% · GPA ${percentToGpa(filters.gradePercent).toFixed(1)}`}
              </span>
              {filters.gradePercent !== null && (
                <button
                  type="button"
                  className="text-xs text-faint underline"
                  onClick={() => set({ gradePercent: null })}
                >
                  {t.common.clear}
                </button>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
