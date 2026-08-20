import { useEffect, useMemo, useState } from 'react'
import { CalendarClock } from 'lucide-react'

import AwardCard from './AwardCard'
import { useI18n } from '../i18n'
import { loadClosed } from '../lib/data'
import type { Award, Summary } from '../lib/types'

/**
 * The awards that are real but shut.
 *
 * Browse deliberately shows only what somebody can act on today, which leaves a
 * gap: most of the big scholarships close between December and February, and a
 * strictly open-now site looks thin in May and says nothing about what is
 * coming. These are kept and dated instead of deleted, so a plan can be made in
 * the off-season rather than a search repeated in it.
 */

interface Props {
  summary: Summary
  onChange: () => void
}

const MONTH_ORDER = (n: number | null | undefined) => {
  if (!n) return 99
  const now = new Date().getUTCMonth() + 1
  // Months already past this year are next year's, so they sort last.
  return n >= now ? n - now : n + 12 - now
}

export default function Upcoming({ summary, onChange }: Props) {
  const { t, monthName } = useI18n()
  const [closed, setClosed] = useState<Award[] | null>(null)

  useEffect(() => {
    let alive = true
    loadClosed(summary).then((list) => alive && setClosed(list))
    return () => {
      alive = false
    }
  }, [summary])

  const { dated, undated } = useMemo(() => {
    const list = closed ?? []
    const withMonth = list.filter((a) => a.status.reopenMonth)
    const without = list.filter((a) => !a.status.reopenMonth)
    withMonth.sort((a, b) => MONTH_ORDER(a.status.reopenMonth) - MONTH_ORDER(b.status.reopenMonth))
    return { dated: withMonth, undated: without }
  }, [closed])

  if (!closed) {
    return <div className="panel p-12 text-center text-muted">{t.upcoming.loading}</div>
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h2 className="font-display text-2xl font-bold text-ink">{t.upcoming.title}</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">{t.upcoming.intro}</p>
      </header>

      {dated.length > 0 && (
        <section className="flex flex-col gap-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-faint">
            <CalendarClock size={14} /> {t.upcoming.named}
          </h3>
          {dated.slice(0, 60).map((a) => (
            <div key={a.id} className="flex flex-col gap-1.5">
              <p className="text-xs font-semibold text-ember">
                {t.upcoming.reopensIn(monthName(a.status.reopenMonth ?? 0))}
              </p>
              <AwardCard award={a} onChange={onChange} />
            </div>
          ))}
        </section>
      )}

      {undated.length > 0 && (
        <section className="flex flex-col gap-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-faint">
            {t.upcoming.unannounced}
          </h3>
          <p className="-mt-2 text-sm text-faint">{t.upcoming.unannouncedBody}</p>
          {undated.slice(0, 40).map((a) => (
            <div key={a.id} className="flex flex-col gap-1.5">
              <AwardCard award={a} onChange={onChange} />
            </div>
          ))}
        </section>
      )}

      {closed.length === 0 && (
        <div className="panel px-6 py-14 text-center text-muted">{t.upcoming.none}</div>
      )}
    </div>
  )
}
