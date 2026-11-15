import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, Menu, X } from 'lucide-react'

import Logo from '@/components/brand/Logo'
import Button from '@/components/ui/Button'
import { apiDocsUrl } from '@/services/api'

const LINKS = [
  { label: 'Capabilities', href: '#capabilities' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Evidence', href: '#evidence' },
  { label: 'Languages', href: '#languages' },
]

export default function SiteHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-ink-950/85 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-6 px-5 sm:px-8">
        <Logo variant="light" />

        <nav
          className="hidden items-center gap-8 md:flex"
          aria-label="Main navigation"
        >
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-ink-300 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <a
            href={apiDocsUrl()}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm text-ink-300 transition-colors hover:text-white"
          >
            API
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
          <Button as={Link} to="/app" size="sm">
            Open workspace
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="grid h-10 w-10 place-items-center rounded-lg text-ink-200 transition hover:bg-white/10 hover:text-white md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div
          id="mobile-menu"
          className="border-t border-white/10 bg-ink-950 md:hidden"
        >
          <nav
            className="flex flex-col gap-1 px-5 py-4"
            aria-label="Mobile navigation"
          >
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm text-ink-200 transition hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </a>
            ))}
            <a
              href={apiDocsUrl()}
              target="_blank"
              rel="noreferrer"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm text-ink-200 transition hover:bg-white/5 hover:text-white"
            >
              API reference
            </a>
            <Button
              as={Link}
              to="/app"
              onClick={() => setOpen(false)}
              className="mt-3 w-full"
            >
              Open workspace
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </nav>
        </div>
      ) : null}
    </header>
  )
}
