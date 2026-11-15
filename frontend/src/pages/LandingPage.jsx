import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  CircleAlert,
  CircleCheck,
  Compass,
  FileSearch,
  FileText,
  Languages,
  Scale,
  ShieldCheck,
} from 'lucide-react'

import AnswerPreview from '@/components/marketing/AnswerPreview'
import SiteFooter from '@/components/marketing/SiteFooter'
import SiteHeader from '@/components/marketing/SiteHeader'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { FEATURES } from '@/data/modules'
import { apiDocsUrl } from '@/services/api'

const PROBLEMS = [
  {
    icon: Compass,
    title: 'Scattered portals',
    copy: 'Scheme details live across department sites, PDF notices and application portals.',
  },
  {
    icon: FileSearch,
    title: 'Dense language',
    copy: 'Eligibility and procedure are written for administrators, not for citizens.',
  },
  {
    icon: Languages,
    title: 'Language barriers',
    copy: 'Critical information is rarely available in the language people think in.',
  },
]

const STEPS = [
  {
    title: 'Bring the source',
    copy: 'Upload an official notification or start from a curated scheme record with a verified source link.',
    tags: ['Official PDFs', 'Curated schemes'],
  },
  {
    title: 'Retrieve the evidence',
    copy: 'Semantic search finds the exact passages and pages that answer the question — not just similar words.',
    tags: ['Embeddings', 'ChromaDB', 'Page metadata'],
  },
  {
    title: 'Answer with receipts',
    copy: 'Gemini explains the finding in English or Malayalam while the document, page and excerpt stay attached.',
    tags: ['Gemini', 'English', 'മലയാളം', 'Citations'],
  },
]

