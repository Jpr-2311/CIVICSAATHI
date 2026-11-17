import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Building2,
  CalendarCheck2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MapPin,
  RefreshCw,
  Search,
  X,
} from 'lucide-react'

import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import EmptyState from '@/components/ui/EmptyState'
import Notice from '@/components/ui/Notice'
import Skeleton from '@/components/ui/Skeleton'
import ModuleHeader from '@/components/workspace/ModuleHeader'
import { useLanguage, useMessages } from '@/i18n'
import { formatDate, formatNumber } from '@/lib/format'
import { getSchemes, isCanceled } from '@/services/api'
import { cn } from '@/lib/cn'

const PAGE_SIZE = 12
const CATEGORIES = [
  'all',
  'agriculture',
  'business',
  'education',
  'employment',
  'health',
  'housing',
  'insurance',
  'pension',
  'welfare',
]
const LEVELS = ['all', 'central', 'state']

function SchemeCardSkeleton() {
  return (
    <Card className="flex h-full flex-col p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="mt-5 h-6 w-3/4" />
      <Skeleton className="mt-2 h-6 w-1/2" />
      <div className="mt-4 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>
      <div className="mt-5 space-y-2 border-t border-ink-100 pt-4">
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
    </Card>
  )
}

export default function SchemesPage() {
  const { t, language, locale } = useLanguage()
  const copy = useMessages()

  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [level, setLevel] = useState('all')
  const [page, setPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)
  const [state, setState] = useState({
    status: 'loading',
    data: null,
    error: null,
  })

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim())
      setPage(1)
    }, 350)

    return () => window.clearTimeout(timer)
  }, [query])

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    // The loading state mirrors the external request; the previous page stays
    // visible while a new one loads so pagination does not flash.
    // oxlint-disable-next-line react/set-state-in-effect
    setState((previous) => ({
      status: previous.data ? 'refreshing' : 'loading',
      data: previous.data,
      error: null,
    }))

    getSchemes(
      {
        q: debouncedQuery || undefined,
        category: category === 'all' ? undefined : category,
        government_level: level === 'all' ? undefined : level,
        page,
        page_size: PAGE_SIZE,
        language,
      },
      { signal: controller.signal },
    )
      .then((data) => {
        if (!active) return
        setState({ status: 'ready', data, error: null })
      })
      .catch((error) => {
        if (!active || isCanceled(error)) return
        setState((previous) => ({
          status: 'error',
          data: previous.data,
          error,
        }))
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [debouncedQuery, category, level, page, language, reloadKey])

  const data = state.data
  const busy = state.status === 'loading' || state.status === 'refreshing'
  const hasFilters =
    Boolean(debouncedQuery) || category !== 'all' || level !== 'all'
  const total = data?.total ?? 0
  const totalPages = data?.total_pages ?? 0
  const currentPage = data?.page ?? page

  const resetFilters = () => {
    setQuery('')
    setDebouncedQuery('')
    setCategory('all')
    setLevel('all')
    setPage(1)
  }

  const changeCategory = (next) => {
    setCategory(next)
    setPage(1)
  }

  const changeLevel = (next) => {
    setLevel(next)
    setPage(1)
  }

  return (
    <div>
      <ModuleHeader
        icon={Search}
        eyebrow={copy.schemes.eyebrow}
        title={copy.schemes.title}
        description={copy.schemes.description}
        badge={copy.schemes.badge}
      />

      <Notice
        tone="info"
        title={copy.schemes.noticeTitle}
        className="mt-6"
      >
        {copy.schemes.noticeCopy}
      </Notice>

      <div className="mt-6 rounded-2xl border border-ink-200/70 bg-white p-4 shadow-soft sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <label htmlFor="scheme-search" className="sr-only">
              {copy.schemes.search}
            </label>
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
              aria-hidden="true"
            />
            <input
              id="scheme-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={copy.schemes.search}
              className="h-11 w-full rounded-xl border border-ink-200 bg-cream-50 pl-10 pr-10 text-sm text-ink-800 placeholder:text-ink-400 focus:border-brand-400 focus:bg-white"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-ink-400 transition hover:bg-cream-100 hover:text-brand-950"
                aria-label={copy.schemes.clearSearch}
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            ) : null}
          </div>
          <p className="shrink-0 text-xs text-ink-400">
            {copy.schemes.helper}
          </p>
        </div>

        <div className="mt-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-400">
            {copy.schemes.filters}
          </p>
          <div
            className="mt-2 flex flex-wrap gap-2"
            role="group"
            aria-label={copy.schemes.filters}
          >
            {CATEGORIES.map((key) => {
              const selected = category === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => changeCategory(key)}
                  aria-pressed={selected}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs font-medium transition',
                    selected
                      ? 'bg-brand-950 text-cream-50'
                      : 'bg-cream-50 text-ink-600 ring-1 ring-inset ring-ink-200 hover:bg-cream-100 hover:text-brand-950',
                  )}
                >
                  {copy.schemes.categories[key]}
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-4 border-t border-ink-100 pt-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-400">
            {copy.schemes.levelLabel}
          </p>
          <div
            className="mt-2 flex flex-wrap gap-2"
            role="group"
            aria-label={copy.schemes.levelLabel}
          >
            {LEVELS.map((key) => {
              const selected = level === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => changeLevel(key)}
                  aria-pressed={selected}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition',
                    selected
                      ? 'bg-teal-700 text-white'
                      : 'bg-cream-50 text-ink-600 ring-1 ring-inset ring-ink-200 hover:bg-cream-100 hover:text-brand-950',
                  )}
                >
                  {key === 'all' ? null : (
                    <Building2 className="h-3 w-3" aria-hidden="true" />
                  )}
                  {copy.schemes.levels[key]}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p
          className="text-xs font-medium text-ink-500"
          aria-live="polite"
          aria-busy={busy}
        >
          {data
            ? t(
                total === 1 ? 'schemes.resultsOne' : 'schemes.results',
                { count: formatNumber(total, locale) },
              )
            : copy.common.loading}
        </p>
        {hasFilters ? (
          <button
            type="button"
            onClick={resetFilters}
            className="text-xs font-medium text-coral-700 transition hover:text-coral-800"
          >
            {copy.schemes.reset}
          </button>
        ) : null}
      </div>

      {state.status === 'error' ? (
        <Notice
          tone="danger"
          title={copy.schemes.errorTitle}
          className="mt-3"
        >
          <p>{copy.schemes.errorCopy}</p>
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
            {copy.schemes.retry}
          </Button>
        </Notice>
      ) : null}

      {data?.message && state.status !== 'error' ? (
        <Notice tone="warning" className="mt-3">
          {data.message}
        </Notice>
      ) : null}

      {state.status === 'loading' ? (
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <SchemeCardSkeleton key={index} />
          ))}
        </div>
      ) : data?.items?.length ? (
        <>
          <div
            className={cn(
              'mt-3 grid grid-cols-1 gap-4 transition-opacity md:grid-cols-2',
              busy && 'opacity-60',
            )}
            aria-busy={busy}
          >
            {data.items.map((scheme) => (
              <Card
                key={scheme.id}
                className="flex h-full flex-col p-5 sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <Badge tone="coral">
                    {copy.schemes.categories[scheme.category] ??
                      scheme.category}
                  </Badge>
                  <Badge
                    tone={
                      scheme.government_level === 'state' ? 'teal' : 'neutral'
                    }
                  >
                    {scheme.government_level === 'state' ? (
                      <MapPin className="h-3 w-3" aria-hidden="true" />
                    ) : (
                      <Building2 className="h-3 w-3" aria-hidden="true" />
                    )}
                    {copy.schemes.levels[scheme.government_level] ??
                      scheme.government_level}
                  </Badge>
                </div>

                <h2 className="mt-4 font-display text-xl leading-snug text-brand-950">
                  {scheme.name}
                </h2>
                <p className="mt-1 text-xs font-medium text-ink-400">
                  {scheme.short_name}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-ink-600">
                  {scheme.summary}
                </p>

                {scheme.benefit_highlights.length ? (
                  <div className="mt-4 rounded-xl border border-ink-100 bg-cream-50 px-3.5 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400">
                      {copy.schemes.benefits}
                    </p>
                    <ul className="mt-1.5 space-y-1">
                      {scheme.benefit_highlights.map((benefit) => (
                        <li
                          key={benefit}
                          className="text-xs leading-relaxed text-ink-700"
                        >
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <dl className="mt-4 space-y-2 border-t border-ink-100 pt-4 text-xs">
                  <div className="flex gap-2">
                    <dt className="w-24 shrink-0 text-ink-400">
                      {copy.schemes.department}
                    </dt>
                    <dd className="min-w-0 text-ink-700">
                      {scheme.department}
                    </dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-24 shrink-0 text-ink-400">
                      {copy.common.verified}
                    </dt>
                    <dd className="inline-flex min-w-0 items-center gap-1.5 text-ink-700">
                      <CalendarCheck2
                        className="h-3.5 w-3.5 shrink-0 text-teal-600"
                        aria-hidden="true"
                      />
                      {formatDate(scheme.verified_on, locale)}
                    </dd>
                  </div>
                </dl>

                <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4">
                  <a
                    href={scheme.source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-[11px] font-medium text-ink-500 transition hover:text-brand-950"
                  >
                    <ExternalLink
                      className="h-3.5 w-3.5 shrink-0"
                      aria-hidden="true"
                    />
                    {copy.schemes.officialSource}
                  </a>
                  <Link
                    to={`/app/schemes/${scheme.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-cream-100 px-3 py-2 text-xs font-semibold text-brand-950 transition hover:bg-cream-200"
                  >
                    {copy.schemes.viewDetails}
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </Card>
            ))}
          </div>

          {totalPages > 1 ? (
            <nav
              className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink-200/70 bg-white px-4 py-3 shadow-soft"
              aria-label={copy.schemes.pageOf
                .replace('{page}', currentPage)
                .replace('{total}', totalPages)}
            >
              <Button
                variant="secondary"
                size="sm"
                disabled={busy || currentPage <= 1}
                onClick={() => setPage(Math.max(1, currentPage - 1))}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                {copy.schemes.previous}
              </Button>
              <p className="text-xs font-medium text-ink-500">
                {t('schemes.pageOf', {
                  page: formatNumber(currentPage, locale),
                  total: formatNumber(totalPages, locale),
                })}
              </p>
              <Button
                variant="secondary"
                size="sm"
                disabled={busy || currentPage >= totalPages}
                onClick={() =>
                  setPage(Math.min(totalPages, currentPage + 1))
                }
              >
                {copy.schemes.next}
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </nav>
          ) : null}
        </>
      ) : state.status !== 'error' && data ? (
        <EmptyState
          icon={Search}
          title={copy.schemes.emptyTitle}
          copy={copy.schemes.emptyCopy}
          className="mt-3"
          action={
            <Button variant="secondary" onClick={resetFilters}>
              {copy.schemes.reset}
            </Button>
          }
        />
      ) : null}

      {data?.content_note || data?.disclaimer ? (
        <div className="mt-6 space-y-2 rounded-2xl border border-ink-200/70 bg-cream-50 px-4 py-3.5 text-[11px] leading-relaxed text-ink-500">
          {data.content_note ? <p>{data.content_note}</p> : null}
          {data.disclaimer ? (
            <p className="text-ink-400">{data.disclaimer}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
