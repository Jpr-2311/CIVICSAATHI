import { useRef, useState } from 'react'
import {
  FileSearch,
  FileText,
  Info,
  LockKeyhole,
  Plus,
  ShieldCheck,
  Upload,
  X,
} from 'lucide-react'

import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import EmptyState from '@/components/ui/EmptyState'
import Notice from '@/components/ui/Notice'
import ModuleHeader from '@/components/workspace/ModuleHeader'
import { useLanguage, useMessages } from '@/i18n'
import { cn } from '@/lib/cn'

const MAX_BYTES = 10 * 1024 * 1024

function formatSize(bytes, locale) {
  if (bytes >= 1024 * 1024) {
    return `${new Intl.NumberFormat(locale, {
      maximumFractionDigits: 1,
    }).format(bytes / (1024 * 1024))} MB`
  }

  return `${new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(bytes / 1024)} KB`
}

export default function DocumentsPage() {
  const { t, locale } = useLanguage()
  const copy = useMessages()
  const [documents, setDocuments] = useState([])
  const [error, setError] = useState(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  const addFiles = (fileList) => {
    const files = Array.from(fileList ?? [])
    if (!files.length) return

    let nextError = null
    const accepted = []

    files.forEach((file, index) => {
      const isPdf =
        file.type === 'application/pdf' ||
        file.name.toLowerCase().endsWith('.pdf')

      if (!isPdf) {
        nextError = copy.documents.errorType
        return
      }

      if (file.size > MAX_BYTES) {
        nextError = copy.documents.errorSize
        return
      }

      accepted.push({
        id:
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${index}-${file.name}`,
        name: file.name,
        size: file.size,
      })
    })

    if (accepted.length) {
      setDocuments((previous) => [...previous, ...accepted])
    }
    setError(nextError)
  }

  const handleFileInput = (event) => {
    addFiles(event.target.files)
    event.target.value = ''
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setDragging(false)
    addFiles(event.dataTransfer.files)
  }

  return (
    <div>
      <ModuleHeader
        icon={FileText}
        eyebrow={copy.documents.eyebrow}
        title={copy.documents.title}
        description={copy.documents.description}
        badge={t('common.preview')}
      />

      <Notice
        tone="preview"
        title={copy.documents.noticeTitle}
        className="mt-6"
      >
        {copy.documents.noticeCopy}
      </Notice>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_19rem]">
        <div className="space-y-4">
          <Card className="p-4 sm:p-6">
            <div
              onDragEnter={(event) => {
                event.preventDefault()
                setDragging(true)
              }}
              onDragOver={(event) => {
                event.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={cn(
                'rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors',
                dragging
                  ? 'border-teal-400 bg-teal-50'
                  : 'border-ink-300 bg-cream-50',
              )}
            >
              <input
                id="document-upload"
                ref={inputRef}
                type="file"
                accept=".pdf,application/pdf"
                multiple
                onChange={handleFileInput}
                className="sr-only"
                tabIndex={-1}
              />
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-brand-800 ring-1 ring-inset ring-ink-200">
                <Upload className="h-6 w-6" aria-hidden="true" />
              </span>
              <h2 className="mt-4 font-display text-2xl text-brand-950">
                {dragging
                  ? copy.documents.dropActive
                  : copy.documents.dropTitle}
              </h2>
              <p className="mt-1.5 text-sm text-ink-500">
                {copy.documents.dropCopy}
              </p>
              <Button
                type="button"
                variant="secondary"
                className="mt-5"
                onClick={() => inputRef.current?.click()}
              >
                <FileText className="h-4 w-4" aria-hidden="true" />
                {copy.documents.browse}
              </Button>
              <p className="mt-3 text-[11px] text-ink-400">
                {copy.documents.accepted}
              </p>
            </div>

            {error ? (
              <Notice tone="danger" className="mt-3">
                {error}
              </Notice>
            ) : null}
          </Card>

          <Card className="p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-brand-950">
                  {copy.documents.selectedTitle}
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-ink-500">
                  {copy.documents.localNote}
                </p>
              </div>
              {documents.length ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => inputRef.current?.click()}
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  {copy.documents.addMore}
                </Button>
              ) : null}
            </div>

            {documents.length ? (
              <ul className="mt-4 divide-y divide-ink-100 rounded-xl border border-ink-200">
                {documents.map((document) => (
                  <li
                    key={document.id}
                    className="flex flex-wrap items-center gap-3 px-4 py-3"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-cream-100 text-coral-700">
                      <FileText
                        className="h-[18px] w-[18px]"
                        aria-hidden="true"
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-medium text-brand-950">
                        {document.name}
                      </p>
                      <p className="mt-0.5 text-[11px] text-ink-400">
                        {formatSize(document.size, locale)}
                      </p>
                    </div>
                    <Badge tone="neutral">
                      {copy.documents.notUploaded}
                    </Badge>
                    <button
                      type="button"
                      onClick={() =>
                        setDocuments((previous) =>
                          previous.filter(
                            (item) => item.id !== document.id,
                          ),
                        )
                      }
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-400 transition hover:bg-cream-100 hover:text-rose-600"
                      aria-label={`${copy.documents.remove}: ${document.name}`}
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={FileText}
                title={copy.documents.emptyTitle}
                copy={copy.documents.emptyCopy}
                className="mt-4"
              />
            )}
          </Card>
        </div>

        <aside className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center gap-2">
              <FileSearch
                className="h-4 w-4 text-ink-400"
                aria-hidden="true"
              />
              <h2 className="text-sm font-semibold text-brand-950">
                {copy.documents.stepsTitle}
              </h2>
            </div>
            <ol className="mt-3 space-y-3">
              {copy.documents.steps.map((step, index) => (
                <li key={step.title} className="flex gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-cream-100 text-[11px] font-semibold text-brand-800">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-brand-950">
                      {step.title}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-ink-500">
                      {step.copy}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          <Card surface="teal" className="border-teal-200 p-5">
            <div className="flex gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-teal-700 ring-1 ring-inset ring-teal-200">
                <LockKeyhole className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-teal-900">
                  {copy.documents.privacyTitle}
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-teal-900/80">
                  {copy.documents.privacyCopy}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-ink-400" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-brand-950">
                {copy.documents.formatsTitle}
              </h2>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-ink-500">
              {copy.documents.formatsCopy}
            </p>
            <p className="mt-3 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-teal-700">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              {copy.documents.accepted}
            </p>
          </Card>
        </aside>
      </div>
    </div>
  )
}
