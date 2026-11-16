import { useMemo, useState } from 'react'
import { Clock, Search, X } from 'lucide-react'

import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import EmptyState from '@/components/ui/EmptyState'
import Notice from '@/components/ui/Notice'
import ModuleHeader from '@/components/workspace/ModuleHeader'
import { useLanguage, useMessages } from '@/i18n'
import { cn } from '@/lib/cn'

const CATEGORIES = ['all', 'agriculture', 'health', 'education', 'welfare']

export default function SchemesPage() {
  const { t } = useLanguage()
  const copy = useMessages()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')

  const records = copy.schemes.records
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return records.filter((record) => {
      const matchesCategory =
        category === 'all' || record.category === category

      if (!matchesCategory) return false
      if (!needle) return true

      return [
        record.title,
        record.summary,
        record.benefit,
        record.department,
        record.audience,
      ]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    })
  }, [category, query, records])

  return (
    <div>
      <ModuleHeader
        icon={Search}
        eyebrow={copy.schemes.eyebrow}
        title={copy.schemes.title}
        description={copy.schemes.description}
        badge={t('common.preview')}
      />

      <Notice
        tone="preview"
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

        <div
          className="mt-3 flex flex-wrap gap-2"
          role="group"
          aria-label={copy.schemes.filters}
        >
          {CATEGORIES.map((key) => {
            const selected = category === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => setCategory(key)}
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

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-ink-500">
          {t(
            filtered.length === 1 ? 'schemes.resultsOne' : 'schemes.results',
            { count: filtered.length },
          )}
        </p>
        {query || category !== 'all' ? (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setCategory('all')
            }}
            className="text-xs font-medium text-coral-700 transition hover:text-coral-800"
          >
            {copy.schemes.reset}
          </button>
        ) : null}
      </div>

      {filtered.length ? (
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((record) => (
            <Card key={record.id} className="flex h-full flex-col p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <Badge tone="coral">{copy.schemes.demoBadge}</Badge>
                <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-ink-400">
                  {copy.schemes.categories[record.category]}
                </span>
              </div>

              <h2 className="mt-4 font-display text-xl leading-snug text-brand-950">
                {record.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">
                {record.summary}
              </p>

              <dl className="mt-4 space-y-2 border-t border-ink-100 pt-4 text-xs">
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0 text-ink-400">
                    {copy.schemes.benefit}
                  </dt>
                  <dd className="min-w-0 text-ink-700">{record.benefit}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0 text-ink-400">
                    {copy.schemes.department}
                  </dt>
                  <dd className="min-w-0 text-ink-700">{record.department}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0 text-ink-400">
                    {copy.schemes.audience}
                  </dt>
                  <dd className="min-w-0 text-ink-700">{record.audience}</dd>
                </div>
              </dl>

              <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4">
                <span className="inline-flex items-start gap-1.5 text-[11px] leading-relaxed text-ink-400">
                  <Clock
                    className="mt-0.5 h-3.5 w-3.5 shrink-0"
                    aria-hidden="true"
                  />
                  {copy.schemes.sourcePending}
                </span>
                <span className="rounded-full border border-ink-200 bg-cream-50 px-2.5 py-1 text-[10px] font-medium text-ink-500">
                  {copy.schemes.detailsSoon}
                </span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Search}
          title={copy.schemes.emptyTitle}
          copy={copy.schemes.emptyCopy}
          className="mt-3"
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setQuery('')
                setCategory('all')
              }}
            >
              {copy.schemes.reset}
            </Button>
          }
        />
      )}
    </div>
  )
}
