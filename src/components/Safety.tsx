import { AlertTriangle, ShieldCheck } from 'lucide-react'

import { useI18n } from '../i18n'

/**
 * The scam page.
 *
 * Scholarship search is one of the more thoroughly preyed-upon corners of the
 * internet, largely because the people using it are young, often abroad, and
 * usually short of money. None of what follows is complicated, which is rather
 * the point — the schemes work on people who have never been told the rules.
 */

export default function Safety() {
  const { t } = useI18n()

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <header>
        <h2 className="font-display text-2xl font-bold text-ink">{t.safety.title}</h2>
        <p className="mt-2 text-sm text-muted">{t.safety.intro}</p>
      </header>

      <div className="panel flex items-start gap-3 border-leaf/40 bg-leaf/5 p-4">
        <ShieldCheck size={20} className="mt-0.5 shrink-0 text-leaf" />
        <div>
          <p className="font-semibold text-ink">{t.safety.ruleTitle}</p>
          <p className="mt-1 text-sm text-muted">{t.safety.ruleBody}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {t.safety.flags.map((f) => (
          <div key={f.title} className="panel p-4">
            <p className="flex items-start gap-2 font-semibold text-ink">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-ember" />
              {f.title}
            </p>
            <p className="mt-2 text-sm text-muted">{f.body}</p>
          </div>
        ))}
      </div>

      <section className="panel p-5">
        <h3 className="font-display text-lg font-semibold text-ink">{t.safety.checkTitle}</h3>
        <ol className="mt-3 list-decimal space-y-2 ps-5 text-sm text-muted">
          <li>{t.safety.check1}</li>
          <li>{t.safety.check2}</li>
          <li>{t.safety.check3}</li>
          <li>{t.safety.check4}</li>
        </ol>
      </section>

      <p className="text-sm text-faint">{t.safety.closing}</p>
    </div>
  )
}
