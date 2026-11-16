import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'

import Logo from '@/components/brand/Logo'
import { LanguageSwitcher, useLanguage } from '@/i18n'
import { API_PREFIX, apiBaseUrl, apiDocsUrl } from '@/services/api'

const COPYRIGHT_YEAR = new Date().getFullYear()

export default function SiteFooter() {
  const { t } = useLanguage()

  const productLinks = [
    { label: t('footer.workspace'), to: '/app' },
    { label: t('footer.schemes'), to: '/app/schemes' },
    { label: t('footer.eligibility'), to: '/app/eligibility' },
    { label: t('footer.assistant'), to: '/app/assistant' },
    { label: t('footer.documents'), to: '/app/documents' },
  ]

  const developerLinks = [
    { label: t('footer.api'), href: apiDocsUrl() },
    { label: t('footer.health'), href: `${apiBaseUrl}${API_PREFIX}/health` },
    {
      label: t('footer.metadata'),
      href: `${apiBaseUrl}${API_PREFIX}/system/info`,
    },
  ]

  return (
    <footer className="bg-brand-950 text-cream-200/70">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <Logo variant="light" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed">
              {t('footer.tagline')}
            </p>
            <div className="mt-5 flex items-center gap-3">
              <span className="text-xs font-medium text-cream-200/80">
                {t('footer.language')}
              </span>
              <LanguageSwitcher tone="dark" />
            </div>
          </div>

          <nav aria-label={t('footer.product')}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cream-200/50">
              {t('footer.product')}
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {productLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="transition-colors hover:text-cream-50"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label={t('footer.developers')}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cream-200/50">
              {t('footer.developers')}
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {developerLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 transition-colors hover:text-cream-50"
                  >
                    {link.label}
                    <ArrowUpRight
                      className="h-3 w-3"
                      aria-hidden="true"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {COPYRIGHT_YEAR} CIVICSAATHI AI · {t('footer.copyright')}
          </p>
          <p className="max-w-xl text-cream-200/50">
            {t('footer.disclaimer')}
          </p>
        </div>
      </div>
    </footer>
  )
}
