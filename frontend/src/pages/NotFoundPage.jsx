import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

import Logo from '@/components/brand/Logo'
import Button from '@/components/ui/Button'
import { useLanguage } from '@/i18n'

export default function NotFoundPage() {
  const { t } = useLanguage()

  return (
    <div className="flex min-h-dvh flex-col bg-cream-50">
      <div className="px-5 py-5 sm:px-8">
        <Logo />
      </div>

      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-5 pb-20">
        <div
          className="pointer-events-none absolute -right-20 top-10 h-64 w-64 rounded-full border-[24px] border-coral-100"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -left-16 bottom-10 h-40 w-40 rounded-[2rem] bg-teal-50"
          aria-hidden="true"
        />

        <div className="relative max-w-lg text-center">
          <p className="font-display text-[7rem] leading-none text-coral-200">
            {t('notFound.eyebrow')}
          </p>
          <h1 className="mt-2 font-display text-3xl leading-tight text-brand-950 sm:text-4xl">
            {t('notFound.title')}
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink-500">
            {t('notFound.copy')}
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Button as={Link} to="/">
              {t('notFound.home')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button as={Link} to="/app" variant="secondary">
              {t('notFound.workspace')}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
