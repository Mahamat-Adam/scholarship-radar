import { useState } from 'react'
import {
  ArrowUpRight, BadgeCheck, Bookmark, BookmarkCheck, Building2,
  CalendarClock, ChevronDown, Globe, Quote, Repeat, Server, Timer, Users,
} from 'lucide-react'

import CountryMark from './CountryMark'
import { useI18n } from '../i18n'
import {
  applicationLabel, bandLabel, deadlineLine, hostedPortalOf,
  money, tierLabel, tierTone, verifiedLine,
} from '../lib/format'
import { getPreviousVisit, isSaved, isSeen, toggleSaved } from '../lib/storage'
import type { Award } from '../lib/types'

const TONE_CLASS = {
  urgent: 'text-clay',
  soon: 'text-ember',
  calm: 'text-leaf',
  quiet: 'text-faint',
} as const

const TIER_CLASS = {
  brass: 'border-brass/40 bg-brass/10 text-brass',
  moss: 'border-moss/40 bg-tint text-mossdeep',
  muted: 'border-line bg-raise text-muted',
} as const

interface Props {
  award: Award
  onChange?: () => void
}

export default function AwardCard({ award: a, onChange }: Props) {
  const { t, dir, lang, countryName, formatDate, monthName, languageName } = useI18n()
  const [showEvidence, setShowEvidence] = useState(false)

  const saved = isSaved(a.id)
  const seen = isSeen(a.id)
  const deadline = deadlineLine(a, t, { formatDate, monthName })
  const portal = hostedPortalOf(a.host)

  // The programme descriptions are this site’s own words rather than an
  // institution’s, so unlike an award name they can and should be translated.
  const covers = (lang === 'ar' && a.coversAr) || a.covers
  const note = (lang === 'ar' && a.noteAr) || a.note

  // New since you were last here. Only worth saying to somebody who has been
  // before, so a first visit is not a wall of things labelled new.
  const lastVisit = getPreviousVisit()
  const isNew = Boolean(lastVisit && !seen && a.firstSeen > lastVisit)

  const save = () => {
    toggleSaved(a.id)
    onChange?.()
  }

  return (
    <article
      className={`panel group relative flex flex-col gap-3 p-4 transition-colors sm:p-5 ${
        seen ? 'opacity-75 hover:opacity-100' : ''
      }`}
    >
      {/* What it is worth, and who it is for, before anything else. */}
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
            TIER_CLASS[tierTone(a.funding.tier)]
          }`}
        >
          {tierLabel(a, t)}
        </span>

        {a.funding.amount && (
          <span className="chip py-1 text-xs" dir="ltr">
            {money(a.funding.amount, t)}
          </span>
        )}

        {a.levels.map((l) => (
          <span key={l} className="chip py-1 text-xs">
            {t.levels[l]}
          </span>
        ))}

        {a.application === 'automatic' && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-leaf/50 bg-leaf/10 px-2.5 py-1 text-xs font-semibold text-leaf">
            <BadgeCheck size={13} /> {t.card.noSeparate}
          </span>
        )}

        {a.kind === 'programme' && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-moss/40 bg-tint px-2.5 py-1 text-xs font-semibold text-mossdeep">
            {t.card.programme}
          </span>
        )}

        {isNew && (
          <span className="ms-auto rounded-full bg-leaf/15 px-2.5 py-1 text-xs font-semibold text-leaf">
            {t.card.new}
          </span>
        )}
      </div>

      {/* The award's own name, and the quote further down, stay in the language
          the institution published them in. Translating either would mean
          inventing words a university never wrote. */}
      <div>
        <h3 className="text-base font-semibold leading-snug text-ink sm:text-lg" dir="auto">
          {a.name}
        </h3>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
          <Building2 size={14} className="shrink-0 text-faint" />
          <span dir="auto">{a.institution.name}</span>
          <span className="text-faint">·</span>
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <CountryMark cc={a.institution.cc} /> {countryName(a.institution.cc)}
          </span>
        </p>
      </div>

      {/* dir="auto" because these can be either language: without it an English
          sentence inside the Arabic layout has its full stop dragged to the
          wrong end of the line. */}
      {covers && (
        <p className="text-sm text-muted" dir="auto">
          {covers}
        </p>
      )}
      {note && (
        <p className="text-sm text-faint" dir="auto">
          {note}
        </p>
      )}

      {/* The line people actually scan for. */}
      <p
        className={`flex flex-wrap items-center gap-2 text-sm font-semibold ${TONE_CLASS[deadline.tone]}`}
      >
        <CalendarClock size={15} className="shrink-0" />
        {deadline.text}
        {a.deadline && deadline.tone !== 'quiet' && !deadline.text.includes(formatDate(a.deadline)) && (
          <span className="font-normal text-faint">· {formatDate(a.deadline)}</span>
        )}
      </p>

      {/* Everything you would otherwise have to open the page to find out. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-faint">
        <span className="inline-flex items-center gap-1.5">
          <Users size={12} /> {bandLabel(a.selectivity.band, t)}
        </span>
        {a.selectivity.awardCount !== null && <span>{t.card.available(a.selectivity.awardCount)}</span>}
        {a.funding.renewable && (
          <span className="inline-flex items-center gap-1.5">
            <Repeat size={12} /> {t.card.renewable}
          </span>
        )}
        {a.funding.timeLimited && (
          <span className="inline-flex items-center gap-1.5">
            <Timer size={12} /> {t.card.limited}
          </span>
        )}
        {a.application !== 'automatic' && <span>{applicationLabel(a, t)}</span>}
        {a.requirements.slice(0, 3).map((r) => (
          <span key={r.kind + r.label} dir="ltr">
            {r.label}
          </span>
        ))}
        {a.fields.slice(0, 2).map((f) => (
          <span key={f}>{t.fields[f as keyof typeof t.fields] ?? f}</span>
        ))}
      </div>

      {a.eligibleCountries && a.eligibleCountries.length > 0 && (
        <p className="rounded-lg border border-ember/30 bg-ember/5 px-3 py-2 text-xs text-ember">
          {t.card.onlyFrom(
            a.eligibleCountries.slice(0, 6).join(dir === 'rtl' ? '، ' : ', '),
            a.eligibleCountries.length > 6
          )}
        </p>
      )}

      {a.lang !== 'en' && (
        <p className="flex items-center gap-2 rounded-lg border border-line bg-raise px-3 py-2 text-xs text-muted">
          <Globe size={13} className="shrink-0 text-faint" />
          {t.card.foreignPage(languageName(a.langName))}
        </p>
      )}

      {/* Nothing on this card is asserted without the sentence it came from. */}
      {a.evidence.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowEvidence((v) => !v)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-faint transition-colors hover:text-mossdeep"
            aria-expanded={showEvidence}
          >
            <Quote size={12} />
            {showEvidence ? t.card.hideEvidence : t.card.showEvidence}
            <ChevronDown
              size={12}
              className={`transition-transform ${showEvidence ? 'rotate-180' : ''}`}
            />
          </button>
          {showEvidence && (
            <ul className="mt-2 space-y-2 border-s-2 border-line ps-3">
              {a.evidence.map((e) => (
                <li key={e.quote} className="text-xs leading-relaxed text-muted">
                  <span className="font-semibold text-faint">{e.label}: </span>
                  {/* Quoted verbatim from the source page, in its own language
                      and its own direction, whatever the interface is set to. */}
                  <span className="italic" dir="auto">
                    “{e.quote}”
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {portal && (
        <p className="flex items-center gap-2 rounded-lg border border-line bg-raise px-3 py-2 text-xs text-muted">
          <Server size={13} className="shrink-0 text-faint" />
          {t.card.hostedPortal(a.institution.name, portal)}
        </p>
      )}

      <div className="mt-1 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
        <span className="min-w-0 text-xs text-faint">
          <span className="block truncate font-mono text-[11px] text-muted" dir="ltr">
            {a.host}
          </span>
          {verifiedLine(a, t)}
        </span>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={save}
            className={`btn-ghost px-3 py-2 ${saved ? 'border-brass/50 text-brass' : ''}`}
            aria-pressed={saved}
            aria-label={saved ? t.card.saved : t.card.save}
          >
            {saved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
            <span className="hidden sm:inline">{saved ? t.card.saved : t.card.save}</span>
          </button>

          <a href={a.url} target="_blank" rel="noopener noreferrer" className="btn-primary px-3 py-2">
            {t.card.read}
            <ArrowUpRight size={15} className={dir === 'rtl' ? '-scale-x-100' : ''} />
          </a>
        </div>
      </div>
    </article>
  )
}
