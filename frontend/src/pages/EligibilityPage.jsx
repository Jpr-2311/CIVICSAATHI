import { useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ListChecks,
  LockKeyhole,
  RefreshCw,
} from 'lucide-react'

import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Notice from '@/components/ui/Notice'
import ModuleHeader from '@/components/workspace/ModuleHeader'
import { useLanguage, useMessages } from '@/i18n'
import { cn } from '@/lib/cn'

const EMPTY_FORM = {
  age: '',
  district: '',
  area: '',
  income: '',
  household: '',
  category: '',
  needs: [],
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

export default function EligibilityPage() {
  const { t } = useLanguage()
  const copy = useMessages()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const formRef = useRef(null)

  const currentStep = copy.eligibility.steps[step]
  const totalSteps = copy.eligibility.steps.length

  const update = (key, value) => {
    setForm((previous) => ({ ...previous, [key]: value }))
    setErrors((previous) => {
      if (!previous[key]) return previous
      const next = { ...previous }
      delete next[key]
      return next
    })
  }

  const toggleNeed = (need) => {
    const selected = form.needs.includes(need)
    update(
      'needs',
      selected
        ? form.needs.filter((item) => item !== need)
        : [...form.needs, need],
    )
  }

  const validateStep = (current) => {
    const next = {}

    if (current === 0) {
      const age = Number(form.age)
      if (form.age === '' || Number.isNaN(age) || age < 0 || age > 120) {
        next.age = copy.eligibility.errors.age
      }
      if (!form.district) next.district = copy.eligibility.errors.district
      if (!form.area) next.area = copy.eligibility.errors.area
    }

    if (current === 1) {
      if (!form.income) next.income = copy.eligibility.errors.income
      const household = Number(form.household)
      if (
        form.household === '' ||
        Number.isNaN(household) ||
        household < 1 ||
        household > 30
      ) {
        next.household = copy.eligibility.errors.household
      }
      if (!form.category) next.category = copy.eligibility.errors.category
    }

    if (current === 2 && form.needs.length === 0) {
      next.needs = copy.eligibility.errors.needs
    }

    return next
  }

  const scrollToForm = () => {
    window.requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = validateStep(step)

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      window.requestAnimationFrame(() => {
        formRef.current?.querySelector('[aria-invalid="true"]')?.focus()
      })
      return
    }

    if (step < totalSteps - 1) {
      setErrors({})
      setStep((current) => current + 1)
      scrollToForm()
    }
  }

  const goBack = () => {
    setErrors({})
    setStep((current) => Math.max(0, current - 1))
    scrollToForm()
  }

  const startOver = (event) => {
    // React reuses this button's DOM node for the next step's submit button.
    // Cancel the click's default action so the type change cannot submit.
    event.preventDefault()
    setForm(EMPTY_FORM)
    setErrors({})
    setStep(0)
    scrollToForm()
  }

  const reviewRows = [
    {
      label: copy.eligibility.review.age,
      value: form.age || copy.eligibility.review.notProvided,
    },
    {
      label: copy.eligibility.review.district,
      value: form.district
        ? copy.eligibility.districts[form.district]
        : copy.eligibility.review.notProvided,
    },
    {
      label: copy.eligibility.review.area,
      value: form.area
        ? form.area === 'rural'
          ? copy.eligibility.fields.rural
          : copy.eligibility.fields.urban
        : copy.eligibility.review.notProvided,
    },
    {
      label: copy.eligibility.review.income,
      value: form.income
        ? copy.eligibility.options.income[form.income]
        : copy.eligibility.review.notProvided,
    },
    {
      label: copy.eligibility.review.household,
      value: form.household || copy.eligibility.review.notProvided,
    },
    {
      label: copy.eligibility.review.category,
      value: form.category
        ? copy.eligibility.options.category[form.category]
        : copy.eligibility.review.notProvided,
    },
    {
      label: copy.eligibility.review.needs,
      value: form.needs.length
        ? form.needs
            .map((need) => copy.eligibility.options.needs[need])
            .join(', ')
        : copy.eligibility.review.notProvided,
    },
  ]

  return (
    <div>
      <ModuleHeader
        icon={ListChecks}
        eyebrow={copy.eligibility.eyebrow}
        title={copy.eligibility.title}
        description={copy.eligibility.description}
        badge={t('common.preview')}
      />

      <Notice
        tone="preview"
        title={copy.eligibility.noticeTitle}
        className="mt-6"
      >
        {copy.eligibility.noticeCopy}
      </Notice>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_19rem]">
        <Card className="p-5 sm:p-6">
          <ol className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {copy.eligibility.steps.map((item, index) => {
              const isDone = index < step
              const isCurrent = index === step
              return (
                <li
                  key={item.title}
                  aria-current={isCurrent ? 'step' : undefined}
                  className={cn(
                    'rounded-xl border px-3 py-3',
                    isCurrent
                      ? 'border-coral-200 bg-coral-50/70'
                      : isDone
                        ? 'border-teal-200 bg-teal-50/60'
                        : 'border-ink-200 bg-cream-50',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold',
                        isDone
                          ? 'bg-teal-600 text-white'
                          : isCurrent
                            ? 'bg-coral-500 text-white'
                            : 'bg-white text-ink-400 ring-1 ring-inset ring-ink-200',
                      )}
                    >
                      {isDone ? (
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <p
                      className={cn(
                        'text-xs font-semibold leading-snug',
                        isCurrent ? 'text-brand-950' : 'text-ink-600',
                      )}
                    >
                      {item.title}
                    </p>
                  </div>
                </li>
              )
            })}
          </ol>

          <div
            className="mt-3 h-1.5 overflow-hidden rounded-full bg-cream-200"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={totalSteps}
            aria-valuenow={step + 1}
            aria-label={t('eligibility.stepOf', {
              current: step + 1,
              total: totalSteps,
            })}
          >
            <div
              className="h-full rounded-full bg-coral-500 transition-[width] duration-300"
              style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
            />
          </div>

          <p className="mt-2 text-[11px] font-medium text-ink-400">
            {t('eligibility.stepOf', {
              current: step + 1,
              total: totalSteps,
            })}
          </p>

          <form ref={formRef} noValidate onSubmit={handleSubmit} className="mt-5">
            <div aria-live="polite">
              <h2 className="font-display text-2xl text-brand-950">
                {currentStep.title}
              </h2>
              <p className="mt-1 text-sm text-ink-500">
                {currentStep.description}
              </p>
            </div>

            {step === 0 ? (
              <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="eligibility-age"
                    className="text-sm font-medium text-brand-950"
                  >
                    {copy.eligibility.fields.age}
                  </label>
                  <p
                    id="eligibility-age-hint"
                    className="mt-1 text-xs text-ink-400"
                  >
                    {copy.eligibility.fields.ageHint}
                  </p>
                  <input
                    id="eligibility-age"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    max="120"
                    value={form.age}
                    onChange={(event) => update('age', event.target.value)}
                    placeholder={copy.eligibility.fields.agePlaceholder}
                    aria-invalid={Boolean(errors.age)}
                    aria-describedby={cn(
                      'eligibility-age-hint',
                      errors.age && 'eligibility-age-error',
                    )}
                    className={cn(
                      INPUT_CLASS,
                      'mt-2',
                      errors.age && 'border-rose-300',
                    )}
                  />
                  <FieldError
                    id="eligibility-age-error"
                    message={errors.age}
                  />
                </div>

                <div>
                  <label
                    htmlFor="eligibility-district"
                    className="text-sm font-medium text-brand-950"
                  >
                    {copy.eligibility.fields.district}
                  </label>
                  <select
                    id="eligibility-district"
                    value={form.district}
                    onChange={(event) =>
                      update('district', event.target.value)
                    }
                    aria-invalid={Boolean(errors.district)}
                    aria-describedby={
                      errors.district ? 'eligibility-district-error' : undefined
                    }
                    className={cn(
                      INPUT_CLASS,
                      'mt-2',
                      errors.district && 'border-rose-300',
                    )}
                  >
                    <option value="" disabled>
                      {copy.eligibility.fields.districtPlaceholder}
                    </option>
                    {Object.entries(copy.eligibility.districts).map(
                      ([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ),
                    )}
                  </select>
                  <FieldError
                    id="eligibility-district-error"
                    message={errors.district}
                  />
                </div>

                <fieldset className="sm:col-span-2">
                  <legend className="text-sm font-medium text-brand-950">
                    {copy.eligibility.fields.area}
                  </legend>
                  <p
                    id="eligibility-area-hint"
                    className="mt-1 text-xs text-ink-400"
                  >
                    {copy.eligibility.fields.areaHint}
                  </p>
                  <div
                    className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2"
                    aria-describedby={cn(
                      'eligibility-area-hint',
                      errors.area && 'eligibility-area-error',
                    )}
                  >
                    {['rural', 'urban'].map((value) => (
                      <label
                        key={value}
                        className={cn(
                          'flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm transition',
                          form.area === value
                            ? 'border-teal-300 bg-teal-50/60 text-brand-950'
                            : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300',
                        )}
                      >
                        <input
                          type="radio"
                          name="eligibility-area"
                          value={value}
                          checked={form.area === value}
                          onChange={() => update('area', value)}
                          aria-invalid={Boolean(errors.area)}
                          className="mt-0.5 h-4 w-4 accent-teal-600"
                        />
                        <span>{copy.eligibility.fields[value]}</span>
                      </label>
                    ))}
                  </div>
                  <FieldError id="eligibility-area-error" message={errors.area} />
                </fieldset>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="eligibility-income"
                    className="text-sm font-medium text-brand-950"
                  >
                    {copy.eligibility.fields.income}
                  </label>
                  <select
                    id="eligibility-income"
                    value={form.income}
                    onChange={(event) => update('income', event.target.value)}
                    aria-invalid={Boolean(errors.income)}
                    aria-describedby={
                      errors.income ? 'eligibility-income-error' : undefined
                    }
                    className={cn(
                      INPUT_CLASS,
                      'mt-2',
                      errors.income && 'border-rose-300',
                    )}
                  >
                    <option value="" disabled>
                      {copy.eligibility.fields.incomePlaceholder}
                    </option>
                    {Object.entries(copy.eligibility.options.income).map(
                      ([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ),
                    )}
                  </select>
                  <FieldError
                    id="eligibility-income-error"
                    message={errors.income}
                  />
                </div>

                <div>
                  <label
                    htmlFor="eligibility-household"
                    className="text-sm font-medium text-brand-950"
                  >
                    {copy.eligibility.fields.household}
                  </label>
                  <p
                    id="eligibility-household-hint"
                    className="mt-1 text-xs text-ink-400"
                  >
                    {copy.eligibility.fields.householdHint}
                  </p>
                  <input
                    id="eligibility-household"
                    type="number"
                    inputMode="numeric"
                    min="1"
                    max="30"
                    value={form.household}
                    onChange={(event) =>
                      update('household', event.target.value)
                    }
                    placeholder={
                      copy.eligibility.fields.householdPlaceholder
                    }
                    aria-invalid={Boolean(errors.household)}
                    aria-describedby={cn(
                      'eligibility-household-hint',
                      errors.household && 'eligibility-household-error',
                    )}
                    className={cn(
                      INPUT_CLASS,
                      'mt-2',
                      errors.household && 'border-rose-300',
                    )}
                  />
                  <FieldError
                    id="eligibility-household-error"
                    message={errors.household}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="eligibility-category"
                    className="text-sm font-medium text-brand-950"
                  >
                    {copy.eligibility.fields.category}
                  </label>
                  <select
                    id="eligibility-category"
                    value={form.category}
                    onChange={(event) =>
                      update('category', event.target.value)
                    }
                    aria-invalid={Boolean(errors.category)}
                    aria-describedby={
                      errors.category ? 'eligibility-category-error' : undefined
                    }
                    className={cn(
                      INPUT_CLASS,
                      'mt-2',
                      errors.category && 'border-rose-300',
                    )}
                  >
                    <option value="" disabled>
                      {copy.eligibility.fields.categoryPlaceholder}
                    </option>
                    {Object.entries(copy.eligibility.options.category).map(
                      ([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ),
                    )}
                  </select>
                  <FieldError
                    id="eligibility-category-error"
                    message={errors.category}
                  />
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <fieldset className="mt-5">
                <legend className="text-sm font-medium text-brand-950">
                  {copy.eligibility.fields.needs}
                </legend>
                <p
                  id="eligibility-needs-hint"
                  className="mt-1 text-xs text-ink-400"
                >
                  {copy.eligibility.fields.needsHint}
                </p>
                <div
                  className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2"
                  aria-describedby={cn(
                    'eligibility-needs-hint',
                    errors.needs && 'eligibility-needs-error',
                  )}
                >
                  {Object.entries(copy.eligibility.options.needs).map(
                    ([key, label]) => {
                      const checked = form.needs.includes(key)
                      return (
                        <label
                          key={key}
                          className={cn(
                            'flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-sm transition',
                            checked
                              ? 'border-teal-300 bg-teal-50/60 text-brand-950'
                              : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300',
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleNeed(key)}
                            aria-invalid={Boolean(errors.needs)}
                            className="mt-0.5 h-4 w-4 rounded accent-teal-600"
                          />
                          <span>{label}</span>
                        </label>
                      )
                    },
                  )}
                </div>
                <FieldError id="eligibility-needs-error" message={errors.needs} />
              </fieldset>
            ) : null}

            {step === 3 ? (
              <div className="mt-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-brand-950">
                      {copy.eligibility.review.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-ink-500">
                      {copy.eligibility.review.copy}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setStep(0)
                      scrollToForm()
                    }}
                  >
                    {t('common.edit')}
                  </Button>
                </div>

                <dl className="mt-4 divide-y divide-ink-100 rounded-xl border border-ink-200">
                  {reviewRows.map((row) => (
                    <div
                      key={row.label}
                      className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
                    >
                      <dt className="text-xs font-medium text-ink-400">
                        {row.label}
                      </dt>
                      <dd className="text-sm text-ink-700 sm:text-right">
                        {row.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 pt-4">
              <div>
                {step > 0 ? (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={goBack}
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    {copy.eligibility.buttons.back}
                  </Button>
                ) : null}
              </div>
              <div>
                {step < totalSteps - 1 ? (
                  <Button type="submit">
                    {step === 2
                      ? copy.eligibility.buttons.review
                      : copy.eligibility.buttons.continue}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                ) : (
                  <Button type="button" onClick={startOver}>
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    {copy.eligibility.buttons.startOver}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Card>

        <aside className="space-y-4">
          <Card surface="teal" className="border-teal-200 p-5">
            <div className="flex gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-teal-700 ring-1 ring-inset ring-teal-200">
                <LockKeyhole className="h-4 w-4" aria-hidden="true" />
              </span>
              <p className="text-xs leading-relaxed text-teal-900">
                {copy.eligibility.privacy}
              </p>
            </div>
          </Card>

          <Card surface="cream" className="border-dashed border-ink-300 p-5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-ink-500 ring-1 ring-inset ring-ink-200">
              <ListChecks className="h-5 w-5" aria-hidden="true" />
            </span>
            <Badge tone="coral" className="mt-4">
              {copy.eligibility.result.badge}
            </Badge>
            <h2 className="mt-3 font-display text-xl leading-snug text-brand-950">
              {copy.eligibility.result.title}
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-ink-500">
              {copy.eligibility.result.copy}
            </p>
          </Card>
        </aside>
      </div>
    </div>
  )
}
