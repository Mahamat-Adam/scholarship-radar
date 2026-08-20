import { useEffect, useMemo, useState } from 'react'
import { Check, Search, ShieldCheck } from 'lucide-react'

import CountryMark from './CountryMark'
import { useI18n } from '../i18n'
import { loadSources } from '../lib/data'
import type { SourceRow, Summary } from '../lib/types'

/**
 * Every institution that has been looked at, and when.
 *
 * Published because "we only link to official pages" is the kind of claim that
 * is easy to make and impossible to check, and a claim nobody can check is worth
 * nothing. The ones that were checked and had no scholarship for international
 * students are listed too — leaving those out would turn this into marketing.
 */

interface Props {
  summary: Summary | null
}

export default function Sources({ summary }: Props) {
  const { t, countryName } = useI18n()
  const [rows, setRows] = useState<SourceRow[] | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let alive = true
    loadSources().then((r) => alive && setRows(r))
    return () => {
      alive = false
    }
  }, [])

  const filtered = useMemo(() => {
    const list = rows ?? []
    const needle = query.trim().toLowerCase()
    const matched = needle
      ? list.filter(
          (r) =>
            r.name.toLowerCase().includes(needle) ||
            r.domain.toLowerCase().includes(needle) ||
            countryName(r.cc).toLowerCase().includes(needle)
        )
      : list
    return [...matched].sort((a, b) => b.awards - a.awards || a.name.localeCompare(b.name))
  }, [rows, query, countryName])

  const withAwards = (rows ?? []).filter((r) => r.awards > 0).length
  const unreachable = (rows ?? []).filter((r) => !r.reachable).length

  const stats: Array<[string, string]> = summary
    ? [
        [t.sources.statOpen, summary.total.toLocaleString('en-GB')],
        [t.sources.statCountries, String(summary.countries)],
        [t.sources.statListed, summary.institutions.toLocaleString('en-GB')],
        [t.sources.statChecked, summary.checked.toLocaleString('en-GB')],
      ]
    : []

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h2 className="font-display text-2xl font-bold text-ink">{t.sources.title}</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">{t.sources.intro}</p>
      </header>

      {stats.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-4">
          {stats.map(([label, value]) => (
            <div key={label} className="panel p-4">
              <p className="font-display text-2xl font-bold text-ink" dir="ltr">
                {value}
              </p>
              <p className="mt-0.5 text-xs text-faint">{label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="panel flex items-start gap-3 p-4">
        <ShieldCheck size={18} className="mt-0.5 shrink-0 text-leaf" />
        <p className="text-sm text-muted">{t.sources.crawler}</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {t.sources.summary(withAwards, (rows ?? []).length)}
          {unreachable > 0 && <> · {t.sources.unreachableCount(unreachable)}</>}
        </p>
        <div className="relative min-w-[220px]">
          <Search
            size={15}
            className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-faint"
          />
          <input
            className="field ps-9"
            placeholder={t.sources.searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={t.sources.searchPlaceholder}
          />
        </div>
      </div>

      {!rows ? (
        <div className="panel p-12 text-center text-muted">{t.sources.loading}</div>
      ) : (
        <div className="panel warm-scroll max-h-[65vh] overflow-y-auto">
          <table className="w-full text-start text-sm">
            <thead className="sticky top-0 bg-card/95 backdrop-blur">
              <tr className="border-b border-line text-xs uppercase tracking-wide text-faint">
                <th className="px-4 py-3 text-start font-semibold">{t.sources.colInstitution}</th>
                <th className="px-4 py-3 text-start font-semibold">{t.sources.colDomain}</th>
                <th className="px-4 py-3 text-start font-semibold">{t.sources.colListings}</th>
                <th className="px-4 py-3 text-start font-semibold">{t.sources.colChecked}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 400).map((r) => (
                <tr key={r.id} className="border-b border-line/60 last:border-0">
                  <td className="px-4 py-2.5 text-ink">
                    <CountryMark cc={r.cc} className="me-2 align-middle" />
                    <span dir="auto">{r.name}</span>
                    {r.movedTo && (
                      <span className="ms-2 text-xs text-faint" dir="ltr">
                        {t.sources.movedTo(r.movedTo)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted" dir="ltr">
                    {r.domain}
                  </td>
                  <td className="px-4 py-2.5">
                    {r.awards > 0 ? (
                      <span className="inline-flex items-center gap-1 text-leaf">
                        <Check size={13} /> {r.awards}
                      </span>
                    ) : r.reachable ? (
                      <span className="text-faint">{t.sources.noneFound}</span>
                    ) : (
                      <span className="text-clay">{t.sources.unreachable}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-faint" dir="ltr">
                    {r.checked}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length > 400 && (
            <p className="px-4 py-3 text-xs text-faint">{t.sources.truncated(400, filtered.length)}</p>
          )}
        </div>
      )}
    </div>
  )
}
