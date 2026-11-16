import { LoaderCircle } from 'lucide-react'

import { cn } from '@/lib/cn'

const VARIANTS = {
  primary:
    'bg-brand-950 text-cream-50 shadow-[0_12px_24px_-16px_rgba(20,34,53,0.9)] hover:bg-brand-800 active:bg-brand-900',
  secondary:
    'bg-white text-brand-950 ring-1 ring-inset ring-ink-200 hover:bg-cream-50 hover:ring-ink-300',
  accent:
    'bg-coral-500 text-white shadow-[0_12px_24px_-16px_rgba(201,107,70,0.9)] hover:bg-coral-600 active:bg-coral-700',
  soft: 'bg-cream-100 text-brand-950 hover:bg-cream-200',
  ghost: 'text-ink-700 hover:bg-ink-100 hover:text-brand-950',
  dark: 'bg-brand-900 text-cream-50 hover:bg-brand-800',
  white: 'bg-white text-brand-950 hover:bg-cream-100',
  outlineLight:
    'bg-transparent text-cream-50 ring-1 ring-inset ring-cream-50/30 hover:bg-white/10 hover:ring-cream-50/50',
}

const SIZES = {
  sm: 'h-9 gap-1.5 rounded-lg px-3.5 text-sm',
  md: 'h-11 gap-2 rounded-xl px-5 text-sm',
  lg: 'h-12 gap-2 rounded-xl px-6 text-[15px]',
  icon: 'h-10 w-10 rounded-xl',
}

export default function Button({
  as: Component = 'button',
  variant = 'primary',
  size = 'md',
  className,
  loading = false,
  disabled = false,
  children,
  ...props
}) {
  return (
    <Component
      className={cn(
        'inline-flex items-center justify-center font-medium transition-colors duration-200 disabled:pointer-events-none disabled:opacity-60',
        VARIANTS[variant] ?? VARIANTS.primary,
        SIZES[size] ?? SIZES.md,
        className,
      )}
      disabled={Component === 'button' ? disabled || loading : undefined}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <LoaderCircle
          className="h-4 w-4 shrink-0 animate-spin"
          aria-hidden="true"
        />
      ) : null}
      {children}
    </Component>
  )
}
