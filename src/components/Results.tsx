import { useEffect, useMemo } from 'react'
import { SearchX } from 'lucide-react'

import AwardCard from './AwardCard'
import { useI18n } from '../i18n'
import type { ExclusionReason, FilterOutcome, Filters } from '../lib/filters'
import { markSeen } from '../lib/storage'

/**
 * The results, and an honest account of what is missing from them.
 *
 * A filter that quietly removes forty things somebody was eligible for is worse
 * than no filter at all, so every rule that excluded something says so and
 * offers to undo itself. The nationality line matters most: it is the only
 * filter that can hide an award for a reason the visitor cannot see coming.
 */

interface Props {
  outcome: FilterOutcome
  filters: Filters
  onChange: (f: Filters) => void
  onCardChange: () => void
  emptyHint?: string
}

/** Which rules can be lifted from here, and how. */
const UNDO: Partial<Record<ExclusionReason, (f: Filters) => Filters>> = {
  nationality: (f) => ({ ...f, nationality: null }),
  country: (f) => ({ ...f, countries: [] }),
  field: (f) => ({ ...f, fields: [] }),
  tier: (f) => ({ ...f, tiers: [] }),
  selective: (f) => ({ ...f, includeSelective: true }),
  automatic: (f) => ({ ...f, onlyAutomatic: false }),
  grades: (f) => ({ ...f, gradePercent: null }),
  deadline: (f) => ({ ...f, withinDays: null }),
  level: (f) => ({ ...f, level: null }),
  query: (f) => ({ ...f, query: '' }),
}

export default function Results({ outcome, filters, onChange, onCardChange, emptyHint }: Props) {
  const { t } = useI18n()
  const { results, excluded } = outcome

  const shownIds = useMemo(() => results.slice(0, 40).map((a) => a.id), [results])
  useEffect(() => {
    markSeen(shownIds)
  }, [shownIds])

  const hidden = (Object.entries(excluded) as Array<[ExclusionReason, number]>)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm text-muted">{t.results.count(results.length)}</p>
      </div>

      {hidden.length > 0 && (
        <div className="rounded-xl border border-line bg-raise px-4 py-3 text-sm">
          <p className="text-faint">{t.results.hiddenTitle}</p>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
            {hidden.map(([reason, n]) => (
              <li key={reason} className="text-muted">
                <span className="font-semibold text-ink">{n}</span> {t.reasons[reason]}
                {UNDO[reason] && (
                  <button
                    type="button"
                    onClick={() => onChange(UNDO[reason]!(filters))}
                    className="ms-1.5 text-mossdeep underline underline-offset-2 hover:text-moss"
                  >
                    {t.common.show}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {results.length === 0 ? (
        <div className="panel flex flex-col items-center gap-3 px-6 py-14 text-center">
          <SearchX size={28} className="text-faint" />
          <p className="font-display text-lg font-semibold text-ink">{t.results.emptyTitle}</p>
          <p className="max-w-md text-sm text-muted">{emptyHint ?? t.results.emptyBody}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {results.map((a) => (
            <AwardCard key={a.id} award={a} onChange={onCardChange} />
          ))}
        </div>
      )}
    </div>
  )
}
