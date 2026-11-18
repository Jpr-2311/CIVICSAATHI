import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Building2,
  CalendarCheck2,
  ClipboardList,
  ExternalLink,
  FileQuestion,
  FileText,
  Landmark,
  ListChecks,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import EmptyState from '@/components/ui/EmptyState'
import Notice from '@/components/ui/Notice'
import Skeleton from '@/components/ui/Skeleton'
import ModuleHeader from '@/components/workspace/ModuleHeader'
import { useLanguage, useMessages } from '@/i18n'
import { formatDate } from '@/lib/format'
import { getScheme, isCanceled } from '@/services/api'
import { cn } from '@/lib/cn'

function DetailSkeleton() {
  return (
    <div>
      <Skeleton className="h-4 w-36" />
      <Skeleton className="mt-6 h-9 w-3/4" />
      <Skeleton className="mt-2 h-9 w-1/2" />
      <Skeleton className="mt-4 h-4 w-full max-w-2xl" />
      <Skeleton className="mt-2 h-4 w-5/6 max-w-2xl" />
      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-4">
          {[0, 1, 2].map((section) => (
            <Card key={section} className="p-5 sm:p-6">
              <Skeleton className="h-5 w-40" />
              <div className="mt-4 space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-11/12" />
                <Skeleton className="h-3 w-4/5" />
              </div>
            </Card>
          ))}
        </div>
        <Card className="p-5 sm:p-6">
          <Skeleton className="h-5 w-32" />
          <div className="mt-4 space-y-3">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </Card>
      </div>
    </div>
  )
}

function SectionCard({ icon: Icon, title, children, className }) {
  return (
    <Card className={cn('p-5 sm:p-6', className)}>
      <div className="flex items-center gap-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-cream-100 text-brand-800">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <h2 className="text-sm font-semibold text-brand-950">{title}</h2>
      </div>
      <div className="mt-4">{children}</div>
    </Card>
  )
}

