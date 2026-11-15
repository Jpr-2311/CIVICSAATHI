import { LoaderCircle } from 'lucide-react'

import { cn } from '@/lib/cn'

const VARIANTS = {
  primary:
    'bg-brand-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] hover:bg-brand-700 active:bg-brand-800',
  secondary:
    'bg-white text-ink-800 ring-1 ring-inset ring-ink-200 hover:bg-ink-50 hover:ring-ink-300',
  dark: 'bg-ink-900 text-white hover:bg-ink-800',
  ghost: 'text-ink-700 hover:bg-ink-100 hover:text-ink-900',
  white: 'bg-white text-ink-950 hover:bg-ink-100',
  outlineLight:
    'text-white ring-1 ring-inset ring-white/25 bg-white/[0.02] hover:bg-white/10 hover:ring-white/40',
}

const SIZES = {
  sm: 'h-9 gap-1.5 rounded-lg px-3.5 text-sm',
  md: 'h-11 gap-2 rounded-xl px-5 text-sm',
  lg: 'h-12 gap-2 rounded-xl px-6 text-[15px]',
  icon: 'h-9 w-9 rounded-lg',
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
        'inline-flex select-none items-center justify-center font-medium transition-colors duration-200',
        VARIANTS[variant],
        SIZES[size],
        (disabled || loading) && 'pointer-events-none opacity-60',
        className,
      )}
      disabled={Component === 'button' ? disabled || loading : undefined}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : null}
      {children}
    </Component>
  )
}
