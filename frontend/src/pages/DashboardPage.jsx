import { Link, useOutletContext } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Check,
  CircleAlert,
  Clock,
  Gauge,
  Languages,
  Layers,
  RefreshCw,
} from 'lucide-react'

import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import PageHeader from '@/components/ui/PageHeader'
import Skeleton from '@/components/ui/Skeleton'
import StatusDot from '@/components/ui/StatusDot'
import { MODULES } from '@/data/modules'
import { API_PREFIX, apiBaseUrl } from '@/services/api'
import { cn } from '@/lib/cn'

const CHECK_LABELS = {
  ok: 'Operational',
  pending: 'Pending',
  not_configured: 'Not configured',
  error: 'Error',
}

const READINESS = {
  ready: { label: 'Ready', tone: 'success' },
  degraded: { label: 'Degraded', tone: 'warning' },
  not_ready: { label: 'Not ready', tone: 'danger' },
}

const TIMELINE = [
  {
    day: 'Day 1',
    title: 'Foundation',
    detail: 'Routing, design system, live API status',
    state: 'done',
  },
  {
    day: 'Day 2',
    title: 'Schemes & eligibility',
    detail: 'Curated dataset, deterministic rules',
    state: 'current',
  },
  {
    day: 'Day 3',
    title: 'Document intelligence',
    detail: 'PDFs, embeddings, ChromaDB retrieval',
    state: 'next',
  },
  {
    day: 'Day 4',
    title: 'Evidence-backed assistant',
    detail: 'Gemini answers with page citations',
    state: 'next',
  },
  {
    day: 'Day 5',
    title: 'Bilingual journey',
    detail: 'Malayalam interface and end-to-end UX',
    state: 'next',
  },
]

function StatCard({ icon: Icon, label, value, hint, dotStatus, pulse }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-ink-500">{label}</span>
        <Icon className="h-4 w-4 text-ink-300" aria-hidden="true" />
      </div>
      <p className="mt-3 flex items-center gap-2 text-xl font-semibold tracking-tight text-ink-950">
        {dotStatus ? (
          <StatusDot status={dotStatus} pulse={pulse} />
        ) : null}
        {value}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-ink-400">{hint}</p>
    </Card>
  )
}

