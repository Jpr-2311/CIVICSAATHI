import { ExternalLink, Menu, RefreshCw } from 'lucide-react'

import StatusDot from '@/components/ui/StatusDot'
import { apiDocsUrl } from '@/services/api'
import { cn } from '@/lib/cn'

const STATUS = {
  loading: { label: 'Connecting', tone: 'loading' },
  ready: { label: 'API online', tone: 'online' },
  error: { label: 'API offline', tone: 'offline' },
}

export default function Topbar({ system, title, onOpenNav }) {
  const { state, refresh, refreshing } = system
  const status = STATUS[state.status] ?? STATUS.loading

  return (
    <header className="sticky top-0 z-30 border-b border-ink-200/70 bg-ink-50/85 backdrop-blur-lg">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onOpenNav}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink-600 transition hover:bg-ink-100 hover:text-ink-900 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-400">
            CIVICSAATHI workspace
          </p>
          <p className="truncate text-sm font-semibold text-ink-900">{title}</p>
        </div>

        <button
          type="button"
          onClick={refresh}
          title="Recheck backend connection"
          className="group inline-flex shrink-0 items-center gap-2 rounded-full border border-ink-200 bg-white px-3 py-1.5 text-xs text-ink-600 transition hover:border-ink-300 hover:text-ink-900"
        >
          <StatusDot
            status={status.tone}
            pulse={state.status === 'loading'}
          />
          <span className="font-medium">{status.label}</span>
          {state.status === 'ready' && state.latencyMs != null ? (
            <span className="hidden text-ink-400 sm:inline">
              · {state.latencyMs} ms
            </span>
          ) : null}
          <RefreshCw
            className={cn(
              'hidden h-3 w-3 text-ink-300 transition group-hover:text-ink-500 sm:block',
              refreshing && 'animate-spin',
            )}
            aria-hidden="true"
          />
          <span className="sr-only">Recheck backend connection</span>
        </button>

        <a
          href={apiDocsUrl()}
          target="_blank"
          rel="noreferrer"
          className="hidden items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-ink-500 transition hover:bg-ink-100 hover:text-ink-900 md:inline-flex"
        >
          API docs
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>
    </header>
  )
}
