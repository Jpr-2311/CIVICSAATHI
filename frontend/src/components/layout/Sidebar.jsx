import { Link, NavLink } from 'react-router-dom'
import {
  ArrowUpRight,
  BookOpen,
  LayoutDashboard,
  X,
} from 'lucide-react'

import Logo from '@/components/brand/Logo'
import Badge from '@/components/ui/Badge'
import StatusDot from '@/components/ui/StatusDot'
import { MODULES } from '@/data/modules'
import { apiDocsUrl } from '@/services/api'
import { cn } from '@/lib/cn'

function navClass({ isActive }) {
  return cn(
    'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
    isActive
      ? 'bg-brand-500/15 text-white ring-1 ring-inset ring-brand-400/25'
      : 'text-ink-300 hover:bg-white/[0.06] hover:text-white',
  )
}

export function SidebarPanel({ system, onNavigate, onClose }) {
  const status = system?.state.status
  const online = status === 'ready'
  const checking = status === 'loading'
  const version = system?.state.health?.version ?? '0.1.0'

  return (
    <div className="flex h-full flex-col bg-ink-950 text-ink-300">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-5">
        <Logo variant="light" />
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            autoFocus
            className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="px-4 pt-5">
        <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-400">
              Workspace
            </p>
            <Badge tone="dark" className="px-2 py-0.5 text-[9px]">
              Demo
            </Badge>
          </div>
          <p className="mt-2 text-sm font-medium text-white">Kerala pilot</p>
          <p className="mt-0.5 text-[11px] text-ink-400">
            Foundation · Day 1 of 7
          </p>
        </div>
      </div>

      <nav
        className="flex-1 overflow-y-auto px-3 py-5"
        aria-label="Workspace navigation"
      >
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-500">
          Workspace
        </p>
        <NavLink to="/app" end className={navClass} onClick={onNavigate}>
          {({ isActive }) => (
            <>
              <LayoutDashboard
                className={cn(
                  'h-[18px] w-[18px] shrink-0',
                  isActive
                    ? 'text-brand-300'
                    : 'text-ink-400 group-hover:text-ink-200',
                )}
                aria-hidden="true"
              />
              <span className="flex-1">Dashboard</span>
            </>
          )}
        </NavLink>

        <p className="px-3 pb-2 pt-6 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-500">
          Civic modules
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
                      'h-[18px] w-[18px] shrink-0',
                      isActive
                        ? 'text-brand-300'
                        : 'text-ink-400 group-hover:text-ink-200',
                    )}
                    aria-hidden="true"
                  />
                  <span className="flex-1 truncate">{module.shortName}</span>
                  <span className="shrink-0 text-[10px] font-medium text-ink-500">
                    {module.milestone}
                  </span>
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className="shrink-0 border-t border-white/10 px-3 py-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
          <div className="flex items-center gap-2 text-[11px]">
            <StatusDot
              status={online ? 'online' : checking ? 'loading' : 'offline'}
              pulse={checking}
            />
            <span className="font-medium text-ink-200">
              {online
                ? 'Backend connected'
                : checking
                  ? 'Checking backend'
                  : 'Backend offline'}
            </span>
          </div>
          <p className="mt-1 text-[10px] text-ink-500">
            FastAPI · v{version}
          </p>
        </div>

        <Link
          to="/"
          className="mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-ink-400 transition hover:bg-white/[0.06] hover:text-white"
        >
          <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
          View landing page
        </Link>
        <a
          href={apiDocsUrl()}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-ink-400 transition hover:bg-white/[0.06] hover:text-white"
        >
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          API reference
        </a>

        <div className="mt-3 border-t border-white/10 px-3 pt-3">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-500">
            NxtWave IDEA//FORGE
          </p>
          <p className="mt-1 text-[10px] text-ink-500">
            Civic Pulse · Hackathon build
          </p>
        </div>
      </div>
    </div>
  )
}

export default function Sidebar({ system }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-white/10 lg:block">
      <SidebarPanel system={system} />
    </aside>
  )
}
