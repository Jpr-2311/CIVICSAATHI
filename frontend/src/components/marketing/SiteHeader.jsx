import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Menu, X } from 'lucide-react'

import Logo from '@/components/brand/Logo'
import Button from '@/components/ui/Button'
import { LanguageSwitcher, useLanguage } from '@/i18n'

export default function SiteHeader() {
  const [open, setOpen] = useState(false)
  const { t } = useLanguage()

  const links = [
    { label: t('nav.capabilities'), href: '#services' },
    { label: t('nav.howItWorks'), href: '#how-it-works' },
    { label: t('nav.trust'), href: '#trust' },
    { label: t('nav.languages'), href: '#languages' },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-ink-200/60 bg-cream-50/95 backdrop-blur-md">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-2 px-4 sm:gap-4 sm:px-8">
        <Logo />

        <nav
          className="hidden items-center gap-7 lg:flex"
          aria-label={t('nav.mainNavigation')}
        >
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ink-600 transition-colors hover:text-brand-950"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2.5 md:flex">
          <LanguageSwitcher />
          <Button as={Link} to="/app" size="sm">
            {t('common.openWorkspace')}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>

        <div className="flex items-center gap-1.5 md:hidden">
          <LanguageSwitcher compact />
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="grid h-10 w-10 place-items-center rounded-xl text-ink-700 transition hover:bg-cream-100 hover:text-brand-950"
            aria-expanded={open}
            aria-controls="site-mobile-menu"
            aria-label={open ? t('common.closeMenu') : t('common.openMenu')}
          >
            {open ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {open ? (
        <div
          id="site-mobile-menu"
          className="border-t border-ink-200/60 bg-cream-50 px-5 pb-6 pt-3 md:hidden"
        >
          <nav aria-label={t('nav.mobileNavigation')}>
            <ul className="divide-y divide-ink-200/70">
              {links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between py-3.5 text-sm font-medium text-ink-700"
                  >
                    {link.label}
                    <ArrowRight
                      className="h-4 w-4 text-ink-300"
                      aria-hidden="true"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <Button
            as={Link}
            to="/app"
            className="mt-5 w-full"
            onClick={() => setOpen(false)}
          >
            {t('common.openWorkspace')}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      ) : null}
    </header>
  )
}