const TRUST_POINTS = [
  {
    icon: FileText,
    title: 'Page-level citations',
    copy: 'Document name, page number and the supporting excerpt stay attached to every retrieved passage.',
  },
  {
    icon: CircleCheck,
    title: 'Verified vs uncertain',
    copy: 'Answers grounded in evidence look different from questions the documents cannot answer.',
  },
  {
    icon: Scale,
    title: 'Rules, not probabilities',
    copy: 'Scheme eligibility is evaluated by deterministic backend rules, never decided by a language model.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-white">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-ink-900"
      >
        Skip to content
      </a>

      <SiteHeader />

      <main id="main">
        {/* Hero */}
        <section className="relative overflow-hidden bg-hero text-white">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-brand-500/20 blur-[120px]" />
            <div className="absolute -right-24 top-10 h-[26rem] w-[26rem] rounded-full bg-sky-600/15 blur-[110px]" />
            <div className="hero-grid absolute inset-0" />
          </div>

          <div className="relative mx-auto grid max-w-7xl gap-14 px-5 pb-24 pt-16 sm:px-8 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 lg:pb-28 lg:pt-24">
            <div className="reveal">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-ink-200">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-70" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-400" />
                </span>
                NxtWave IDEA//FORGE · Civic Pulse track
              </div>

              <h1 className="mt-6 font-display text-[2.85rem] leading-[1.03] tracking-[-0.01em] text-white sm:text-6xl lg:text-[3.65rem] xl:text-[3.9rem]">
                Government information,{' '}
                <span className="italic text-brand-300">without the maze.</span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-300 sm:text-lg">
                CIVICSAATHI AI turns scattered schemes, notifications and policy
                PDFs into clear answers you can verify — in English and
                Malayalam.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button as={Link} to="/app" size="lg" className="group">
                  Open the workspace
                  <ArrowRight
                    className="h-4 w-4 transition group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Button>
                <Button
                  as="a"
                  href="#evidence"
                  variant="outlineLight"
                  size="lg"
                >
                  See how evidence works
                </Button>
              </div>

              <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2.5 text-[13px] text-ink-300">
                {[
                  'Rules-based eligibility',
                  'Citation-backed answers',
                  <>English + <span className="font-malayalam">മലയാളം</span></>,
                ].map((item, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-1.5"
                  >
                    <CircleCheck
                      className="h-3.5 w-3.5 shrink-0 text-brand-400"
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="reveal reveal-delay-2 relative lg:pl-4">
              <AnswerPreview />
            </div>
          </div>
        </section>

        {/* The gap */}
        <section className="border-b border-ink-200 bg-white">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-700">
                The gap
              </p>
              <h2 className="mt-3 font-display text-3xl leading-tight text-ink-950 sm:text-4xl">
                A scheme exists. A citizen qualifies.{' '}
                <span className="italic text-brand-700">
                  The barrier is often comprehension.
                </span>
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {PROBLEMS.map((problem) => {
                const Icon = problem.icon
                return (
                  <div
                    key={problem.title}
                    className="rounded-xl border border-ink-200/80 bg-ink-50/60 p-5"
                  >
                    <Icon
                      className="h-5 w-5 text-brand-700"
                      aria-hidden="true"
                    />
                    <h3 className="mt-4 text-sm font-semibold text-ink-900">
                      {problem.title}
                    </h3>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500">
                      {problem.copy}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Capabilities */}
        <section
          id="capabilities"
          className="scroll-mt-20 border-b border-ink-200 bg-ink-50"
        >
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-700">
                Civic capabilities
              </p>
              <h2 className="mt-3 font-display text-3xl leading-tight text-ink-950 sm:text-4xl">
                One assistant. Five civic capabilities.
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-ink-500">
                Discovery, rules-based eligibility, document retrieval and
                grounded generation share one evidence layer — so every answer
                can be traced back to its source.
              </p>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
              {FEATURES.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <article
                    key={feature.id}
                    className={`group flex flex-col rounded-2xl border border-ink-200/80 bg-white p-6 shadow-soft transition duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift ${
                      index < 3 ? 'lg:col-span-2' : 'lg:col-span-3'
                    } ${index === 4 ? 'sm:col-span-2' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="grid h-11 w-11 place-items-center rounded-xl bg-ink-950 text-brand-300 ring-1 ring-inset ring-white/10">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                        {feature.capability}
                      </span>
                    </div>
                    <h3 className="mt-5 text-base font-semibold text-ink-950">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-500">
                      {feature.description}
                    </p>
                    {feature.path ? (
                      <Link
                        to={`/app/${feature.path}`}
                        className="mt-auto inline-flex items-center gap-1.5 pt-5 text-xs font-medium text-brand-700 transition-colors hover:text-brand-800"
                      >
                        Preview module
                        <ArrowRight
                          className="h-3.5 w-3.5 transition group-hover:translate-x-0.5"
                          aria-hidden="true"
                        />
                      </Link>
                    ) : (
                      <p className="mt-auto pt-5 text-xs font-medium text-ink-400">
                        Across every module
                      </p>
                    )}
                  </article>
                )
              })}
            </div>

            <p className="mt-6 flex flex-wrap items-center gap-2 text-xs text-ink-400">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-brand-500" />
              Current build: Day 1 foundation is live. Scheme discovery and
              eligibility arrive Day 2.
            </p>
          </div>
        </section>

        {/* How it works */}
        <section
          id="how-it-works"
          className="scroll-mt-20 border-b border-ink-200 bg-white"
        >
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-700">
                  How it works
                </p>
                <h2 className="mt-3 font-display text-3xl leading-tight text-ink-950 sm:text-4xl">
                  From a dense PDF to a cited answer.
                </h2>
              </div>
              <a
                href={apiDocsUrl()}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
              >
                Explore the API contract
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>

            <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
              {STEPS.map((step, index) => (
                <div key={step.title}>
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-ink-950 text-xs font-semibold text-brand-300">
                      0{index + 1}
                    </span>
                    <span className="h-px flex-1 bg-gradient-to-r from-ink-200 to-transparent" />
                  </div>
                  <h3 className="mt-5 text-base font-semibold text-ink-950">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-500">
                    {step.copy}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {step.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-ink-50 px-2 py-1 text-[10px] font-medium text-ink-500 ring-1 ring-inset ring-ink-200/70"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Evidence */}
        <section
          id="evidence"
          className="relative scroll-mt-20 overflow-hidden bg-ink-950"
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-24 top-0 h-[30rem] w-[30rem] rounded-full bg-brand-500/15 blur-[120px]" />
            <div className="hero-grid absolute inset-0 opacity-60" />
          </div>

          <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:items-center lg:py-24">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-300">
                Verifiable by design
              </p>
              <h2 className="mt-3 font-display text-4xl leading-tight text-white sm:text-5xl">
                No source. <span className="italic text-brand-300">No claim.</span>
              </h2>
              <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-ink-300">
                Government advice is only useful if it can be checked. Every
                answer returns the document, page and excerpt it relied on — and
                says so when the evidence is not there.
              </p>

              <ul className="mt-8 space-y-5">
                {TRUST_POINTS.map((point) => {
                  const Icon = point.icon
                  return (
                    <li key={point.title} className="flex gap-3.5">
                      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/5 text-brand-300">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold text-white">
                          {point.title}
                        </h3>
                        <p className="mt-1 text-[13px] leading-relaxed text-ink-400">
                          {point.copy}
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>

            <div className="lg:pl-6">
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-2 shadow-2xl">
                <div className="overflow-hidden rounded-xl bg-white">
                  <div className="flex items-center justify-between gap-3 border-b border-ink-100 px-4 py-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <FileText
                        className="h-4 w-4 shrink-0 text-brand-600"
                        aria-hidden="true"
                      />
                      <p className="truncate text-xs font-semibold text-ink-900">
                        kerala_notification.pdf
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-semibold text-brand-700 ring-1 ring-inset ring-brand-200">
                      page 4
                    </span>
                  </div>

                  <div className="p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                      Supporting excerpt
                    </p>
                    <blockquote className="mt-2 border-l-2 border-brand-400 pl-3 text-[12.5px] italic leading-relaxed text-ink-600">
                      “Applicants must submit a valid ration card and an income
                      certificate issued within the last six months...”
                    </blockquote>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
                        <CircleCheck
                          className="h-3 w-3"
                          aria-hidden="true"
                        />
                        Verified excerpt
                      </span>
                      <span className="text-[10px] text-ink-400">
                        Semantic match
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-ink-100 bg-ink-50/70 p-4">
                    <div className="flex gap-2.5">
                      <CircleAlert
                        className="mt-0.5 h-4 w-4 shrink-0 text-amber-500"
                        aria-hidden="true"
                      />
                      <div>
                        <p className="text-xs font-medium text-ink-800">
                          “I couldn't find this in the uploaded documents.”
                        </p>
                        <p className="mt-1 text-[11px] leading-relaxed text-ink-500">
                          When evidence is missing, the assistant says so
                          instead of inventing a rule.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-center text-[10px] uppercase tracking-[0.18em] text-ink-500">
                Illustrative interface
              </p>
            </div>
          </div>
        </section>

        {/* Languages */}
        <section
          id="languages"
          className="scroll-mt-20 border-b border-brand-100 bg-brand-50/60"
        >
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-700">
                Bilingual by design
              </p>
              <h2 className="mt-3 font-display text-3xl leading-tight text-ink-950 sm:text-4xl">
                English and <span className="font-malayalam">മലയാളം</span>, from
                the first question.
              </h2>
              <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-ink-600">
                Citizens should not have to translate official language to
                understand their own entitlements. The assistant answers in the
                language you ask in, while keeping the source attached.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Badge tone="brand">English</Badge>
                <Badge tone="brand">
                  <span className="font-malayalam">മലയാളം</span>
                </Badge>
                <Badge tone="neutral">Same evidence</Badge>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-ink-200/80 bg-white p-5 shadow-soft">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                  English
                </p>
                <p className="mt-3 text-sm leading-relaxed text-ink-700">
                  “Find the schemes you may qualify for. Every answer keeps its
                  source.”
                </p>
              </div>
              <div className="rounded-2xl border border-brand-200 bg-white p-5 shadow-soft">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-600">
                  <span className="font-malayalam tracking-normal">
                    മലയാളം
                  </span>
                </p>
                <p className="mt-3 font-malayalam text-sm leading-relaxed text-ink-700">
                  “നിങ്ങൾക്ക് അർഹതയുള്ള പദ്ധതികൾ കണ്ടെത്തുക. ഓരോ ഉത്തരവും
                  ഉറവിടത്തോടെ.”
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative overflow-hidden bg-ink-950">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-0 h-[26rem] w-[40rem] -translate-x-1/2 rounded-full bg-brand-500/20 blur-[120px]" />
            <div className="hero-grid absolute inset-0 opacity-50" />
          </div>
          <div className="relative mx-auto max-w-4xl px-5 py-20 text-center sm:px-8 sm:py-24">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-300">
              Start with the foundation
            </p>
            <h2 className="mt-4 font-display text-3xl leading-tight text-white sm:text-5xl">
              Bring a question.{' '}
              <span className="italic text-brand-300">
                Leave with a citation.
              </span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-ink-300">
              Explore the live workspace, or read the API contract powering the
              assistant.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button as={Link} to="/app" size="lg" className="group">
                Open the workspace
                <ArrowRight
                  className="h-4 w-4 transition group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Button>
              <Button
                as="a"
                href={apiDocsUrl()}
                target="_blank"
                rel="noreferrer"
                variant="outlineLight"
                size="lg"
              >
                View API reference
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
            <p className="mt-8 inline-flex items-center gap-1.5 text-[11px] text-ink-500">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Hackathon prototype. Not an official government service.
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
