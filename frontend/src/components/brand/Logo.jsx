import { Link } from 'react-router-dom'

import { cn } from '@/lib/cn'

export function ShieldMark({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 3.2 19.2 5.9v5.2c0 4.4-3 7.7-7.2 9.4-4.2-1.7-7.2-5-7.2-9.4V5.9L12 3.2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M8.6 14.6v-2.2M12 14.6V9.8M15.4 14.6v-3.3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function Logo({
  variant = 'dark',
  showWordmark = true,
  className,
}) {
  const isLight = variant === 'light'

  return (
    <Link
      to="/"
      className={cn('inline-flex items-center gap-2.5', className)}
      aria-label="CIVICSAATHI AI home"
    >
      <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-[11px] bg-gradient-to-br from-brand-400 via-brand-600 to-brand-800 ring-1 ring-inset ring-white/25 shadow-[0_6px_16px_-8px_rgba(20,126,121,0.9)]">
        <ShieldMark className="h-[22px] w-[22px] text-white" />
      </span>
      {showWordmark ? (
        <span className="flex flex-col leading-none">
          <span
            className={cn(
              'text-[14px] font-semibold tracking-[0.01em]',
              isLight ? 'text-white' : 'text-ink-950',
            )}
          >
            CIVICSAATHI{' '}
            <span
              className={cn(
                'font-normal',
                isLight ? 'text-brand-300' : 'text-brand-600',
              )}
            >
              AI
            </span>
          </span>
          <span
            className={cn(
              'mt-1 text-[9px] font-medium uppercase tracking-[0.22em]',
              isLight ? 'text-ink-400' : 'text-ink-400',
            )}
          >
            Civic intelligence
          </span>
        </span>
      ) : null}
    </Link>
  )
}
