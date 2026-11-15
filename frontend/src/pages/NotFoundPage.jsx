import { Link } from 'react-router-dom'

import Logo from '@/components/brand/Logo'
import Button from '@/components/ui/Button'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-ink-50">
      <div className="px-5 py-5 sm:px-8">
        <Logo />
      </div>

      <main className="flex flex-1 items-center justify-center px-5 pb-20">
        <div className="max-w-lg text-center">
          <p className="font-display text-[6rem] leading-none text-brand-200">
            404
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink-950">
            This page isn't in the file.
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink-500">
            The link may be outdated, or the module has not shipped yet. The
            dashboard shows what is live today.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Button as={Link} to="/">
              Back to home
            </Button>
            <Button as={Link} to="/app" variant="secondary">
              Open workspace
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
