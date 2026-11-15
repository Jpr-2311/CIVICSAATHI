import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CircleCheck,
  Code2,
  LockKeyhole,
  Quote,
  Scale,
  ShieldCheck,
} from 'lucide-react'

import Badge from '@/components/ui/Badge'
import { apiDocsUrl } from '@/services/api'

export default function ModulePreviewPage({ module }) {
  const Icon = module.icon

  return (
    <div>
      <Link
        to="/app"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-500 transition hover:text-ink-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back to dashboard
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100">
              <Icon className="h-6 w-6" aria-hidden="true" />
            </span>
            <Badge tone="warning">{module.milestone}</Badge>
            <Badge tone="neutral">
              {module.status === 'next' ? 'Next milestone' : 'Planned'}
            </Badge>
          </div>

          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-ink-950 sm:text-4xl">
            {module.name}
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-500">
            {module.description}
          </p>

          <div className="mt-8 rounded-2xl border border-dashed border-ink-300 bg-white/70 p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">
              Day 1 status
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">
              The shell, route and design system exist. The functional interface
              is scheduled for{' '}
              <strong className="font-semibold text-ink-900">
                {module.milestone}
              </strong>{' '}
              so it can be built and tested end to end instead of shipped as a
              mock.
            </p>
            <Link
              to="/app"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-brand-700 transition hover:text-brand-800"
            >
              Return to dashboard
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          <h2 className="mt-9 text-sm font-semibold text-ink-950">
            What this module will do
          </h2>
          <ul className="mt-3 space-y-2.5">
            {module.bullets.map((bullet) => (
              <li
                key={bullet}
                className="flex gap-2.5 text-sm leading-relaxed text-ink-600"
              >
                <CircleCheck
                  className="mt-0.5 h-4 w-4 shrink-0 text-brand-600"
                  aria-hidden="true"
                />
                {bullet}
              </li>
            ))}
          </ul>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-ink-950 p-5 shadow-lift">
            <div className="flex items-center gap-2 text-ink-400">
              <Code2 className="h-4 w-4" aria-hidden="true" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em]">
                Planned API contract
              </span>
            </div>
            <pre className="mt-3 overflow-x-auto rounded-lg bg-white/5 p-3 text-[11.5px] leading-relaxed text-brand-200 ring-1 ring-inset ring-white/10">
              <code>{module.endpoint}</code>
            </pre>
            <p className="mt-4 text-xs leading-relaxed text-ink-400">
              Routes are documented in FastAPI as they ship.
            </p>
            <a
              href={apiDocsUrl()}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-brand-300 underline decoration-brand-500/40 underline-offset-4 transition hover:text-brand-200"
            >
              Open API reference
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>

          <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-soft">
            <div className="flex items-center gap-2">
              <LockKeyhole
                className="h-4 w-4 text-ink-400"
                aria-hidden="true"
              />
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                Trust rules
              </p>
            </div>
            <ul className="mt-3.5 space-y-3 text-xs leading-relaxed text-ink-600">
              <li className="flex gap-2">
                <ShieldCheck
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600"
                  aria-hidden="true"
                />
                No invented scheme data — curated from official sources only.
              </li>
              <li className="flex gap-2">
                <Scale
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600"
                  aria-hidden="true"
                />
                Eligibility is deterministic; the LLM never decides it.
              </li>
              <li className="flex gap-2">
                <Quote
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600"
                  aria-hidden="true"
                />
                Answers without evidence say so explicitly.
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}
