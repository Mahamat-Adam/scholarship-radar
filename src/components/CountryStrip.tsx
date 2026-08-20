import { Globe2 } from 'lucide-react'

import CountryMark from './CountryMark'
import { useI18n } from '../i18n'
import { DESTINATIONS } from '../lib/countries'

/**
 * Countries, one click away.
 *
 * The full country list also lives inside the filter panel, but burying the
 * commonest thing anybody wants to do behind a disclosure triangle is a way of
 * making a site look tidy at the cost of making it slower to use. This is the
 * same state, in front of you.
 *
 * Ordered by how much is actually in each one, so the countries worth looking at
 * are the ones you see first rather than whichever happens to start with A.
 */

interface Props {
  counts: Record<string, number>
  selected: string[]
  onSelect: (countries: string[]) => void
}

export default function CountryStrip({ counts, selected, onSelect }: Props) {
  const { t, countryName } = useI18n()

  const available = DESTINATIONS.filter((d) => counts[d.cc] > 0).sort(
    (a, b) => counts[b.cc] - counts[a.cc] || countryName(a.cc).localeCompare(countryName(b.cc))
  )

  if (available.length === 0) return null

  const toggle = (cc: string) =>
    onSelect(selected.includes(cc) ? selected.filter((x) => x !== cc) : [...selected, cc])

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onSelect([])}
        className={`chip shrink-0 py-1.5 text-xs ${selected.length === 0 ? 'chip-on' : ''}`}
        aria-pressed={selected.length === 0}
      >
        <Globe2 size={14} />
        {t.common.everywhere}
      </button>

      <div className="warm-scroll -my-1 flex gap-1.5 overflow-x-auto py-1">
        {available.map((d) => {
          const on = selected.includes(d.cc)
          return (
            <button
              key={d.cc}
              type="button"
              onClick={() => toggle(d.cc)}
              className={`chip shrink-0 whitespace-nowrap py-1.5 text-xs ${on ? 'chip-on' : ''}`}
              aria-pressed={on}
            >
              <CountryMark cc={d.cc} />
              {countryName(d.cc)}
              <span className={on ? 'text-mossdeep' : 'text-faint'}>{counts[d.cc]}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
