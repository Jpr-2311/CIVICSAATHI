import { Link, NavLink } from 'react-router-dom'
import {
  ArrowUpRight,
  House,
  LayoutDashboard,
  X,
} from 'lucide-react'

import Logo from '@/components/brand/Logo'
import Badge from '@/components/ui/Badge'
import StatusDot from '@/components/ui/StatusDot'
import { MODULES } from '@/data/modules'
import { useLanguage } from '@/i18n'
import { apiDocsUrl } from '@/services/api'
import { cn } from '@/lib/cn'

function navClass({ isActive }) {
  return cn(
    'group flex items-start gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
    isActive
      ? 'bg-brand-950 text-cream-50 shadow-soft'
      : 'text-ink-700 hover:bg-cream-100 hover:text-brand-950',
  )
}

export function SidebarPanel({ system, onNavigate, onClose }) {
  const { t } = useLanguage()
  const status = system?.state.status
  const online = status === 'ready'
  const checking = status === 'loading'
  const version = system?.state.health?.version ?? '0.2.0'

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-ink-200/70 px-5">
        <Logo />
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            autoFocus
            className="grid h-9 w-9 place-items-center rounded-lg text-ink-500 transition hover:bg-cream-100 hover:text-brand-950"
            aria-label={t('shell.closeNavigation')}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <div className="px-4 pt-5">
        <div className="rounded-2xl bg-cream-100 px-4 py-3.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-500">
              {t('shell.workspace')}
            </p>
            <Badge tone="coral" className="px-2 py-0.5 text-[9px]">
              {t('shell.demo')}
            </Badge>
          </div>
          <p className="mt-2 text-sm font-semibold text-brand-950">
            {t('shell.keralaPilot')}
          </p>
          <p className="mt-0.5 text-[11px] text-ink-500">
            {t('shell.foundation')}
          </p>
        </div>
      </div>

      <nav
        className="flex-1 overflow-y-auto px-3 py-5"
        aria-label={t('shell.navLabel')}
      >
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">
          {t('shell.workspace')}
        </p>
        <NavLink to="/app" end className={navClass} onClick={onNavigate}>
          {({ isActive }) => (
            <>
              <LayoutDashboard
                className={cn(
                  'mt-0.5 h-[18px] w-[18px] shrink-0',
                  isActive
                    ? 'text-coral-300'
                    : 'text-ink-400 group-hover:text-ink-600',
                )}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1">
                <span className="block leading-snug">
                  {t('shell.dashboard')}
                </span>
                <span
                  className={cn(
                    'mt-0.5 block text-[10px] font-normal',
                    isActive ? 'text-cream-200/60' : 'text-ink-400',
                  )}
                >
                  {t('shell.keralaPilot')}
                </span>
              </span>
            </>
          )}
        </NavLink>

        <p className="px-3 pb-2 pt-6 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">
          {t('shell.citizenServices')}
        </p>
        {MODULES.map((module) => {
          const Icon = module.icon
          return (
            <NavLink
              key={module.id}
              to={`/app/${module.path}`}
              className={navClass}
              onClick={onNavigate}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cn(
                      'mt-0.5 h-[18px] w-[18px] shrink-0',
                      isActive
                        ? 'text-coral-300'
                        : 'text-ink-400 group-hover:text-ink-600',
                    )}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block leading-snug">
                      {t(`modules.${module.catalogKey}.shortName`)}
                    </span>
                    <span
                      className={cn(
                        'mt-0.5 block text-[10px] font-normal',
                        isActive ? 'text-cream-200/60' : 'text-ink-400',
                      )}
                    >
                      {t('common.dayLabel')} {module.day} ·{' '}
                      {module.status === 'live'
                        ? t('common.live')
                        : t('shell.preview')}
                    </span>
                  </span>
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className="shrink-0 border-t border-ink-200/70 px-3 py-4">
        <div className="rounded-xl border border-ink-200/70 bg-cream-50 px-3 py-2.5">
          <div className="flex items-center gap-2 text-[11px]">
            <StatusDot
              status={online ? 'online' : checking ? 'loading' : 'offline'}
              pulse={checking}
            />
            <span className="font-medium text-ink-800">
              {online
                ? t('shell.backendConnected')
                : checking
                  ? t('shell.checkingBackend')
                  : t('shell.backendOffline')}
            </span>
          </div>
          <p className="mt-1 text-[10px] text-ink-400">
            FastAPI · v{version}
          </p>
        </div>

        <Link
          to="/"
          className="mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-ink-500 transition hover:bg-cream-100 hover:text-brand-950"
        >
          <House className="h-3.5 w-3.5" aria-hidden="true" />
          {t('shell.viewLanding')}
        </Link>
        <a
          href={apiDocsUrl()}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-ink-500 transition hover:bg-cream-100 hover:text-brand-950"
        >
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          {t('shell.apiReference')}
        </a>

        <div className="mt-3 border-t border-ink-200/70 px-3 pt-3">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-400">
            {t('shell.buildLabel')}
          </p>
          <p className="mt-1 text-[10px] text-ink-400">
            {t('shell.buildSub')}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function Sidebar({ system }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-ink-200/70 bg-white lg:block">
      <SidebarPanel system={system} />
    </aside>
  )
}
