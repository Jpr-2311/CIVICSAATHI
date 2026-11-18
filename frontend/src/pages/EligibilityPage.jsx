import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  ExternalLink,
  ListChecks,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from 'lucide-react'

import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import EmptyState from '@/components/ui/EmptyState'
import Notice from '@/components/ui/Notice'
import ModuleHeader from '@/components/workspace/ModuleHeader'
import { useLanguage, useMessages } from '@/i18n'
import { formatDateTime, formatDate } from '@/lib/format'
import { checkEligibility, isCanceled } from '@/services/api'
import { cn } from '@/lib/cn'

const EMPTY_FORM = {
  age: '',
  state: '',
  area: '',
  annual_income: '',
  category: '',
  indian_citizen: '',
  bpl: '',
  income_tax_payer: '',
  ever_income_tax_payer: '',
  bank_account: '',
  monthly_pension: '',
  government_employee: '',
  excluded_government_job: '',
  constitutional_post_holder: '',
  registered_professional: '',
  landholding: '',
  institutional_landholder: '',
  informal_self_employed: '',
  vishwakarma_trade: '',
  family_registered_in_scheme: '',
  similar_loan_in_5_years: '',
  consent_auto_debit: '',
  duplicate_enrolment: '',
  willing_manual_work: '',
  street_vendor: '',
  unique_upi_id: '',
  loan_npa_or_written_off: '',
  lost_parent: '',
  education_level: '',
  dialysis_patient: '',
  transplant_patient: '',
  years_since_transplant: '',
  hemophilia_patient: '',
  sickle_cell_patient: '',
}

const NUMBER_FIELDS = [
  { name: 'age', min: 0, max: 120 },
  { name: 'annual_income', min: 0, max: 1_000_000_000 },
  { name: 'monthly_pension', min: 0, max: 1_000_000 },
  { name: 'years_since_transplant', min: 0, max: 100 },
]

const TRI_FIELDS = [
  'indian_citizen',
  'bpl',
  'income_tax_payer',
  'ever_income_tax_payer',
  'bank_account',
  'government_employee',
  'excluded_government_job',
  'constitutional_post_holder',
  'registered_professional',
  'landholding',
  'institutional_landholder',
  'informal_self_employed',
  'vishwakarma_trade',
  'family_registered_in_scheme',
  'similar_loan_in_5_years',
  'consent_auto_debit',
  'duplicate_enrolment',
  'willing_manual_work',
  'street_vendor',
  'unique_upi_id',
  'loan_npa_or_written_off',
  'lost_parent',
  'dialysis_patient',
  'transplant_patient',
  'hemophilia_patient',
  'sickle_cell_patient',
]

const SECTIONS = [
  {
    id: 'about',
    fields: [
      { name: 'age', kind: 'number' },
      { name: 'state', kind: 'select', optionKey: 'state' },
      { name: 'area', kind: 'select', optionKey: 'area' },
      { name: 'category', kind: 'select', optionKey: 'category' },
      { name: 'indian_citizen', kind: 'tri' },
    ],
  },
  {
    id: 'household',
    fields: [
      { name: 'annual_income', kind: 'number' },
      { name: 'bpl', kind: 'tri' },
      { name: 'income_tax_payer', kind: 'tri' },
      { name: 'ever_income_tax_payer', kind: 'tri' },
      { name: 'bank_account', kind: 'tri' },
      { name: 'monthly_pension', kind: 'number' },
    ],
  },
  {
    id: 'work',
    fields: [
      { name: 'landholding', kind: 'tri' },
      { name: 'institutional_landholder', kind: 'tri' },
      { name: 'government_employee', kind: 'tri' },
      { name: 'excluded_government_job', kind: 'tri' },
      { name: 'constitutional_post_holder', kind: 'tri' },
      { name: 'registered_professional', kind: 'tri' },
      { name: 'informal_self_employed', kind: 'tri' },
      { name: 'vishwakarma_trade', kind: 'tri' },
      { name: 'family_registered_in_scheme', kind: 'tri' },
      { name: 'similar_loan_in_5_years', kind: 'tri' },
      { name: 'street_vendor', kind: 'tri' },
      { name: 'unique_upi_id', kind: 'tri' },
      { name: 'loan_npa_or_written_off', kind: 'tri' },
      { name: 'willing_manual_work', kind: 'tri' },
    ],
  },
  {
    id: 'health',
    fields: [
      { name: 'lost_parent', kind: 'tri' },
      { name: 'education_level', kind: 'select', optionKey: 'education' },
      { name: 'dialysis_patient', kind: 'tri' },
      { name: 'transplant_patient', kind: 'tri' },
      { name: 'years_since_transplant', kind: 'number' },
      { name: 'hemophilia_patient', kind: 'tri' },
      { name: 'sickle_cell_patient', kind: 'tri' },
    ],
  },
  {
    id: 'insurance',
    fields: [
      { name: 'consent_auto_debit', kind: 'tri' },
      { name: 'duplicate_enrolment', kind: 'tri' },
    ],
  },
]

