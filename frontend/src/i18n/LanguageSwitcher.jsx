import { useId } from 'react'
import { ChevronDown, Globe2 } from 'lucide-react'

import { LANGUAGES } from '@/i18n/languages'
import { useLanguage } from '@/i18n/context'
import { cn } from '@/lib/cn'

const TONES = {
  light: {
    control:
      'border-ink-200 bg-white text-brand-950 hover:border-ink-300 focus-within:border-coral-500 focus-within:ring-2 focus-within:ring-coral-500/20',
    icon: 'text-ink-400',
  },
  dark: {
    control:
      'border-white/20 bg-white/5 text-cream-50 hover:border-white/35 focus-within:border-coral-300 focus-within:ring-2 focus-within:ring-coral-300/25',
    icon: 'text-cream-200/70',
  },
  plain: {
    control:
      'border-transparent bg-transparent text-ink-700 hover:text-brand-950 focus-within:border-coral-500',
    icon: 'text-ink-400',
  },
}

export default function LanguageSwitcher({
  tone = 'light',
  className,
  showLabel = false,
  compact = false,
}) {
  const { language, languageMeta, setLanguage, t } = useLanguage()
  const selectId = useId()
  const meta = TONES[tone] ?? TONES.light

  const select = (
    <select
      id={compact ? undefined : selectId}
      value={language}
      onChange={(event) => setLanguage(event.target.value)}
      aria-label={t('languages.choose')}
      className={cn(
        'cursor-pointer text-xs font-medium transition-colors',
        compact
          ? 'absolute inset-0 h-full w-full appearance-none opacity-0'
          : cn(
              'h-9 appearance-none rounded-lg border py-0 pl-8 pr-8 [&_option]:text-ink-900',
              meta.control,
            ),
      )}
    >
      {LANGUAGES.map((option) => (
        <option key={option.code} value={option.code}>
          {option.nativeLabel}
        </option>
      ))}
    </select>
  )

  if (compact) {
    return (
      <div
        className={cn(
          'relative inline-flex h-9 items-center overflow-hidden rounded-lg border transition-colors',
          meta.control,
          className,
        )}
      >
        <Globe2
          className={cn(
            'pointer-events-none absolute left-2.5 h-3.5 w-3.5',
            meta.icon,
          )}
          aria-hidden="true"
        />
        <span
          aria-hidden="true"
          className="pl-7 pr-5 text-xs font-semibold"
        >
          {languageMeta.shortLabel}
        </span>
        <ChevronDown
          className={cn(
            'pointer-events-none absolute right-2 h-3.5 w-3.5',
            meta.icon,
          )}
          aria-hidden="true"
        />
        {select}
      </div>
    )
  }

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      {showLabel ? (
        <label
          htmlFor={selectId}
          className="hidden text-xs font-medium text-ink-500 sm:block"
        >
          {t('languages.label')}
        </label>
      ) : null}

      <div className="relative inline-flex items-center">
        <Globe2
          className={cn(
            'pointer-events-none absolute left-3 h-3.5 w-3.5',
            meta.icon,
          )}
          aria-hidden="true"
        />
        {select}
        <ChevronDown
          className={cn(
            'pointer-events-none absolute right-2.5 h-3.5 w-3.5',
            meta.icon,
          )}
          aria-hidden="true"
        />
      </div>
    </div>
  )
}