export default function DashboardPage() {
  const { system } = useOutletContext()
  const { state, refresh, refreshing } = system
  const { health, readiness, latencyMs, error, status } = state

  const checkedLabel = state.checkedAt
    ? new Date(state.checkedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  const apiValue =
    status === 'loading'
      ? 'Connecting'
      : status === 'error'
        ? 'Unreachable'
        : 'Operational'

  const apiHint =
    status === 'error'
      ? 'Start the FastAPI server to reconnect.'
      : health
        ? `FastAPI · v${health.version}`
        : 'FastAPI backend'

  const readinessMeta =
    readiness && status !== 'error'
      ? READINESS[readiness.status] ?? READINESS.degraded
      : null

  return (
    <div>
      <PageHeader
        eyebrow="Workspace · Kerala pilot"
        title="Your civic workspace"
        description="The foundation is live: routing, design system, API client and real backend telemetry. Scheme intelligence and the evidence-backed assistant arrive next."
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={refresh}
            loading={refreshing}
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Refresh status
          </Button>
        }
      />

      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-ink-400">
        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
        {checkedLabel
          ? `Last checked at ${checkedLabel} · auto-refreshes every 30s`
          : 'Waiting for the first backend response'}
      </p>

      {status === 'error' ? (
        <div
          role="alert"
          className="mt-6 rounded-2xl border border-rose-200 bg-rose-50/80 p-5"
        >
          <div className="flex gap-3">
            <CircleAlert
              className="mt-0.5 h-5 w-5 shrink-0 text-rose-600"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-rose-900">
                Backend not connected
              </p>
              <p className="mt-1 text-sm leading-relaxed text-rose-800">
                {error?.message ||
                  'The CIVICSAATHI API could not be reached.'}
              </p>
              <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.14em] text-rose-700">
                Start the API in a second terminal
              </p>
              <pre className="mt-2 overflow-x-auto rounded-lg bg-ink-950 px-4 py-3 text-[11px] leading-relaxed text-ink-200">
                <code>{`cd backend\n.\\.venv\\Scripts\\Activate.ps1\nuvicorn app.main:app --reload --port 8000`}</code>
              </pre>
              <button
                type="button"
                onClick={refresh}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-rose-800 underline decoration-rose-300 underline-offset-4 hover:text-rose-950"
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                Retry connection
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Activity}
          label="API status"
          value={apiValue}
          hint={apiHint}
          dotStatus={
            status === 'error'
              ? 'offline'
              : status === 'loading'
                ? 'loading'
                : 'online'
          }
          pulse={status === 'loading'}
        />
        <StatCard
          icon={Gauge}
          label="Response time"
          value={
            status === 'ready' && latencyMs != null ? `${latencyMs} ms` : '—'
          }
          hint="Live health probe"
        />
        <StatCard
          icon={Layers}
          label="Build progress"
          value="Day 1 / 7"
          hint="Foundation complete · schemes next"
        />
        <StatCard
          icon={Languages}
          label="Languages"
          value="2"
          hint={
            <>
              English + <span className="font-malayalam">മലയാളം</span>
            </>
          }
        />
      </div>

      <section className="mt-10" aria-labelledby="modules-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="modules-heading"
              className="text-lg font-semibold tracking-tight text-ink-950"
            >
              Civic modules
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              Four connected modules, one evidence-first workflow.
            </p>
          </div>
          <Badge tone="brand">Foundation live</Badge>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {MODULES.map((module) => {
            const Icon = module.icon
            return (
              <Link
                key={module.id}
                to={`/app/${module.path}`}
                className="group flex flex-col rounded-2xl border border-ink-200/80 bg-white p-5 shadow-soft transition duration-300 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lift"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <Badge
                    tone={module.status === 'next' ? 'warning' : 'neutral'}
                  >
                    {module.milestone}
                  </Badge>
                </div>
                <h3 className="mt-4 text-[15px] font-semibold text-ink-950">
                  {module.name}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-500">
                  {module.summary}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-brand-700">
                  Preview module
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

      <div className="mt-8 grid gap-4 lg:grid-cols-5">
        <Card className="p-5 sm:p-6 lg:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Activity
                className="h-4 w-4 text-ink-400"
                aria-hidden="true"
              />
              <h2 className="text-sm font-semibold text-ink-950">
                System checks
              </h2>
            </div>
            {readinessMeta ? (
              <Badge tone={readinessMeta.tone}>{readinessMeta.label}</Badge>
            ) : (
              <Badge tone={status === 'error' ? 'danger' : 'neutral'}>
                {status === 'error' ? 'Unavailable' : 'Awaiting report'}
              </Badge>
            )}
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-ink-500">
            Live dependency report. AI and database integrations connect in
            later milestones, so a degraded state is expected on Day 1.
          </p>

          <div className="mt-4">
            {status === 'error' ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-900">
                Dependency report unavailable because the API is offline.{' '}
                <button
                  type="button"
                  onClick={refresh}
                  className="font-medium underline underline-offset-2"
                >
                  Retry
                </button>
              </div>
            ) : readiness ? (
              <ul className="divide-y divide-ink-100">
                {readiness.checks.map((check) => (
                  <li key={check.id} className="flex gap-3 py-3 first:pt-0">
                    <StatusDot
                      status={check.status}
                      className="mt-1.5"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-ink-800">
                          {check.label}
                        </p>
                        <span className="shrink-0 text-[10px] font-medium uppercase tracking-[0.1em] text-ink-400">
                          {CHECK_LABELS[check.status] ?? check.status}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs leading-relaxed text-ink-500">
                        {check.detail}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : status === 'loading' ? (
              <div className="space-y-4">
                {[0, 1, 2, 3, 4].map((row) => (
                  <div key={row} className="flex gap-3">
                    <Skeleton className="mt-1.5 h-2 w-2 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-1/3" />
                      <Skeleton className="h-2.5 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
                Dependency report unavailable.{' '}
                <button
                  type="button"
                  onClick={refresh}
                  className="font-medium underline underline-offset-2"
                >
                  Retry
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-ink-100 pt-3">
            <p className="text-[10px] text-ink-400">
              {readiness && status !== 'error'
                ? `Checked ${new Date(readiness.checked_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`
                : 'GET /health/readiness'}
            </p>
            <a
              href={`${apiBaseUrl}${API_PREFIX}/health/readiness`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-500 transition hover:text-ink-900"
            >
              Raw report
              <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
            </a>
          </div>
        </Card>

        <Card className="flex flex-col p-5 sm:p-6 lg:col-span-2">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-ink-400" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-ink-950">
              Delivery plan
            </h2>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-ink-500">
            Seven days, shipped in testable milestones.
          </p>

          <ol className="mt-5">
            {TIMELINE.map((item, index) => {
              const isDone = item.state === 'done'
              const isCurrent = item.state === 'current'
              return (
                <li
                  key={item.day}
                  className="relative flex gap-3 pb-4 last:pb-0"
                >
                  {index < TIMELINE.length - 1 ? (
                    <span
                      className="absolute left-[9px] top-5 h-full w-px bg-ink-200"
                      aria-hidden="true"
                    />
                  ) : null}
                  <span
                    className={cn(
                      'relative z-10 mt-0.5 grid h-[19px] w-[19px] shrink-0 place-items-center rounded-full ring-1',
                      isDone
                        ? 'bg-brand-600 text-white ring-brand-600'
                        : isCurrent
                          ? 'bg-white ring-brand-400'
                          : 'bg-white ring-ink-200',
                    )}
                  >
                    {isDone ? (
                      <Check className="h-3 w-3" aria-hidden="true" />
                    ) : (
                      <span
                        className={cn(
                          'h-1.5 w-1.5 rounded-full',
                          isCurrent ? 'bg-brand-500' : 'bg-ink-300',
                        )}
                      />
                    )}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <p
                        className={cn(
                          'text-[13px] font-medium',
                          isCurrent ? 'text-ink-950' : 'text-ink-700',
                        )}
                      >
                        {item.title}
                      </p>
                      <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-ink-400">
                        {item.day}
                      </span>
                      <span className="sr-only">
                        {isDone ? 'Complete' : isCurrent ? 'Next' : 'Planned'}
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-ink-500">
                      {item.detail}
                    </p>
                  </div>
                </li>
              )
            })}
          </ol>

          <div className="mt-auto pt-5">
            <div className="rounded-xl border border-brand-100 bg-brand-50/60 px-3.5 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-700">
                Next up · Day 2
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ink-600">
                Curated schemes and the deterministic eligibility engine.
              </p>
              <Link
                to="/app/schemes"
                className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-brand-700 transition hover:text-brand-800"
              >
                Open module preview
                <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </Card>
      </div>

      <p className="mt-8 text-center text-[11px] leading-relaxed text-ink-400">
        CIVICSAATHI AI · v{health?.version ?? '0.1.0'} ·{' '}
        {health?.environment ?? 'development'} — hackathon prototype, not an
        official government service.
      </p>
    </div>
  )
}
