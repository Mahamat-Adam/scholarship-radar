import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { ar } from './ar'
import { en, type Dictionary } from './en'

/**
 * Language, direction, and the things that have to change with them.
 *
 * Country names, month names and number formatting are not translated by hand.
 * `Intl` already knows every country in Arabic, and a hand-kept list of two
 * hundred country names would be two hundred chances to be subtly wrong and out
 * of date. The dictionary is for the words this site chose to say.
 */

export type Lang = 'en' | 'ar'

const DICTIONARIES: Record<Lang, Dictionary> = { en, ar }
const KEY = 'scholarship-radar/lang'

interface Ctx {
  lang: Lang
  t: Dictionary
  dir: 'ltr' | 'rtl'
  setLang: (lang: Lang) => void
  countryName: (cc: string) => string
  monthName: (month: number) => string
  formatDate: (iso: string) => string
  languageName: (english: string) => string
}

const I18nContext = createContext<Ctx | null>(null)

/** The language to start in, from a previous visit or from the browser. */
function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'en' || saved === 'ar') return saved
  } catch {
    /* storage can be disabled; the browser's own preference still works */
  }
  if (typeof navigator !== 'undefined') {
    for (const tag of navigator.languages ?? [navigator.language]) {
      if (tag?.toLowerCase().startsWith('ar')) return 'ar'
    }
  }
  return 'en'
}

/**
 * How the collector labels a page's language, in the reader's own language.
 * The collector writes these in English because that is what it reads them as.
 */
const LANGUAGE_NAMES: Record<Lang, Record<string, string>> = {
  en: {},
  ar: {
    English: 'الإنجليزية',
    Chinese: 'الصينية',
    German: 'الألمانية',
    French: 'الفرنسية',
    Dutch: 'الهولندية',
    Italian: 'الإيطالية',
    Spanish: 'الإسبانية',
    Polish: 'البولندية',
    Hungarian: 'المجرية',
    Turkish: 'التركية',
    Japanese: 'اليابانية',
    Korean: 'الكورية',
    Swedish: 'السويدية',
  },
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang)
  const t = DICTIONARIES[lang]
  const dir = t.dir as 'ltr' | 'rtl'

  // The direction lives on <html>, so it reaches the scrollbar, the form
  // controls and anything rendered outside the React root.
  useEffect(() => {
    const root = document.documentElement
    root.lang = lang
    root.dir = dir
  }, [lang, dir])

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    try {
      localStorage.setItem(KEY, next)
    } catch {
      /* a session-only preference is better than a broken button */
    }
  }, [])

  const value = useMemo<Ctx>(() => {
    const regions = new Intl.DisplayNames([t.locale], { type: 'region' })
    const months = new Intl.DateTimeFormat(t.locale, { month: 'long', timeZone: 'UTC' })
    const dates = new Intl.DateTimeFormat(t.locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
      // Arabic locales default to the Islamic calendar in some runtimes, which
      // would silently print a different date from the one on the university's
      // page. The deadline has to be the deadline they published.
      calendar: 'gregory',
      numberingSystem: 'latn',
    })

    return {
      lang,
      t,
      dir,
      setLang,
      countryName: (cc: string) => {
        if (cc === 'EU') return lang === 'ar' ? 'على مستوى أوروبا' : 'Across Europe'
        try {
          return regions.of(cc.toUpperCase()) ?? cc
        } catch {
          return cc
        }
      },
      monthName: (month: number) => {
        if (!month || month < 1 || month > 12) return ''
        return months.format(new Date(Date.UTC(2026, month - 1, 1)))
      },
      formatDate: (iso: string) => {
        const [y, m, d] = iso.split('-').map(Number)
        if (!y || !m || !d) return iso
        return dates.format(new Date(Date.UTC(y, m - 1, d)))
      },
      languageName: (english: string) => LANGUAGE_NAMES[lang][english] ?? english,
    }
  }, [lang, t, dir, setLang])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): Ctx {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n was called outside the provider')
  return ctx
}
