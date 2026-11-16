import {
  CircleAlert,
  CircleCheck,
  Info,
  Sparkles,
  TriangleAlert,
} from 'lucide-react'

import { cn } from '@/lib/cn'

const TONES = {
  preview: {
    container: 'border-coral-200 bg-coral-50/80 text-coral-900',
    icon: 'bg-coral-100 text-coral-700',
    Icon: Sparkles,
  },
  info: {
    container: 'border-brand-200 bg-brand-50/80 text-brand-900',
    icon: 'bg-brand-100 text-brand-700',
    Icon: Info,
  },
  success: {
    container: 'border-teal-200 bg-teal-50/80 text-teal-900',
    icon: 'bg-teal-100 text-teal-700',
    Icon: CircleCheck,
  },
  warning: {
    container: 'border-amber-200 bg-amber-50/80 text-amber-950',
    icon: 'bg-amber-100 text-amber-700',
    Icon: TriangleAlert,
  },
  danger: {
    container: 'border-rose-200 bg-rose-50/80 text-rose-950',
    icon: 'bg-rose-100 text-rose-700',
    Icon: CircleAlert,
  },
}

export default function Notice({
  tone = 'info',
  title,
  icon: IconOverride,
  className,
  children,
  ...props
}) {
  const meta = TONES[tone] ?? TONES.info
  const Icon = IconOverride ?? meta.Icon

  return (
    <div
      role={tone === 'danger' ? 'alert' : undefined}
      className={cn(
        'flex gap-3 rounded-2xl border px-4 py-4',
        meta.container,
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          'grid h-8 w-8 shrink-0 place-items-center rounded-lg',
          meta.icon,
        )}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        {title ? (
          <p className="text-sm font-semibold leading-snug">{title}</p>
        ) : null}
        {children ? (
          <div
            className={cn(
              'text-sm leading-relaxed',
              title ? 'mt-1 opacity-90' : '',
            )}
          >
            {children}
          </div>
        ) : null}
      </div>
    </div>
  )
}
