import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'

import Logo from '@/components/brand/Logo'
import { API_PREFIX, apiBaseUrl, apiDocsUrl } from '@/services/api'

const PRODUCT_LINKS = [
  { label: 'Workspace', to: '/app' },
  { label: 'Discover schemes', to: '/app/schemes' },
  { label: 'Eligibility checker', to: '/app/eligibility' },
  { label: 'AI assistant', to: '/app/assistant' },
  { label: 'Document intelligence', to: '/app/documents' },
]

const DEVELOPER_LINKS = [
  { label: 'API reference', href: apiDocsUrl() },
  { label: 'Health check', href: `${apiBaseUrl}${API_PREFIX}/health` },
  {
    label: 'System metadata',
    href: `${apiBaseUrl}${API_PREFIX}/system/info`,
  },
]

const COPYRIGHT_YEAR = new Date().getFullYear()

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-ink-950 text-ink-400">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <Logo variant="light" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed">
              Multilingual civic intelligence for Kerala, built for the
              NxtWave IDEA//FORGE Online Hackathon.
            </p>
            <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-ink-500">
              Civic Pulse · Digital governance
            </p>
          </div>

          <nav aria-label="Product">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-500">
              Product
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Developers">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-500">
              Developers
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {DEVELOPER_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 transition-colors hover:text-white"
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
          <p>© {COPYRIGHT_YEAR} CIVICSAATHI AI · Hackathon prototype</p>
          <p className="max-w-2xl text-ink-500">
            Not an official Government of Kerala service. Always verify details
            on the official portal linked in each scheme record.
          </p>
        </div>
      </div>
    </footer>
  )
}
