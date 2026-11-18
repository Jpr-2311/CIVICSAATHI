import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CircleAlert,
  Compass,
  FileSearch,
  FileText,
  Languages,
  ListChecks,
  MessagesSquare,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

import AnswerPreview from '@/components/marketing/AnswerPreview'
import SiteFooter from '@/components/marketing/SiteFooter'
import SiteHeader from '@/components/marketing/SiteHeader'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { LANGUAGES, useLanguage, useMessages } from '@/i18n'
import { apiDocsUrl } from '@/services/api'
import { cn } from '@/lib/cn'

const GAP_ICONS = [Compass, FileSearch, Languages]
const TRUST_ICONS = [ShieldCheck, Scale, Languages]

const SERVICES = [
  {
    id: 'discovery',
    to: '/app/schemes',
    icon: Search,
    iconClass: 'bg-coral-50 text-coral-700',
    status: 'live',
  },
  {
    id: 'eligibility',
    to: '/app/eligibility',
    icon: ListChecks,
    iconClass: 'bg-teal-50 text-teal-700',
    status: 'live',
  },
  {
    id: 'documents',
    to: '/app/documents',
    icon: FileText,
    iconClass: 'bg-brand-50 text-brand-700',
    status: 'live',
  },
  {
    id: 'assistant',
    to: '/app/assistant',
    icon: MessagesSquare,
    iconClass: 'bg-cream-100 text-brand-800',
    status: 'live',
  },
]

const EVIDENCE_POINT_ICONS = [FileSearch, CircleAlert, Scale]

