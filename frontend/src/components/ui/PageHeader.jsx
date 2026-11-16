import { cn } from '@/lib/cn'

export default function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-coral-700">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-display text-[2.15rem] leading-[1.05] text-brand-950 sm:text-[2.75rem]">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </div>
  )
}