const OUTCOMES = [
  'potentially_eligible',
  'manual_review',
  'insufficient_information',
  'ineligible',
]

const OUTCOME_TONES = {
  potentially_eligible: 'success',
  ineligible: 'danger',
  insufficient_information: 'warning',
  manual_review: 'info',
}

const GROUP_TONES = {
  satisfied: 'success',
  failed: 'danger',
  insufficient_information: 'warning',
  manual_review: 'info',
}

const STATUS_STYLES = {
  pass: {
    icon: CheckCircle2,
    className: 'text-teal-600',
    badge: 'success',
  },
  fail: {
    icon: XCircle,
    className: 'text-rose-600',
    badge: 'danger',
  },
  unknown: {
    icon: CircleHelp,
    className: 'text-amber-600',
    badge: 'warning',
  },
}

const INPUT_CLASS =
  'h-11 w-full rounded-xl border border-ink-200 bg-white px-3.5 text-sm text-ink-800 placeholder:text-ink-400 focus:border-brand-400'

function FieldError({ id, message }) {
  if (!message) return null

  return (
    <p id={id} role="alert" className="mt-1.5 text-xs text-rose-600">
      {message}
    </p>
  )
}

function buildPayload(form, language) {
  const payload = { language }
  const errors = {}

  NUMBER_FIELDS.forEach((field) => {
    const raw = form[field.name].trim()
    if (raw === '') return

    if (!/^\d+$/.test(raw)) {
      errors[field.name] = field.name
      return
    }

    const value = Number(raw)
    if (value < field.min || value > field.max) {
      errors[field.name] = field.name
      return
    }

    payload[field.name] = value
  })

  TRI_FIELDS.forEach((name) => {
    if (form[name] === 'yes') payload[name] = true
    else if (form[name] === 'no') payload[name] = false
  })

  if (form.area) payload.area = form.area
  if (form.category) payload.category = form.category
  if (form.education_level) payload.education_level = form.education_level
  if (form.state === 'kerala') payload.state = 'Kerala'
  else if (form.state === 'other') payload.state = 'Another state'

  return { payload, errors }
}