export default function LandingPage() {
  const { t, language, setLanguage } = useLanguage()
  const copy = useMessages()

  const services = copy.landing.services.items
  const languageSamples = copy.landing.languages.samples

  return (
    <div className="bg-cream-50">
      <SiteHeader />

      <main>
        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute -right-24 top-24 hidden h-72 w-72 rounded-full border-[28px] border-coral-100 lg:block"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -left-16 bottom-16 hidden h-40 w-40 rounded-[2rem] bg-teal-50 lg:block"
            aria-hidden="true"
          />

          <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-12 px-5 pb-20 pt-14 sm:px-8 lg:grid-cols-[1.04fr_0.96fr] lg:items-center lg:gap-14 lg:pb-24 lg:pt-20">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-coral-200 bg-coral-50 px-3.5 py-1.5 text-[11px] font-medium text-coral-800">
                <span className="h-1.5 w-1.5 rounded-full bg-coral-500" />
                {copy.landing.hero.badge}
              </span>

              <h1 className="mt-6 font-display text-[2.9rem] leading-[0.96] tracking-[-0.02em] text-brand-950 sm:text-[4rem] lg:text-[4.75rem]">
                {copy.landing.hero.title}{' '}
                <span className="italic text-coral-600">
                  {copy.landing.hero.accent}
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-[16.5px] leading-relaxed text-ink-600">
                {copy.landing.hero.description}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button as={Link} to="/app" size="lg">
                  {copy.landing.hero.primary}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  as="a"
                  href="#how-it-works"
                  variant="secondary"
                  size="lg"
                >
                  {copy.landing.hero.secondary}
                </Button>
              </div>

              <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2.5 text-xs font-medium text-ink-500">
                {copy.landing.hero.trust.map((item, index) => {
                  const Icon = TRUST_ICONS[index] ?? ShieldCheck
                  return (
                    <li key={item} className="flex items-center gap-1.5">
                      <Icon
                        className="h-3.5 w-3.5 text-teal-600"
                        aria-hidden="true"
                      />
                      {item}
                    </li>
                  )
                })}
              </ul>

              <p className="mt-7 max-w-sm border-l-2 border-coral-300 pl-3 text-[11.5px] leading-relaxed text-ink-400">
                {copy.landing.hero.note}
              </p>
            </div>

            <div className="relative">
              <div
                className="absolute -inset-3 -z-10 rounded-[2rem] bg-cream-100"
                aria-hidden="true"
              />
              <AnswerPreview />
            </div>
          </div>
        </section>

        <section className="border-y border-ink-200/60 bg-white">
          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
            <div className="max-w-3xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-coral-700">
                {copy.landing.gap.eyebrow}
              </p>
              <h2 className="mt-3 font-display text-[2.3rem] leading-[1.05] text-brand-950 sm:text-[3rem]">
                {copy.landing.gap.title}{' '}
                <span className="italic text-coral-600">
                  {copy.landing.gap.accent}
                </span>
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-ink-600">
                {copy.landing.gap.description}
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-ink-200 bg-ink-200 sm:grid-cols-3">
              {copy.landing.gap.items.map((item, index) => {
                const Icon = GAP_ICONS[index] ?? Compass
                return (
                  <div key={item.title} className="bg-cream-50 p-6 sm:p-7">
                    <div className="flex items-center justify-between gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-coral-700 ring-1 ring-inset ring-ink-200">
                        <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                      </span>
                      <span className="font-display text-2xl text-coral-300">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <h3 className="mt-5 text-base font-semibold text-brand-950">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-500">
                      {item.copy}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section
          id="services"
          className="scroll-mt-24 px-5 py-16 sm:px-8 lg:py-24"
        >
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-coral-700">
                  {copy.landing.services.eyebrow}
                </p>
                <h2 className="mt-3 font-display text-[2.3rem] leading-[1.05] text-brand-950 sm:text-[3rem]">
                  {copy.landing.services.title}
                </h2>
                <p className="mt-4 text-[15px] leading-relaxed text-ink-600">
                  {copy.landing.services.description}
                </p>
              </div>
              <p className="max-w-xs text-xs leading-relaxed text-ink-400 sm:text-right">
                {copy.landing.services.note}
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {SERVICES.map((service) => {
                const item = services[service.id]
                const Icon = service.icon
                return (
                  <Card
                    as={Link}
                    key={service.id}
                    to={service.to}
                    className="group flex flex-col p-6 transition duration-200 hover:-translate-y-0.5 hover:border-ink-300 hover:shadow-lift"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className={cn(
                          'grid h-11 w-11 place-items-center rounded-xl',
                          service.iconClass,
                        )}
                      >
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                          {item.capability}
                        </span>
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] ring-1 ring-inset',
                            service.status === 'live'
                              ? 'bg-teal-50 text-teal-700 ring-teal-200'
                              : 'bg-cream-100 text-ink-500 ring-ink-200',
                          )}
                        >
                          {service.status === 'live'
                            ? t('common.live')
                            : t('common.preview')}
                        </span>
                      </span>
                    </div>
                    <h3 className="mt-5 text-lg font-semibold text-brand-950">
                      {item.name}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-500">
                      {item.description}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-coral-700">
                      {copy.landing.services.cta}
                      <ArrowRight
                        className="h-3.5 w-3.5 transition group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </span>
                  </Card>
                )
              })}
            </div>

            <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-ink-200 bg-cream-100 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-brand-800 ring-1 ring-inset ring-ink-200">
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-brand-950">
                      {services.evidence.name}
                    </h3>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-400">
                      {services.evidence.capability}
                    </span>
                  </div>
                  <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-600">
                    {services.evidence.description}
                  </p>
                </div>
              </div>
              <span className="shrink-0 rounded-full border border-ink-200 bg-white px-3 py-1 text-[10px] font-medium text-ink-500">
                {copy.landing.services.across}
              </span>
            </div>
          </div>
        </section>

        <section
          id="how-it-works"
          className="scroll-mt-24 border-y border-ink-200/60 bg-cream-100"
        >
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16 lg:py-24">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-coral-700">
                {copy.landing.how.eyebrow}
              </p>
              <h2 className="mt-3 font-display text-[2.3rem] leading-[1.05] text-brand-950 sm:text-[3rem]">
                {copy.landing.how.title}
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-ink-600">
                {copy.landing.how.description}
              </p>
              <div className="mt-7 flex items-center gap-3 rounded-2xl border border-ink-200 bg-white px-4 py-3.5">
                <Sparkles
                  className="h-4 w-4 shrink-0 text-coral-600"
                  aria-hidden="true"
                />
                <p className="text-xs leading-relaxed text-ink-500">
                  {copy.landing.services.across} ·{' '}
                  {copy.landing.evidence.eyebrow}
                </p>
              </div>
            </div>

            <ol>
              {copy.landing.how.steps.map((step, index) => (
                <li
                  key={step.title}
                  className="grid gap-4 border-t border-ink-200 py-8 first:border-t-0 first:pt-0 last:pb-0 sm:grid-cols-[3rem_1fr] sm:gap-6"
                >
                  <span className="font-display text-4xl leading-none text-coral-400">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-brand-950">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-600">
                      {step.copy}
                    </p>
                    <div className="mt-3.5 flex flex-wrap gap-2">
                      {step.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-ink-200 bg-white px-2.5 py-1 text-[10px] font-medium text-ink-500"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section
          id="trust"
          className="scroll-mt-24 bg-brand-950 text-cream-100"
        >
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1fr_0.95fr] lg:items-center lg:gap-16 lg:py-24">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-coral-300">
                {copy.landing.evidence.eyebrow}
              </p>
              <h2 className="mt-3 font-display text-[2.5rem] leading-[1.02] text-cream-50 sm:text-[3.4rem]">
                {copy.landing.evidence.title}{' '}
                <span className="italic text-coral-300">
                  {copy.landing.evidence.accent}
                </span>
              </h2>
              <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-cream-200/70">
                {copy.landing.evidence.description}
              </p>

              <ul className="mt-8 space-y-5">
                {copy.landing.evidence.points.map((point, index) => {
                  const Icon = EVIDENCE_POINT_ICONS[index] ?? ShieldCheck
                  return (
                    <li key={point.title} className="flex gap-3.5">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/10 text-coral-300 ring-1 ring-inset ring-white/10">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold text-cream-50">
                          {point.title}
                        </h3>
                        <p className="mt-1 text-sm leading-relaxed text-cream-200/60">
                          {point.copy}
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>

            <div>
              <div className="rounded-2xl bg-white p-5 text-ink-700 shadow-lift">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-1.5 text-[11px] font-medium text-ink-500">
                    <FileText
                      className="h-4 w-4 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="truncate">
                      {copy.landing.evidence.card.file}
                    </span>
                  </span>
                  <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[9px] font-semibold text-teal-700 ring-1 ring-inset ring-teal-200">
                    {copy.landing.evidence.card.page}
                  </span>
                </div>

                <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-400">
                  {copy.landing.evidence.card.label}
                </p>
                <blockquote className="mt-2 border-l-2 border-coral-300 pl-3.5 text-[15px] italic leading-relaxed text-ink-700">
                  {copy.landing.evidence.card.excerpt}
                </blockquote>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-ink-200/70 pt-3">
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-teal-700">
                    <Check className="h-3 w-3" aria-hidden="true" />
                    {copy.landing.evidence.card.verified}
                  </span>
                  <span className="text-[10px] text-ink-400">
                    {copy.landing.evidence.card.match}
                  </span>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-dashed border-white/20 bg-white/5 p-5">
                <p className="text-sm italic leading-relaxed text-cream-100">
                  {copy.landing.evidence.card.missingTitle}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-cream-200/60">
                  {copy.landing.evidence.card.missingCopy}
                </p>
              </div>

              <p className="mt-3 px-1 text-[10px] uppercase tracking-[0.16em] text-cream-200/40">
                {copy.landing.evidence.card.illustrative}
              </p>
            </div>
          </div>
        </section>

        <section
          id="languages"
          className="scroll-mt-24 border-b border-ink-200/60 bg-white"
        >
          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-24">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-coral-700">
                {copy.landing.languages.eyebrow}
              </p>
              <h2 className="mt-3 font-display text-[2.3rem] leading-[1.05] text-brand-950 sm:text-[3rem]">
                {copy.landing.languages.title}
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-ink-600">
                {copy.landing.languages.description}
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
              {LANGUAGES.map((option) => {
                const selected = language === option.code
                return (
                  <button
                    key={option.code}
                    type="button"
                    onClick={() => setLanguage(option.code)}
                    aria-pressed={selected}
                    className={cn(
                      'flex h-full flex-col rounded-2xl border p-5 text-left transition',
                      selected
                        ? 'border-teal-300 bg-teal-50/50 ring-1 ring-teal-200'
                        : 'border-ink-200 bg-cream-50 hover:border-ink-300 hover:bg-white hover:shadow-soft',
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className={cn(
                          'text-lg font-semibold text-brand-950',
                          option.fontClass,
                        )}
                      >
                        {option.nativeLabel}
                      </span>
                      <span className="rounded-full border border-ink-200 bg-white px-2 py-0.5 text-[9px] font-semibold text-ink-400">
                        {option.shortLabel}
                      </span>
                    </div>
                    <p
                      className={cn(
                        'mt-4 flex-1 text-sm leading-relaxed text-ink-600',
                        option.fontClass,
                      )}
                    >
                      {languageSamples[option.code]}
                    </p>
                    <span
                      className={cn(
                        'mt-5 inline-flex items-center gap-1.5 text-xs font-semibold',
                        selected ? 'text-teal-700' : 'text-coral-700',
                      )}
                    >
                      {selected ? (
                        <>
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          {t('common.selected')}
                        </>
                      ) : (
                        <>
                          {t('common.useLanguage')}
                          <ArrowRight
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                        </>
                      )}
                    </span>
                  </button>
                )
              })}
            </div>

            <p className="mt-5 flex items-center gap-2 text-xs font-medium text-ink-500">
              <ShieldCheck
                className="h-4 w-4 text-teal-600"
                aria-hidden="true"
              />
              {copy.landing.languages.sameEvidence}
            </p>
          </div>
        </section>

        <section className="bg-coral-500">
          <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:py-16">
            <div className="rounded-3xl bg-cream-50 px-6 py-10 sm:px-10 sm:py-12 lg:flex lg:items-center lg:justify-between lg:gap-10">
              <div className="max-w-2xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-coral-700">
                  {copy.landing.cta.eyebrow}
                </p>
                <h2 className="mt-3 font-display text-[2.3rem] leading-[1.03] text-brand-950 sm:text-[3rem]">
                  {copy.landing.cta.title}{' '}
                  <span className="italic text-coral-600">
                    {copy.landing.cta.accent}
                  </span>
                </h2>
                <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-600">
                  {copy.landing.cta.description}
                </p>
              </div>

              <div className="mt-7 shrink-0 lg:mt-0">
                <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                  <Button as={Link} to="/app" size="lg">
                    {copy.landing.cta.primary}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button as="a" href="#services" variant="secondary" size="lg">
                    {copy.landing.cta.secondary}
                  </Button>
                </div>
                <a
                  href={apiDocsUrl()}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-ink-500 transition hover:text-brand-950"
                >
                  {t('common.viewApi')}
                  <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                </a>
              </div>
            </div>

            <p className="mt-4 text-center text-[11px] text-coral-900/80">
              {copy.landing.cta.disclaimer}
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
