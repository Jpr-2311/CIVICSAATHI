import { cn } from '@/lib/cn'

const TONES = {
  neutral: 'bg-cream-100 text-ink-700 ring-ink-200',
  brand: 'bg-brand-50 text-brand-800 ring-brand-200',
  coral: 'bg-coral-50 text-coral-700 ring-coral-200',
  teal: 'bg-teal-50 text-teal-700 ring-teal-200',
  dark: 'bg-white/10 text-cream-100 ring-white/15',
  success: 'bg-teal-50 text-teal-700 ring-teal-200',
  warning: 'bg-amber-50 text-amber-800 ring-amber-200',
  danger: 'bg-rose-50 text-rose-700 ring-rose-200',
  info: 'bg-brand-50 text-brand-700 ring-brand-200',
}

export default function Badge({
  tone = 'neutral',
  className,
  children,
  ...props
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium leading-none ring-1 ring-inset',
        TONES[tone] ?? TONES.neutral,
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
