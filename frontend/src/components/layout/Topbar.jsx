import { ExternalLink, Menu, RefreshCw } from 'lucide-react'

import StatusDot from '@/components/ui/StatusDot'
import { LanguageSwitcher, useLanguage } from '@/i18n'
import { apiDocsUrl } from '@/services/api'
import { cn } from '@/lib/cn'

export default function Topbar({ system, title, onOpenNav }) {
  const { t } = useLanguage()
  const { state, refresh, refreshing } = system

  const status =
    state.status === 'ready'
      ? {
          label: t('shell.apiOnline'),
          tone: 'online',
        }
      : state.status === 'error'
        ? {
            label: t('shell.apiOffline'),
            tone: 'offline',
          }
        : {
            label: t('shell.connecting'),
            tone: 'loading',
          }

  return (
    <header className="sticky top-0 z-30 border-b border-ink-200/70 bg-cream-50/90 backdrop-blur-md">
      <div className="flex h-[72px] items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:px-10">
        <button
          type="button"
          onClick={onOpenNav}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-ink-600 transition hover:bg-cream-100 hover:text-brand-950 lg:hidden"
          aria-label={t('shell.openNavigation')}
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="min-w-0 flex-1">
          <p className="hidden text-[10px] font-medium uppercase tracking-[0.18em] text-ink-400 sm:block">
            {t('shell.workspaceTitle')}
          </p>
          <p className="truncate text-sm font-semibold text-brand-950">
            {title}
          </p>
        </div>

        <div className="shrink-0 sm:hidden">
          <LanguageSwitcher compact />
        </div>
        <div className="hidden shrink-0 sm:block">
          <LanguageSwitcher />
        </div>

        <button
          type="button"
          onClick={refresh}
          title={t('shell.recheck')}
          className="group inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-ink-200 bg-white px-2.5 text-xs text-ink-600 transition hover:border-ink-300 hover:text-brand-950 sm:px-3"
          aria-label={t('shell.recheck')}
        >
          <StatusDot
            status={status.tone}
            pulse={state.status === 'loading'}
          />
          <span className="hidden font-medium sm:inline">{status.label}</span>
          {state.status === 'ready' && state.latencyMs != null ? (
            <span className="hidden text-ink-400 md:inline">
              · {state.latencyMs} ms
            </span>
          ) : null}
          <RefreshCw
            className={cn(
              'h-3 w-3 text-ink-300 transition group-hover:text-ink-500',
              refreshing && 'animate-spin',
            )}
            aria-hidden="true"
          />
        </button>

        <a
          href={apiDocsUrl()}
          target="_blank"
          rel="noreferrer"
          className="hidden items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-ink-500 transition hover:bg-cream-100 hover:text-brand-950 xl:inline-flex"
        >
          {t('shell.apiReference')}
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>
    </header>
  )
}
