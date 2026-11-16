import { FileText, Info, Scale, ShieldCheck, Sparkles } from 'lucide-react'

import { ShieldMark } from '@/components/brand/Logo'
import { LANGUAGES, useLanguage } from '@/i18n'
import { cn } from '@/lib/cn'

/**
 * An illustrative product preview, not a live AI call. The language tabs
 * change the whole interface language so the demonstration stays honest:
 * every string comes from the same catalog.
 */
export default function AnswerPreview() {
  const { language, setLanguage, t } = useLanguage()

  return (
    <div className="relative mx-auto max-w-[32rem] lg:max-w-none">
      <div className="overflow-hidden rounded-3xl border border-ink-200 bg-white shadow-lift">
        <div className="flex items-center justify-between gap-3 border-b border-ink-200/70 bg-cream-50 px-4 py-3.5 sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-950 text-cream-50">
              <ShieldMark className="h-[20px] w-[20px]" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-brand-950">
                {t('landing.answer.title')}
              </p>
              <p className="truncate text-[10px] text-ink-400">
                {t('landing.answer.subtitle')}
              </p>
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-coral-50 px-2.5 py-1 text-[10px] font-semibold text-coral-700 ring-1 ring-inset ring-coral-200">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            {t('landing.answer.badge')}
          </span>
        </div>

        <div
          className="flex items-center gap-1 border-b border-ink-200/70 bg-white px-3 py-2"
          role="group"
          aria-label={t('languages.choose')}
        >
          {LANGUAGES.map((option) => {
            const active = language === option.code
            return (
              <button
                key={option.code}
                type="button"
                onClick={() => setLanguage(option.code)}
                aria-pressed={active}
                className={cn(
                  'flex-1 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-colors',
                  active
                    ? 'bg-brand-950 text-cream-50'
                    : 'text-ink-500 hover:bg-cream-100 hover:text-brand-950',
                )}
              >
                {option.nativeLabel}
              </button>
            )
          })}
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          <div className="flex justify-end">
            <div className="max-w-[88%] rounded-2xl rounded-br-md bg-brand-950 px-4 py-3">
              <p className="text-[13px] leading-relaxed text-cream-50">
                {t('landing.answer.question')}
              </p>
            </div>
          </div>

          <div className="rounded-2xl rounded-tl-md border border-ink-200/80 bg-cream-50/70 p-4">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-coral-700">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              {t('common.source')}
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-700">
              {t('landing.answer.answer')}
            </p>

            <div className="mt-3.5 rounded-xl border border-ink-200 bg-white p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-1.5 text-[10px] font-medium tracking-wide text-ink-400">
                  <FileText
                    className="h-3.5 w-3.5 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="truncate">{t('landing.answer.file')}</span>
                </span>
                <span className="shrink-0 rounded-full bg-teal-50 px-2 py-0.5 text-[9px] font-semibold text-teal-700 ring-1 ring-inset ring-teal-200">
                  {t('landing.answer.page')}
                </span>
              </div>
              <p className="mt-2 border-l-2 border-teal-300 pl-2.5 text-[11.5px] italic leading-relaxed text-ink-500">
                {t('landing.answer.excerpt')}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-200/70 pt-3">
            <p className="flex items-center gap-1.5 text-[10px] text-ink-400">
              <Info className="h-3 w-3 shrink-0" aria-hidden="true" />
              {t('landing.answer.disclaimer')}
            </p>
            <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-medium text-teal-700">
              <ShieldCheck className="h-3 w-3" aria-hidden="true" />
              {t('landing.answer.evidence')}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 px-1 text-[11px] text-ink-400">
        <Scale className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        {t('landing.answer.footnote')}
      </div>
    </div>
  )
}
