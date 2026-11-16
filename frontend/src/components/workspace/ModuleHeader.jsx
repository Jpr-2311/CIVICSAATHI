import Badge from '@/components/ui/Badge'
import { cn } from '@/lib/cn'

export default function ModuleHeader({
  icon: Icon,
  eyebrow,
  title,
  description,
  badge,
  actions,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between',
        className,
      )}
    >
      <div className="flex gap-4">
        {Icon ? (
          <span className="hidden h-12 w-12 shrink-0 place-items-center rounded-2xl bg-cream-100 text-brand-800 ring-1 ring-inset ring-ink-200 sm:grid">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
        ) : null}
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            {eyebrow ? (
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-coral-700">
                {eyebrow}
              </p>
            ) : null}
            {badge ? <Badge tone="coral">{badge}</Badge> : null}
          </div>
          <h1 className="mt-2.5 font-display text-[2.05rem] leading-[1.05] text-brand-950 sm:text-[2.65rem]">
            {title}
          </h1>
          {description ? (
            <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
          {actions}
        </div>
      ) : null}
    </div>
  )
}
