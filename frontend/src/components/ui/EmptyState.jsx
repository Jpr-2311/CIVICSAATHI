import { cn } from '@/lib/cn'

export default function EmptyState({
  icon: Icon,
  title,
  copy,
  action,
  className,
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-dashed border-ink-200 bg-cream-50/70 px-6 py-12 text-center',
        className,
      )}
    >
      {Icon ? (
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-cream-100 text-ink-500 ring-1 ring-inset ring-ink-200">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      ) : null}
      <h3 className="mt-4 text-base font-semibold text-brand-950">{title}</h3>
      {copy ? (
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-500">
          {copy}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}
