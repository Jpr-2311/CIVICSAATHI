import { Link, useOutletContext } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Clock,
  FileText,
  Languages,
  Layers,
  ListChecks,
  MessagesSquare,
  RefreshCw,
  Search,
  ShieldCheck,
} from 'lucide-react'

import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Notice from '@/components/ui/Notice'
import PageHeader from '@/components/ui/PageHeader'
import Skeleton from '@/components/ui/Skeleton'
import StatusDot from '@/components/ui/StatusDot'
import { LANGUAGES, useLanguage, useMessages } from '@/i18n'
import { API_PREFIX, apiBaseUrl } from '@/services/api'
import { cn } from '@/lib/cn'

const QUICK_ACTIONS = [
  { id: 'schemes', to: '/app/schemes', icon: Search, status: 'live' },
  {
    id: 'eligibility',
    to: '/app/eligibility',
    icon: ListChecks,
    status: 'live',
  },
  {
    id: 'assistant',
    to: '/app/assistant',
    icon: MessagesSquare,
    status: 'preview',
  },
  { id: 'documents', to: '/app/documents', icon: FileText, status: 'preview' },
]

const READINESS_TONES = {
  ready: 'success',
  degraded: 'warning',
  not_ready: 'danger',
}

export default function DashboardPage() {
  const { system } = useOutletContext()
  const { state, refresh, refreshing } = system
  const { health, readiness, latencyMs, error, status } = state
  const { t, language, locale, setLanguage } = useLanguage()
  const copy = useMessages()

  const checkedLabel = state.checkedAt
    ? new Date(state.checkedAt).toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  const apiValue =
    status === 'loading'
      ? copy.dashboard.snapshot.connecting
      : status === 'error'
        ? copy.dashboard.snapshot.offline
        : copy.dashboard.snapshot.online

  const readinessMeta = readiness?.status ? READINESS_TONES[readiness.status] : null
  const readinessLabel = readiness?.status
    ? (copy.dashboard.status.readiness[readiness.status] ?? null)
    : null

  return (
    <div>
      <PageHeader
        eyebrow={copy.dashboard.eyebrow}
        title={
          <span>
            <span className="mb-2 block font-sans text-lg font-semibold tracking-normal text-coral-700 sm:text-xl">
              {copy.dashboard.greeting}
            </span>
            {copy.dashboard.title}
          </span>
        }
        description={copy.dashboard.description}
        actions={
          <Badge tone="teal" className="h-7 px-3">
            {t('shell.foundation')}
          </Badge>
        }
      />

      {status === 'error' ? (
        <Notice
          tone="danger"
          title={copy.dashboard.offline.title}
          className="mt-6"
        >
          <p>{copy.dashboard.offline.copy}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={refresh}
              loading={refreshing}
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              {copy.dashboard.offline.retry}
            </Button>
          </div>
          <details className="mt-3 text-xs opacity-90">
            <summary className="cursor-pointer font-medium">
              {copy.dashboard.offline.details}
            </summary>
            {error?.message ? (
              <p className="mt-2 break-words font-mono text-[11px] leading-relaxed">
                {error.message}
              </p>
            ) : null}
            <p className="mt-3 font-medium">
              {copy.dashboard.offline.command}
            </p>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-brand-950 px-4 py-3 text-[11px] leading-relaxed text-cream-200">
              <code>{`cd backend\n.\\.venv\\Scripts\\Activate.ps1\nuvicorn app.main:app --reload --port 8000`}</code>
            </pre>
          </details>
        </Notice>
      ) : null}

      <section className="mt-10" aria-labelledby="quick-actions-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="quick-actions-heading"
              className="font-display text-2xl text-brand-950"
            >
              {copy.dashboard.quick.title}
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              {copy.dashboard.quick.copy}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {QUICK_ACTIONS.map((action, index) => {
            const item = copy.dashboard.quick.items[action.id]
            const Icon = action.icon
            const featured = index === 0
            return (
              <Link
                key={action.id}
                to={action.to}
                className={cn(
                  'group flex flex-col rounded-2xl border p-5 transition duration-200',
                  featured
                    ? 'border-brand-950 bg-brand-950 text-cream-50 hover:bg-brand-900'
                    : 'border-ink-200/70 bg-white text-ink-700 shadow-soft hover:-translate-y-0.5 hover:border-ink-300 hover:shadow-lift',
                )}
              >
                <span
                  className={cn(
                    'grid h-10 w-10 place-items-center rounded-xl',
                    featured
                      ? 'bg-white/10 text-coral-300'
                      : 'bg-cream-100 text-brand-800',
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                </span>
                <h3
                  className={cn(
                    'mt-4 text-[15px] font-semibold',
                    featured ? 'text-cream-50' : 'text-brand-950',
                  )}
                >
                  {item.title}
                </h3>
                <p
                  className={cn(
                    'mt-1.5 text-sm leading-relaxed',
                    featured ? 'text-cream-200/70' : 'text-ink-500',
                  )}
                >
                  {item.copy}
                </p>
                <span
                  className={cn(
                    'mt-auto inline-flex items-center gap-1.5 pt-4 text-xs font-semibold',
                    featured ? 'text-coral-300' : 'text-coral-700',
                  )}
                >
                  {action.status === 'live'
                    ? t('common.live')
                    : t('common.preview')}
                  <ArrowRight
                    className="h-3.5 w-3.5 transition group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            )
          })}
        </div>
      </section>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-5 lg:items-start">
        <Card className="p-5 sm:p-6 lg:col-span-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cream-100 text-brand-800">
                <Activity className="h-[18px] w-[18px]" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-brand-950">
                  {copy.dashboard.status.title}
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-ink-500">
                  {copy.dashboard.status.copy}
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={refresh}
              loading={refreshing}
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              {copy.dashboard.status.refresh}
            </Button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            <div className="rounded-xl border border-ink-200/70 bg-cream-50 px-3 py-3">
              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-ink-400">
                {copy.dashboard.snapshot.api}
              </p>
              <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-brand-950">
                <StatusDot
                  status={
                    status === 'error'
                      ? 'offline'
                      : status === 'loading'
                        ? 'loading'
                        : 'online'
                  }
                  pulse={status === 'loading'}
                />
                {apiValue}
              </p>
              <p className="mt-1 text-[10px] text-ink-400">
                {health ? `FastAPI · v${health.version}` : 'FastAPI'}
              </p>
            </div>

            <div className="rounded-xl border border-ink-200/70 bg-cream-50 px-3 py-3">
              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-ink-400">
                {copy.dashboard.status.latency}
              </p>
              <p className="mt-2 text-sm font-semibold text-brand-950">
                {status === 'ready' && latencyMs != null
                  ? `${latencyMs} ms`
                  : '—'}
              </p>
              <p className="mt-1 text-[10px] text-ink-400">
                {copy.dashboard.status.checked}
              </p>
            </div>

            <div className="col-span-2 rounded-xl border border-ink-200/70 bg-cream-50 px-3 py-3 sm:col-span-1">
              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-ink-400">
                {copy.dashboard.status.readinessTitle}
              </p>
              <p className="mt-2">
                {readinessLabel ? (
                  <Badge tone={readinessMeta ?? 'neutral'}>
                    {readinessLabel}
                  </Badge>
                ) : status === 'loading' ? (
                  <Skeleton className="h-5 w-20" />
                ) : (
                  <span className="text-sm font-semibold text-brand-950">—</span>
                )}
              </p>
              <p className="mt-1 text-[10px] text-ink-400">
                {checkedLabel
                  ? `${copy.dashboard.status.checked} ${checkedLabel}`
                  : copy.dashboard.status.awaiting}
              </p>
            </div>
          </div>

          <details className="group mt-4 rounded-xl border border-ink-200/70">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3.5 py-3 text-xs font-medium text-ink-600 [&::-webkit-details-marker]:hidden">
              <span className="inline-flex items-center gap-2">
                <Layers className="h-3.5 w-3.5" aria-hidden="true" />
                {copy.dashboard.status.details}
              </span>
              <ChevronDown
                className="h-3.5 w-3.5 transition group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <div className="border-t border-ink-200/70 px-3.5 py-3">
              {status === 'error' ? (
                <p className="text-xs leading-relaxed text-ink-500">
                  {copy.dashboard.status.unavailable}
                </p>
              ) : readiness?.checks?.length ? (
                <ul className="divide-y divide-ink-100">
                  {readiness.checks.map((check) => (
                    <li key={check.id} className="flex gap-3 py-2.5 first:pt-0 last:pb-0">
                      <StatusDot status={check.status} className="mt-1.5" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-medium text-ink-800">
                            {copy.dashboard.status.checks[check.id] ?? check.label}
                          </p>
                          <span className="shrink-0 text-[9px] font-medium uppercase tracking-[0.1em] text-ink-400">
                            {copy.dashboard.status.checkStatus[check.status] ??
                              check.status}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-ink-500">
                          {check.detail}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : status === 'loading' ? (
                <div className="space-y-3">
                  {[0, 1, 2].map((row) => (
                    <div key={row} className="flex gap-3">
                      <Skeleton className="mt-1.5 h-2 w-2 rounded-full" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-2.5 w-1/3" />
                        <Skeleton className="h-2 w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs leading-relaxed text-ink-500">
                  {copy.dashboard.status.unavailable}
                </p>
              )}

              <div className="mt-3 flex items-center justify-between gap-3 border-t border-ink-100 pt-3">
                <p className="text-[10px] text-ink-400">
                  {readiness && status !== 'error'
                    ? `${copy.dashboard.status.checked} ${new Date(
                        readiness.checked_at,
                      ).toLocaleTimeString(locale, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}`
                    : `GET ${API_PREFIX}/health/readiness`}
                </p>
                <a
                  href={`${apiBaseUrl}${API_PREFIX}/health/readiness`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] font-medium text-ink-500 transition hover:text-brand-950"
                >
                  {copy.dashboard.status.raw}
                  <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                </a>
              </div>
            </div>
          </details>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          <Card
            surface="navy"
            className="relative overflow-hidden p-5 sm:p-6"
          >
            <div
              className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full border-[20px] border-white/5"
              aria-hidden="true"
            />
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-coral-300">
              {copy.dashboard.plan.nextLabel}
            </p>
            <h2 className="mt-2 font-display text-2xl leading-tight text-cream-50">
              {copy.dashboard.plan.items[2].title}
            </h2>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-cream-200/70">
              {copy.dashboard.plan.nextCopy}
            </p>
            <Button
              as={Link}
              to="/app/documents"
              variant="white"
              size="sm"
              className="mt-4"
            >
              {copy.dashboard.plan.nextCta}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </Card>

          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Languages className="h-4 w-4 text-ink-400" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-brand-950">
                {copy.dashboard.language.title}
              </h2>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-500">
              {copy.dashboard.language.copy}
            </p>

            <div className="mt-3 space-y-2">
              {LANGUAGES.map((option) => {
                const selected = language === option.code
                return (
                  <button
                    key={option.code}
                    type="button"
                    onClick={() => setLanguage(option.code)}
                    aria-pressed={selected}
                    className={cn(
                      'flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition',
                      selected
                        ? 'border-teal-300 bg-teal-50/60'
                        : 'border-ink-200 bg-white hover:border-ink-300 hover:bg-cream-50',
                    )}
                  >
                    <span
                      className={cn(
                        'text-sm font-medium text-brand-950',
                        option.fontClass,
                      )}
                    >
                      {option.nativeLabel}
                    </span>
                    {selected ? (
                      <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold text-teal-700">
                        <Check className="h-3 w-3" aria-hidden="true" />
                        {t('common.selected')}
                      </span>
                    ) : (
                      <ArrowRight
                        className="h-3.5 w-3.5 shrink-0 text-ink-300"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                )
              })}
            </div>

            <p className="mt-3 text-[11px] leading-relaxed text-ink-400">
              {copy.dashboard.language.hint}
            </p>
          </Card>
        </div>
      </div>

      <Card className="mt-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-ink-400" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-brand-950">
              {copy.dashboard.plan.title}
            </h2>
          </div>
          <p className="text-[11px] text-ink-400">
            {copy.dashboard.plan.copy}
          </p>
        </div>

        <ol className="mt-4 flex flex-wrap gap-2">
          {copy.dashboard.plan.items.map((item) => (
            <li key={item.day}>
              <span
                aria-current={item.state === 'current' ? 'step' : undefined}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium ring-1 ring-inset',
                  item.state === 'done'
                    ? 'bg-teal-50 text-teal-800 ring-teal-200'
                    : item.state === 'current'
                      ? 'bg-coral-50 text-coral-800 ring-coral-200'
                      : 'bg-cream-100 text-ink-500 ring-ink-200',
                )}
              >
                {item.state === 'done' ? (
                  <Check className="h-3 w-3" aria-hidden="true" />
                ) : (
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      item.state === 'current' ? 'bg-coral-500' : 'bg-ink-300',
                    )}
                    aria-hidden="true"
                  />
                )}
                {item.day} · {item.title}
              </span>
            </li>
          ))}
        </ol>
      </Card>

      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-ink-200/70 pt-5 text-[11px] text-ink-500">
        <span className="inline-flex items-center gap-1.5 font-semibold uppercase tracking-[0.14em] text-ink-400">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          {copy.dashboard.trust.title}
        </span>
        {copy.dashboard.trust.items.map((item) => (
          <span key={item} className="inline-flex items-center gap-1.5">
            <Check
              className="h-3.5 w-3.5 text-teal-600"
              aria-hidden="true"
            />
            {item}
          </span>
        ))}
      </div>

      <p className="mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-[11px] leading-relaxed text-ink-400">
        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
        CIVICSAATHI AI · v{health?.version ?? '0.2.0'} ·{' '}
        {health?.environment ?? 'development'}
        <span aria-hidden="true">—</span>
        {copy.dashboard.footer}
      </p>
    </div>
  )
}
