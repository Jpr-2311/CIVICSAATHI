import { cn } from '@/lib/cn'

const SURFACES = {
  white: 'border-ink-200/70 bg-white',
  cream: 'border-ink-200/70 bg-cream-50',
  teal: 'border-ink-200/70 bg-teal-50/60',
  navy: 'border-brand-950 bg-brand-950 text-cream-100',
}

/**
 * A soft paper card. `surface` chooses the base background instead of letting
 * callers append a conflicting `bg-*` utility that Tailwind may order away.
 */
export default function Card({
  as: Component = 'div',
  surface = 'white',
  className,
  children,
  ...props
}) {
  return (
    <Component
      className={cn(
        'rounded-2xl border shadow-soft',
        SURFACES[surface] ?? SURFACES.white,
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  )
}
