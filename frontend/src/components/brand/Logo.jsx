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
      <span
        className={cn(
          'relative grid h-9 w-9 place-items-center rounded-xl sm:h-10 sm:w-10 sm:rounded-[13px]',
          isLight ? 'bg-cream-50' : 'bg-brand-950',
        )}
      >
        <ShieldMark
          className={cn(
            'h-5 w-5 sm:h-[22px] sm:w-[22px]',
            isLight ? 'text-brand-950' : 'text-cream-50',
          )}
        />
        <span
          className={cn(
            'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-coral-500 ring-2',
            isLight ? 'ring-brand-950' : 'ring-cream-50',
          )}
          aria-hidden="true"
        />
      </span>
      {showWordmark ? (
        <span className="flex items-baseline gap-1 text-[14px] font-semibold tracking-[0.07em] leading-none sm:text-[15px] sm:tracking-[0.08em]">
          <span className={isLight ? 'text-cream-50' : 'text-brand-950'}>
            CIVICSAATHI
          </span>
          <span className={isLight ? 'text-coral-300' : 'text-coral-600'}>
            AI
          </span>
        </span>
      ) : null}
    </Link>
  )
}