export default function EligibilityPage() {
  const { t, language, locale } = useLanguage()
  const copy = useMessages()

  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle')
  const [result, setResult] = useState(null)
  const [requestError, setRequestError] = useState(null)
  const [outcomeFilter, setOutcomeFilter] = useState('all')

  const formRef = useRef(null)
  const resultsRef = useRef(null)
  const lastPayloadRef = useRef(null)
  const requestIdRef = useRef(0)
  const shouldScrollRef = useRef(false)

  const runCheck = useCallback(async (payload) => {
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId
    setStatus('loading')
    setRequestError(null)

    try {
      const data = await checkEligibility(payload)
      if (requestId !== requestIdRef.current) return

      setResult(data)
      setStatus('ready')

      if (shouldScrollRef.current) {
        shouldScrollRef.current = false
        window.requestAnimationFrame(() => {
          resultsRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          })
        })
      }
    } catch (error) {
      if (requestId !== requestIdRef.current || isCanceled(error)) return
      setStatus('error')
      setRequestError(error)
    }
  }, [])

  useEffect(() => {
    if (!lastPayloadRef.current) return
    runCheck({ ...lastPayloadRef.current, language })
  }, [language, runCheck])

  const update = (key, value) => {
    setForm((previous) => ({ ...previous, [key]: value }))
    setErrors((previous) => {
      if (!previous[key]) return previous
      const next = { ...previous }
      delete next[key]
      return next
    })
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const { payload, errors: validation } = buildPayload(form, language)
    if (Object.keys(validation).length > 0) {
      setErrors(validation)
      window.requestAnimationFrame(() => {
        formRef.current?.querySelector('[aria-invalid="true"]')?.focus()
      })
      return
    }

    setErrors({})
    setOutcomeFilter('all')
    lastPayloadRef.current = payload
    shouldScrollRef.current = true
    runCheck(payload)
  }

  const retry = () => {
    if (!lastPayloadRef.current) return
    runCheck({ ...lastPayloadRef.current, language })
  }

  const startOver = () => {
    requestIdRef.current += 1
    lastPayloadRef.current = null
    shouldScrollRef.current = false
    setForm(EMPTY_FORM)
    setErrors({})
    setResult(null)
    setRequestError(null)
    setStatus('idle')
    setOutcomeFilter('all')
    window.requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })
  }

  const results = result?.results ?? []
  const counts = results.reduce((accumulator, item) => {
    accumulator[item.outcome] = (accumulator[item.outcome] ?? 0) + 1
    return accumulator
  }, {})
  const visibleResults =
    outcomeFilter === 'all'
      ? results
      : results.filter((item) => item.outcome === outcomeFilter)

  const renderField = (field) => {
    const meta = copy.eligibility.fields[field.name]
    const id = `eligibility-${field.name}`
    const hintId = meta.hint ? `${id}-hint` : undefined
    const errorId = errors[field.name] ? `${id}-error` : undefined
    const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined
    const invalid = Boolean(errors[field.name])

    return (
      <div key={field.name} className="min-w-0">
        <label
          htmlFor={id}
          className="text-sm font-medium text-brand-950"
        >
          {meta.label}
        </label>
        {meta.hint ? (
          <p id={hintId} className="mt-0.5 text-[11px] text-ink-400">
            {meta.hint}
          </p>
        ) : null}

        {field.kind === 'number' ? (
          <input
            id={id}
            type="number"
            inputMode="numeric"
            min="0"
            max={
              NUMBER_FIELDS.find((item) => item.name === field.name)?.max
            }
            step="1"
            value={form[field.name]}
            onChange={(event) => update(field.name, event.target.value)}
            placeholder={meta.placeholder}
            aria-invalid={invalid}
            aria-describedby={describedBy}
            className={cn(
              INPUT_CLASS,
              'mt-2',
              invalid && 'border-rose-300',
            )}
          />
        ) : (
          <select
            id={id}
            value={form[field.name]}
            onChange={(event) => update(field.name, event.target.value)}
            aria-invalid={invalid}
            aria-describedby={describedBy}
            className={cn(
              INPUT_CLASS,
              'mt-2',
              invalid && 'border-rose-300',
            )}
          >
            <option value="">
              {field.kind === 'tri'
                ? copy.eligibility.options.unsure
                : meta.placeholder || copy.eligibility.options.choose}
            </option>
            {field.kind === 'tri' ? (
              <>
                <option value="yes">{copy.eligibility.options.yes}</option>
                <option value="no">{copy.eligibility.options.no}</option>
              </>
            ) : (
              Object.entries(
                copy.eligibility.options[field.optionKey] ?? {},
              ).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))
            )}
          </select>
        )}

        <FieldError
          id={errors[field.name] ? `${id}-error` : undefined}
          message={
            errors[field.name]
              ? copy.eligibility.errors[errors[field.name]]
              : undefined
          }
        />
      </div>
    )
  }

  return (
    <div>
      <ModuleHeader
        icon={ListChecks}
        eyebrow={copy.eligibility.eyebrow}
        title={copy.eligibility.title}
        description={copy.eligibility.description}
        badge={copy.eligibility.badge}
      />

      <Notice
        tone="warning"
        title={copy.eligibility.noticeTitle}
        className="mt-6"
      >
        {copy.eligibility.noticeCopy}
      </Notice>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_19rem] lg:items-start">
        <Card className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl text-brand-950">
                {copy.eligibility.formTitle}
              </h2>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink-500">
                {copy.eligibility.formCopy}
              </p>
            </div>
            <Badge tone="neutral">{t('common.optional')}</Badge>
          </div>

          <form
            ref={formRef}
            noValidate
            onSubmit={handleSubmit}
            className="mt-6"
          >
            {SECTIONS.map((section, index) => {
              const sectionCopy = copy.eligibility.sections[section.id]
              return (
                <fieldset
                  key={section.id}
                  className={cn(
                    'border-t border-ink-100 pt-6 first:border-t-0 first:pt-0',
                    index > 0 && 'mt-6',
                  )}
                >
                  <legend className="flex items-center gap-2 text-sm font-semibold text-brand-950">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-cream-100 text-[10px] font-semibold text-brand-800">
                      {index + 1}
                    </span>
                    {sectionCopy.title}
                  </legend>
                  <p className="mt-1 text-xs text-ink-400">
                    {sectionCopy.description}
                  </p>
                  <div className="mt-4 grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
                    {section.fields.map(renderField)}
                  </div>
                </fieldset>
              )
            })}

            <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-ink-100 pt-5">
              <Button
                type="submit"
                loading={status === 'loading'}
                disabled={status === 'loading'}
              >
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                {status === 'loading'
                  ? copy.eligibility.checking
                  : copy.eligibility.submit}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={startOver}
                disabled={status === 'loading'}
              >
                {copy.eligibility.clear}
              </Button>
            </div>
          </form>
        </Card>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <Card className="p-5">
            <div className="flex items-center gap-2">
              <LockKeyhole
                className="h-4 w-4 text-teal-600"
                aria-hidden="true"
              />
              <h2 className="text-sm font-semibold text-brand-950">
                {copy.eligibility.privacyTitle}
              </h2>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-ink-500">
              {copy.eligibility.privacyCopy}
            </p>
          </Card>

          <Card surface="cream" className="p-5">
            <h2 className="text-sm font-semibold text-brand-950">
              {copy.eligibility.results.title}
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-ink-500">
              {copy.eligibility.results.privateNote}
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-ink-400">
              {copy.eligibility.noticeCopy}
            </p>
          </Card>
        </aside>
      </div>

      <section
        ref={resultsRef}
        className="mt-8 scroll-mt-24"
        aria-live="polite"
        aria-busy={status === 'loading'}
      >
        {status === 'loading' ? (
          <Card className="flex items-start gap-4 p-5 sm:p-6">
            <LoaderCircle
              className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-coral-600"
              aria-hidden="true"
            />
            <div>
              <h2 className="text-sm font-semibold text-brand-950">
                {copy.eligibility.results.loadingTitle}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-500">
                {copy.eligibility.results.loadingCopy}
              </p>
            </div>
          </Card>
        ) : status === 'error' ? (
          <Notice
            tone="danger"
            title={copy.eligibility.errorTitle}
          >
            <p>{copy.eligibility.errorCopy}</p>
            {requestError?.message ? (
              <p className="mt-2 break-words font-mono text-[11px] opacity-80">
                {requestError.message}
              </p>
            ) : null}
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={retry}
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              {copy.eligibility.retry}
            </Button>
          </Notice>
        ) : result ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl text-brand-950">
                  {copy.eligibility.results.title}
                </h2>
                <p className="mt-1 text-sm text-ink-500">
                  {t(
                    results.length === 1
                      ? 'eligibility.results.countOne'
                      : 'eligibility.results.count',
                    { count: results.length },
                  )}
                  {' · '}
                  {t(
                    result.profile_fields_received.length === 1
                      ? 'eligibility.results.fieldsOne'
                      : 'eligibility.results.fields',
                    { count: result.profile_fields_received.length },
                  )}
                  {' · '}
                  {formatDateTime(result.checked_at, locale)}
                </p>
                <p className="mt-1 text-xs text-ink-400">
                  {copy.eligibility.results.privateNote}
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={startOver}>
                {copy.eligibility.clear}
              </Button>
            </div>

            <div
              className="mt-4 flex flex-wrap gap-2"
              role="group"
              aria-label={copy.eligibility.results.filterLabel}
            >
              <button
                type="button"
                onClick={() => setOutcomeFilter('all')}
                aria-pressed={outcomeFilter === 'all'}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition',
                  outcomeFilter === 'all'
                    ? 'bg-brand-950 text-cream-50'
                    : 'bg-white text-ink-600 ring-1 ring-inset ring-ink-200 hover:bg-cream-50',
                )}
              >
                {copy.eligibility.results.all}
                <span className="text-[10px] opacity-70">{results.length}</span>
              </button>
              {OUTCOMES.map((outcome) => (
                <button
                  key={outcome}
                  type="button"
                  onClick={() => setOutcomeFilter(outcome)}
                  aria-pressed={outcomeFilter === outcome}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition',
                    outcomeFilter === outcome
                      ? 'bg-brand-950 text-cream-50'
                      : 'bg-white text-ink-600 ring-1 ring-inset ring-ink-200 hover:bg-cream-50',
                  )}
                >
                  {copy.eligibility.results.outcomes[outcome]}
                  <span className="text-[10px] opacity-70">
                    {counts[outcome] ?? 0}
                  </span>
                </button>
              ))}
            </div>

            {visibleResults.length ? (
              <div className="mt-4 space-y-4">
                {visibleResults.map((item) => (
                  <Card key={item.scheme_id} className="p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-display text-xl leading-snug text-brand-950">
                          {item.scheme_name}
                        </h3>
                        <p className="mt-1 text-[11px] text-ink-400">
                          {copy.schemes.categories[item.category] ??
                            item.category}
                          {' · '}
                          {copy.schemes.levels[item.government_level] ??
                            item.government_level}
                        </p>
                      </div>
                      <Badge
                        tone={OUTCOME_TONES[item.outcome] ?? 'neutral'}
                      >
                        {copy.eligibility.results.outcomes[item.outcome] ??
                          item.outcome}
                      </Badge>
                    </div>

                    <p className="mt-3 text-sm leading-relaxed text-ink-600">
                      {item.summary}
                    </p>
                    <p className="mt-2 rounded-xl border border-ink-100 bg-cream-50 px-3.5 py-2.5 text-sm leading-relaxed text-ink-700">
                      {item.outcome_message}
                    </p>

                    <details className="group mt-4 rounded-xl border border-ink-200">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3.5 py-2.5 text-xs font-semibold text-brand-950 [&::-webkit-details-marker]:hidden">
                        <span className="inline-flex items-center gap-1.5">
                          <ListChecks
                            className="h-3.5 w-3.5 text-ink-400"
                            aria-hidden="true"
                          />
                          <span className="group-open:hidden">
                            {copy.eligibility.results.expand}
                          </span>
                          <span className="hidden group-open:inline">
                            {copy.eligibility.results.collapse}
                          </span>
                        </span>
                        <ChevronDown
                          className="h-4 w-4 shrink-0 text-ink-400 transition group-open:rotate-180"
                          aria-hidden="true"
                        />
                      </summary>

                      <div className="border-t border-ink-100 px-3.5 py-3.5">
                        <h4 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-400">
                          {copy.eligibility.results.conditionsTitle}
                        </h4>
                        <ul className="mt-2 space-y-2">
                          {item.conditions.map((condition) => {
                            const style =
                              STATUS_STYLES[condition.status] ??
                              STATUS_STYLES.unknown
                            const Icon = style.icon
                            return (
                              <li
                                key={condition.id}
                                className="flex gap-2.5 rounded-lg border border-ink-100 px-3 py-2.5"
                              >
                                <Icon
                                  className={cn(
                                    'mt-0.5 h-4 w-4 shrink-0',
                                    style.className,
                                  )}
                                  aria-hidden="true"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-xs font-medium text-brand-950">
                                      {condition.label}
                                    </p>
                                    <Badge tone={style.badge}>
                                      {copy.eligibility.results.statuses[
                                        condition.status
                                      ] ?? condition.status}
                                    </Badge>
                                  </div>
                                  <p className="mt-1 text-[11px] leading-relaxed text-ink-500">
                                    {condition.message}
                                  </p>
                                  <p className="mt-0.5 text-[10px] text-ink-400">
                                    {copy.eligibility.results.reasons[
                                      condition.reason
                                    ] ?? condition.reason}
                                  </p>
                                </div>
                              </li>
                            )
                          })}
                        </ul>

                        <h4 className="mt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-400">
                          {copy.eligibility.results.groupsTitle}
                        </h4>
                        <ul className="mt-2 space-y-2">
                          {item.groups.map((group, index) => (
                            <li
                              key={`${item.scheme_id}-group-${index}`}
                              className="flex flex-wrap items-start justify-between gap-2 rounded-lg bg-cream-50 px-3 py-2.5"
                            >
                              <p className="min-w-0 flex-1 text-[11px] leading-relaxed text-ink-600">
                                {group.message}
                              </p>
                              <Badge
                                tone={GROUP_TONES[group.status] ?? 'neutral'}
                              >
                                {copy.eligibility.results.groupStatuses[
                                  group.status
                                ] ?? group.status}
                              </Badge>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </details>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                      <a
                        href={item.source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-[11px] font-medium text-ink-500 transition hover:text-brand-950"
                      >
                        <ExternalLink
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        />
                        {copy.eligibility.results.source}
                      </a>
                      <Link
                        to={`/app/schemes/${item.scheme_id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-cream-100 px-3 py-2 text-xs font-semibold text-brand-950 transition hover:bg-cream-200"
                      >
                        {copy.eligibility.results.viewScheme}
                        <ArrowRight
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        />
                      </Link>
                    </div>

                    <p className="mt-3 border-t border-ink-100 pt-2.5 text-[10px] leading-relaxed text-ink-400">
                      {item.disclaimer}
                      {' · '}
                      {copy.schemes.detail.verifiedOn.replace(
                        '{date}',
                        formatDate(item.verified_on, locale),
                      )}
                    </p>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={CircleHelp}
                title={copy.eligibility.results.emptyTitle}
                copy={copy.eligibility.results.emptyCopy}
                className="mt-4"
                action={
                  <Button
                    variant="secondary"
                    onClick={() => setOutcomeFilter('all')}
                  >
                    {copy.eligibility.results.all}
                  </Button>
                }
              />
            )}

            <p className="mt-4 rounded-2xl border border-ink-200/70 bg-cream-50 px-4 py-3 text-[11px] leading-relaxed text-ink-500">
              {result.disclaimer}
            </p>
          </>
        ) : null}
      </section>
    </div>
  )
}
