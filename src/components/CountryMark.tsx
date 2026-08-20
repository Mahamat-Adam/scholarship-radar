import { useI18n } from '../i18n'

/**
 * A country's two-letter code, as a small badge.
 *
 * Flag emoji were the obvious choice and are the wrong one: Windows ships no
 * flag glyphs at all, so a flag renders there as the bare letter pair — which
 * happens to look almost deliberate, and is the sort of "almost" that makes a
 * site feel unfinished. A design that is the same on every machine beats one
 * that is prettier on some of them.
 *
 * The code stays in Latin letters in both languages. ISO country codes are not
 * translated, and an Arabic reader looking for `GB` on a university's own site
 * will find `GB` there too.
 */

interface Props {
  cc: string
  className?: string
}

export default function CountryMark({ cc, className = '' }: Props) {
  const { countryName } = useI18n()
  const code = (cc || '').toUpperCase()
  return (
    <span
      dir="ltr"
      title={countryName(cc)}
      className={`inline-flex min-w-[1.9rem] items-center justify-center rounded border border-line/80 bg-paper/60 px-1 py-px font-mono text-[10px] font-semibold leading-tight tracking-wider text-faint ${className}`}
    >
      {code}
    </span>
  )
}
