import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import Sidebar, { SidebarPanel } from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'
import { MODULES } from '@/data/modules'
import { useSystemSnapshot } from '@/hooks/useSystemSnapshot'

export default function AppShell() {
  const [navOpen, setNavOpen] = useState(false)
  const location = useLocation()
  const system = useSystemSnapshot()

  const activeModule = MODULES.find((module) =>
    location.pathname.startsWith(`/app/${module.path}`),
  )
  const title = activeModule?.name ?? 'Dashboard overview'

  useEffect(() => {
    if (!navOpen) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setNavOpen(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [navOpen])

  return (
    <div className="min-h-dvh bg-ink-50">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-ink-900"
      >
        Skip to content
      </a>

      <Sidebar system={system} />

      {navOpen ? (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Workspace navigation"
        >
          <button
            type="button"
            className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm"
            onClick={() => setNavOpen(false)}
            aria-label="Close navigation"
          />
          <div className="absolute inset-y-0 left-0 w-[19rem] max-w-[85vw] overflow-hidden shadow-2xl">
            <SidebarPanel
              system={system}
              onNavigate={() => setNavOpen(false)}
              onClose={() => setNavOpen(false)}
            />
          </div>
        </div>
      ) : null}

      <div className="lg:pl-72">
        <Topbar
          system={system}
          title={title}
          onOpenNav={() => setNavOpen(true)}
        />
        <main
          id="main-content"
          className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6 lg:px-8"
        >
          <Outlet context={{ system }} />
        </main>
      </div>
    </div>
  )
}
