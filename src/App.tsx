import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react'
import {
  Bookmark, CalendarClock, Compass, Languages, ListFilter, Radar, ShieldCheck, Telescope,
} from 'lucide-react'

import CountryStrip from './components/CountryStrip'
import FilterBar from './components/FilterBar'
import FindForMe from './components/FindForMe'
import Results from './components/Results'
import Saved from './components/Saved'
import Sources from './components/Sources'
import Safety from './components/Safety'
import Upcoming from './components/Upcoming'
import { useI18n } from './i18n'
import { loadAll, loadSummary } from './lib/data'
import type { Filters } from './lib/filters'
import { EMPTY_FILTERS, applyFilters } from './lib/filters'
import { getProfile, saveProfile, stampVisit, subscribe } from './lib/storage'
import type { Award, Summary } from './lib/types'

// three is the one genuinely heavy dependency here, and the page is complete
// without it, so it is fetched separately and only once Browse is on screen.
const DeadlineHorizon = lazy(() => import('./three/DeadlineHorizon'))

type View = 'find' | 'browse' | 'saved' | 'upcoming' | 'sources' | 'safety'

const TAB_ICONS = {
  find: Compass,
  browse: ListFilter,
  saved: Bookmark,
  upcoming: CalendarClock,
  sources: Telescope,
  safety: ShieldCheck,
} as const

const TAB_ORDER: View[] = ['find', 'browse', 'saved', 'upcoming', 'sources', 'safety']

function viewFromHash(): View | null {
  const raw = window.location.hash.replace('#', '')
  return TAB_ORDER.includes(raw as View) ? (raw as View) : null
}

export default function App() {
  const { t, lang, setLang, formatDate } = useI18n()

  const [summary, setSummary] = useState<Summary | null>(null)
  const [awards, setAwards] = useState<Award[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>(() => getProfile() ?? { ...EMPTY_FILTERS })
  const [, forceRender] = useState(0)

  // A returning visitor with a profile goes straight to their results; a new one
  // gets the questions, because a wall of unexplained filters is not a start.
  const [view, setView] = useState<View>(() => viewFromHash() ?? (getProfile() ? 'browse' : 'find'))

  useEffect(() => subscribe(() => forceRender((n) => n + 1)), [])
  useEffect(() => {
    stampVisit()
  }, [])

  useEffect(() => {
    const onHash = () => {
      const next = viewFromHash()
      if (next) setView(next)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const go = useCallback((next: View) => {
    setView(next)
    window.location.hash = next
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    let alive = true
    loadSummary()
      .then(async (s) => {
        if (!alive) return
        setSummary(s)
        const all = await loadAll(s)
        if (alive) setAwards(all)
      })
      .catch((err: Error) => alive && setError(err.message))
    return () => {
      alive = false
    }
  }, [])

  const outcome = useMemo(() => applyFilters(awards ?? [], filters), [awards, filters])

  const onSearch = (next: Filters) => {
    setFilters(next)
    saveProfile(next)
    go('browse')
  }

  const bump = useCallback(() => forceRender((n) => n + 1), [])

  return (
    <div className="min-h-screen">
      <header className="pt-safe sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-3 py-3 sm:px-4">
          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={() => go('find')} className="flex items-center gap-2 text-start">
              <Radar size={22} className="text-moss" />
              <span className="font-display text-lg font-bold tracking-tight text-ink">{t.brand}</span>
            </button>

            <div className="flex items-center gap-3">
              {summary && (
                <p className="hidden text-end text-xs leading-tight text-faint sm:block">
                  <span className="font-semibold text-muted">
                    {summary.total.toLocaleString('en-GB')}
                  </span>{' '}
                  {t.common.open} ·{' '}
                  <span className="font-semibold text-muted">{summary.countries}</span>{' '}
                  {t.common.countries}
                  <br />
                  {t.tagline}
                </p>
              )}

              {/* Two languages, so a toggle rather than a menu. */}
              <button
                type="button"
                onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
                className="chip shrink-0 py-1.5 text-xs"
                aria-label={t.common.language}
                lang={lang === 'ar' ? 'en' : 'ar'}
              >
                <Languages size={14} />
                {lang === 'ar' ? 'English' : 'العربية'}
              </button>
            </div>
          </div>

          <nav className="warm-scroll -mx-1 flex gap-1 overflow-x-auto px-1 pb-0.5">
            {TAB_ORDER.map((id) => {
              const Icon = TAB_ICONS[id]
              const active = view === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => go(id)}
                  className={`chip shrink-0 whitespace-nowrap py-1.5 text-xs sm:text-sm ${
                    active ? 'chip-on' : ''
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon size={14} />
                  {t.nav[id]}
                </button>
              )
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-3 py-6 sm:px-4 sm:py-8">
        {error && (
          <div className="panel border-clay/40 p-6 text-center">
            <p className="font-semibold text-ink">{t.common.loadFailed}</p>
            <p className="mt-2 text-sm text-muted">{error}</p>
          </div>
        )}

        {!error && !awards && (
          <div className="panel flex items-center justify-center gap-3 p-14 text-muted">
            <Radar size={20} className="animate-pulse text-moss" />
            {t.common.loading}
          </div>
        )}

        {awards && view === 'find' && <FindForMe onSearch={onSearch} initial={getProfile()} />}

        {awards && view === 'browse' && summary && (
          <div className="flex flex-col gap-4">
            {outcome.results.length > 0 && (
              <section className="panel relative h-56 overflow-hidden sm:h-72">
                <Suspense fallback={null}>
                  <DeadlineHorizon
                    awards={outcome.results}
                    onSelect={(a) => window.open(a.url, '_blank', 'noopener,noreferrer')}
                  />
                </Suspense>
                <div className="pointer-events-none absolute start-4 top-4 max-w-xs">
                  <p className="font-display text-sm font-semibold text-ink">
                    {t.results.horizonTitle(outcome.results.length.toLocaleString('en-GB'))}
                  </p>
                  <p className="mt-1 text-xs text-faint">{t.results.horizonHint}</p>
                </div>
              </section>
            )}
            <CountryStrip
              counts={summary.counts}
              selected={filters.countries}
              onSelect={(countries) => setFilters({ ...filters, countries })}
            />
            <FilterBar filters={filters} onChange={setFilters} counts={summary.counts} />
            <Results outcome={outcome} filters={filters} onChange={setFilters} onCardChange={bump} />
          </div>
        )}

        {awards && view === 'saved' && <Saved awards={awards} onChange={bump} />}
        {awards && view === 'upcoming' && summary && <Upcoming summary={summary} onChange={bump} />}
        {view === 'sources' && <Sources summary={summary} />}
        {view === 'safety' && <Safety />}
      </main>

      <footer className="mx-auto max-w-5xl px-4 pb-10 pt-4 text-center text-xs text-faint">
        {summary && (
          <p>
            {t.common.builtOn(
              formatDate(summary.built.slice(0, 10)),
              summary.checked.toLocaleString('en-GB')
            )}
          </p>
        )}
        <p className="mt-1">{t.common.footerPrivacy}</p>
      </footer>
    </div>
  )
}
