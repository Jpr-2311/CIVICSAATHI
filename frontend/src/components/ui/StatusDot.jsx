import { cn } from '@/lib/cn'

const TONES = {
  ok: 'text-teal-500',
  ready: 'text-teal-500',
  online: 'text-teal-500',
  pending: 'text-amber-500',
  loading: 'text-ink-300',
  not_configured: 'text-ink-400',
  error: 'text-rose-500',
  offline: 'text-rose-500',
}

/**
 * Small status dot with an optional ping animation. The tone lives on the
 * wrapper so both the dot and ping inherit the same colour.
 */
export default function StatusDot({ status = 'ok', pulse = false, className }) {
  return (
    <span
      className={cn(
        'relative flex h-2 w-2 shrink-0',
        TONES[status] || TONES.not_configured,
        className,
      )}
      aria-hidden="true"
    >
      {pulse ? (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
      ) : null}
      <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
    </span>
  )
}
