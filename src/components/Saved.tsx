import { useMemo, useRef } from 'react'
import { Bookmark, CalendarPlus, Download, Upload } from 'lucide-react'

import AwardCard from './AwardCard'
import { useI18n } from '../i18n'
import { daysUntil } from '../lib/filters'
import type { Stage } from '../lib/storage'
import { exportBackup, getTracked, importBackup, setStage } from '../lib/storage'
import type { Award } from '../lib/types'

/**
 * The shortlist, and what has happened to each thing on it.
 *
 * Three weeks into a real search nobody remembers who they sent what to, and
 * that is the point at which a list of links stops being useful. The stages and
 * the calendar export exist for that week rather than for the first one.
 */

interface Props {
  awards: Award[]
  onChange: () => void
}

export default function Saved({ awards, onChange }: Props) {
  const { t, formatDate } = useI18n()
  const tracked = getTracked()
  const fileInput = useRef<HTMLInputElement>(null)

  const stages: Array<[Stage, string]> = [
    ['saved', t.saved.stageSaved],
    ['preparing', t.saved.stagePreparing],
    ['submitted', t.saved.stageSubmitted],
    ['outcome', t.saved.stageOutcome],
  ]

  const mine = useMemo(() => {
    const ids = new Set(Object.keys(tracked))
    return awards
      .filter((a) => ids.has(a.id))
      .sort((a, b) => (daysUntil(a.deadline) ?? 9999) - (daysUntil(b.deadline) ?? 9999))
  }, [awards, tracked])

  const download = (name: string, text: string, type: string) => {
    const url = URL.createObjectURL(new Blob([text], { type }))
    const link = document.createElement('a')
    link.href = url
    link.download = name
    link.click()
    URL.revokeObjectURL(url)
  }

  /** One calendar entry per deadline, so they turn up where you already look. */
  const exportCalendar = () => {
    const stamp = (iso: string) => iso.replace(/-/g, '')
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Scholarship Radar//EN',
      'CALSCALE:GREGORIAN',
    ]
    for (const a of mine) {
      if (!a.deadline) continue
      const end = new Date(a.deadline + 'T00:00:00Z')
      end.setUTCDate(end.getUTCDate() + 1)
      lines.push(
        'BEGIN:VEVENT',
        `UID:${a.id}@scholarship-radar`,
        `DTSTART;VALUE=DATE:${stamp(a.deadline)}`,
        `DTEND;VALUE=DATE:${stamp(end.toISOString().slice(0, 10))}`,
        `SUMMARY:${escapeIcs(a.name)}`,
        `DESCRIPTION:${escapeIcs(a.institution.name)}\\n${escapeIcs(a.url)}`,
        `URL:${escapeIcs(a.url)}`,
        'END:VEVENT'
      )
    }
    lines.push('END:VCALENDAR')
    download('scholarship-deadlines.ics', lines.join('\r\n'), 'text/calendar')
  }

  const onImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    file.text().then((text) => {
      const result = importBackup(text)
      if (!result.ok) window.alert(result.message)
      onChange()
    })
    e.target.value = ''
  }

  const withDeadlines = mine.filter((a) => a.deadline).length

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-bold text-ink">{t.saved.heading(mine.length)}</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-ghost"
            onClick={exportCalendar}
            disabled={withDeadlines === 0}
            title={withDeadlines === 0 ? t.saved.noDeadlines : undefined}
          >
            <CalendarPlus size={15} /> {t.saved.calendar}
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => download('scholarship-radar-backup.json', exportBackup(), 'application/json')}
          >
            <Download size={15} /> {t.saved.backup}
          </button>
          <button type="button" className="btn-ghost" onClick={() => fileInput.current?.click()}>
            <Upload size={15} /> {t.saved.restore}
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={onImport}
          />
        </div>
      </div>

      <p className="text-sm text-faint">{t.saved.note}</p>

      {mine.length === 0 ? (
        <div className="panel flex flex-col items-center gap-3 px-6 py-14 text-center">
          <Bookmark size={26} className="text-faint" />
          <p className="font-display text-lg font-semibold text-ink">{t.saved.emptyTitle}</p>
          <p className="max-w-md text-sm text-muted">{t.saved.emptyBody}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {mine.map((a) => {
            const entry = tracked[a.id]
            const days = daysUntil(a.deadline)
            const stale =
              entry.stage === 'submitted' &&
              entry.submittedOn &&
              (Date.now() - new Date(entry.submittedOn).getTime()) / 86_400_000 > 14

            return (
              <div key={a.id} className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  {stages.map(([stage, label]) => (
                    <button
                      key={stage}
                      type="button"
                      onClick={() => {
                        setStage(a.id, stage)
                        onChange()
                      }}
                      className={`chip py-1 text-xs ${entry.stage === stage ? 'chip-on' : ''}`}
                      aria-pressed={entry.stage === stage}
                    >
                      {label}
                    </button>
                  ))}
                  {entry.submittedOn && (
                    <span className="text-xs text-faint">
                      {t.saved.sentOn(formatDate(entry.submittedOn))}
                    </span>
                  )}
                  {days !== null && days >= 0 && days <= 14 && entry.stage !== 'submitted' && (
                    <span className="text-xs font-semibold text-clay">
                      {days === 0 ? t.saved.closesToday : t.saved.daysLeft(days)}
                    </span>
                  )}
                  {stale && <span className="text-xs text-ember">{t.saved.followUp}</span>}
                </div>
                <AwardCard award={a} onChange={onChange} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function escapeIcs(text: string): string {
  return text.replace(/([,;\\])/g, '\\$1').replace(/\r?\n/g, '\\n')
}