export default function SchemeDetailPage() {
  const { schemeId } = useParams()
  const { language, locale } = useLanguage()
  const copy = useMessages()
  const [reloadKey, setReloadKey] = useState(0)
  const [state, setState] = useState({
    status: 'loading',
    data: null,
    error: null,
  })

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    // The loading state is tied to the external request, not derived from props.
    // oxlint-disable-next-line react/set-state-in-effect
    setState({ status: 'loading', data: null, error: null })

    getScheme(schemeId, { language }, { signal: controller.signal })
      .then((data) => {
        if (!active) return
        setState({ status: 'ready', data, error: null })
      })
      .catch((error) => {
        if (!active || isCanceled(error)) return
        setState({ status: 'error', data: null, error })
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [schemeId, language, reloadKey])

  const detail = state.data
  const manualConditions =
    detail?.conditions.filter((condition) => condition.manual) ?? []

  if (state.status === 'loading') {
    return (
      <div role="status" aria-live="polite">
        <span className="sr-only">{copy.schemes.detail.loading}</span>
        <DetailSkeleton />
      </div>
    )
  }

  if (state.status === 'error' && state.error?.status === 404) {
    return (
      <div>
        <Link
          to="/app/schemes"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-500 transition hover:text-brand-950"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          {copy.schemes.detail.back}
        </Link>
        <EmptyState
          icon={FileQuestion}
          title={copy.schemes.detail.notFoundTitle}
          copy={copy.schemes.detail.notFoundCopy}
          className="mt-6"
          action={
            <Button as={Link} to="/app/schemes" variant="secondary">
              {copy.schemes.detail.back}
            </Button>
          }
        />
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div>
        <Link
          to="/app/schemes"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-500 transition hover:text-brand-950"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          {copy.schemes.detail.back}
        </Link>
        <Notice
          tone="danger"
          title={copy.schemes.detail.errorTitle}
          className="mt-6"
        >
          <p>{copy.schemes.detail.errorCopy}</p>
          {state.error?.message ? (
            <p className="mt-2 break-words font-mono text-[11px] opacity-80">
              {state.error.message}
            </p>
          ) : null}
          <Button
            variant="secondary"
            size="sm"
            className="mt-3"
            onClick={() => setReloadKey((key) => key + 1)}
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            {copy.schemes.detail.retry}
          </Button>
        </Notice>
      </div>
    )
  }

  if (!detail) return null

  return (
    <div>
      <Link
        to="/app/schemes"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-500 transition hover:text-brand-950"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        {copy.schemes.detail.back}
      </Link>

      <ModuleHeader
        icon={Landmark}
        eyebrow={copy.schemes.eyebrow}
        title={detail.name}
        description={detail.summary}
        badge={copy.schemes.categories[detail.category] ?? detail.category}
        className="mt-5"
      />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge
          tone={detail.government_level === 'state' ? 'teal' : 'neutral'}
        >
          {detail.government_level === 'state' ? (
            <MapPin className="h-3 w-3" aria-hidden="true" />
          ) : (
            <Building2 className="h-3 w-3" aria-hidden="true" />
          )}
          {copy.schemes.levels[detail.government_level] ??
            detail.government_level}
        </Badge>
        <Badge tone="success">
          <CalendarCheck2 className="h-3 w-3" aria-hidden="true" />
          {copy.schemes.detail.verifiedOn
            .replace('{date}', formatDate(detail.verified_on, locale))}
        </Badge>
      </div>

      <div className="mt-7 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_18rem] lg:items-start">
        <div className="space-y-4">
          <SectionCard icon={Sparkles} title={copy.schemes.detail.about}>
            <p className="text-sm leading-relaxed text-ink-600">
              {detail.description}
            </p>
          </SectionCard>

          <SectionCard icon={ShieldCheck} title={copy.schemes.detail.benefits}>
            <ul className="space-y-2.5">
              {detail.benefits.map((benefit) => (
                <li key={benefit} className="flex gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-600" />
                  <span className="text-sm leading-relaxed text-ink-700">
                    {benefit}
                  </span>
                </li>
              ))}
            </ul>
          </SectionCard>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SectionCard
              icon={FileText}
              title={copy.schemes.detail.documents}
            >
              <ul className="space-y-2">
                {detail.documents_required.map((document) => (
                  <li
                    key={document}
                    className="rounded-lg border border-ink-100 bg-cream-50 px-3 py-2 text-xs leading-relaxed text-ink-700"
                  >
                    {document}
                  </li>
                ))}
              </ul>
            </SectionCard>

            <SectionCard
              icon={ClipboardList}
              title={copy.schemes.detail.steps}
            >
              <ol className="space-y-3">
                {detail.application_steps.map((step, index) => (
                  <li key={step} className="flex gap-2.5">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-950 text-[10px] font-semibold text-cream-50">
                      {index + 1}
                    </span>
                    <span className="text-xs leading-relaxed text-ink-700">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
            </SectionCard>
          </div>

          <SectionCard
            icon={ListChecks}
            title={copy.schemes.detail.conditions}
          >
            {manualConditions.length ? (
              <Notice
                tone="warning"
                title={copy.schemes.detail.manualBadge}
                className="mb-4"
              >
                {copy.schemes.detail.manualNote}
              </Notice>
            ) : null}
            <ul className="space-y-2">
              {detail.conditions.map((condition) => (
                <li
                  key={condition.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-ink-100 px-3 py-2.5"
                >
                  <span className="flex min-w-0 items-start gap-2">
                    <ShieldCheck
                      className={cn(
                        'mt-0.5 h-3.5 w-3.5 shrink-0',
                        condition.manual ? 'text-amber-600' : 'text-teal-600',
                      )}
                      aria-hidden="true"
                    />
                    <span className="text-xs leading-relaxed text-ink-700">
                      {condition.label}
                    </span>
                  </span>
                  {condition.manual ? (
                    <Badge tone="warning">
                      {copy.schemes.detail.manualBadge}
                    </Badge>
                  ) : null}
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard icon={ExternalLink} title={copy.schemes.detail.sources}>
            <ul className="space-y-2.5">
              {[detail.source, ...detail.additional_sources].map(
                (source) => (
                  <li key={`${source.url}-${source.title}`}>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-start gap-3 rounded-xl border border-ink-100 bg-cream-50 px-3.5 py-3 transition hover:border-ink-200 hover:bg-cream-100"
                    >
                      <ExternalLink
                        className="mt-0.5 h-4 w-4 shrink-0 text-ink-400 transition group-hover:text-brand-950"
                        aria-hidden="true"
                      />
                      <span className="min-w-0">
                        <span className="block text-xs font-semibold text-brand-950">
                          {source.title}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-ink-500">
                          {source.publisher}
                        </span>
                        <span className="mt-0.5 block truncate text-[10px] text-ink-400">
                          {source.url}
                        </span>
                      </span>
                    </a>
                  </li>
                ),
              )}
            </ul>
            <p className="mt-3 text-[11px] leading-relaxed text-ink-400">
              {copy.schemes.detail.verifiedOn.replace(
                '{date}',
                formatDate(detail.verified_on, locale),
              )}
            </p>
          </SectionCard>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-brand-950">
              {copy.schemes.detail.about}
            </h2>
            <dl className="mt-3 space-y-3 text-xs">
              <div>
                <dt className="text-[10px] font-medium uppercase tracking-[0.12em] text-ink-400">
                  {copy.schemes.department}
                </dt>
                <dd className="mt-0.5 leading-relaxed text-ink-700">
                  {detail.department}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-medium uppercase tracking-[0.12em] text-ink-400">
                  {copy.schemes.levelLabel}
                </dt>
                <dd className="mt-0.5 text-ink-700">
                  {copy.schemes.levels[detail.government_level] ??
                    detail.government_level}
                </dd>
              </div>
              {detail.state ? (
                <div>
                  <dt className="text-[10px] font-medium uppercase tracking-[0.12em] text-ink-400">
                    {copy.schemes.state}
                  </dt>
                  <dd className="mt-0.5 text-ink-700">{detail.state}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-[10px] font-medium uppercase tracking-[0.12em] text-ink-400">
                  {copy.common.verified}
                </dt>
                <dd className="mt-0.5 text-ink-700">
                  {formatDate(detail.verified_on, locale)}
                </dd>
              </div>
            </dl>

            <Button
              as={Link}
              to={`/app/eligibility?scheme_id=${encodeURIComponent(detail.id)}`}
              variant="primary"
              className="mt-4 w-full"
            >
              <ListChecks className="h-4 w-4" aria-hidden="true" />
              {copy.schemes.detail.eligibilityCta}
            </Button>
            <a
              href={detail.source.url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-xs font-semibold text-brand-950 transition hover:bg-cream-50"
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              {copy.schemes.officialSource}
            </a>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-brand-950">
              {copy.schemes.detail.contentNote}
            </h2>
            <p className="mt-2 text-[11px] leading-relaxed text-ink-500">
              {detail.content_note}
            </p>
            <p className="mt-2.5 border-t border-ink-100 pt-2.5 text-[11px] leading-relaxed text-ink-400">
              {detail.disclaimer}
            </p>
          </Card>
        </aside>
      </div>
    </div>
  )
}
