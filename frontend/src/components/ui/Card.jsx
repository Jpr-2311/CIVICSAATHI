import { cn } from '@/lib/cn'

export default function Card({
  as: Component = 'div',
  className,
  children,
  ...props
}) {
  return (
    <Component
      className={cn(
        'rounded-2xl border border-ink-200/80 bg-white shadow-soft',
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  )
}
