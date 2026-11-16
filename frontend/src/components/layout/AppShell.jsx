import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import Sidebar, { SidebarPanel } from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'
import { MODULES } from '@/data/modules'
import { useSystemSnapshot } from '@/hooks/useSystemSnapshot'
import { useLanguage } from '@/i18n'

export default function AppShell() {
  const [navOpen, setNavOpen] = useState(false)
  const location = useLocation()
  const system = useSystemSnapshot()
  const { t } = useLanguage()

  const activeModule = MODULES.find((module) =>
    location.pathname.startsWith(`/app/${module.path}`),
  )
  const title = activeModule
    ? t(`modules.${activeModule.catalogKey}.name`)
    : t('shell.dashboard')

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
    <div className="min-h-dvh bg-cream-50">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-brand-950"
      >
        {t('shell.skip')}
      </a>

      <Sidebar system={system} />

      {navOpen ? (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label={t('shell.navLabel')}
        >
          <button
            type="button"
            className="absolute inset-0 bg-brand-950/40 backdrop-blur-[2px]"
            onClick={() => setNavOpen(false)}
            aria-label={t('shell.closeNavigation')}
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
          className="mx-auto w-full max-w-6xl px-4 pb-20 pt-8 sm:px-6 lg:px-10 lg:pt-10"
        >
          <Outlet context={{ system }} />
        </main>
      </div>
    </div>
  )
}
