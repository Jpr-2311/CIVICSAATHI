import { cn } from '@/lib/cn'

/**
 * Rendered as a block-level span so it is safe inside paragraphs and other
 * phrasing-content containers.
 */
export default function Skeleton({ className }) {
  return (
    <span
      className={cn('block animate-pulse rounded-md bg-ink-100', className)}
      aria-hidden="true"
    />
  )
}
