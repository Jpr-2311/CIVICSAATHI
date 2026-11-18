import { useCallback, useEffect, useRef, useState } from 'react'
import {
  FileSearch,
  FileText,
  Info,
  LockKeyhole,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
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
import { cn } from '@/lib/cn'
import {
  deleteDocument,
  getDocument,
  listDocuments,
  searchDocuments,
  toApiError,
  uploadDocument,
} from '@/services/api'

const MAX_BYTES = 10 * 1024 * 1024
const STATUS_TONES = {
  indexed: 'success',
  needs_ocr: 'warning',
  empty: 'neutral',
}

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

function formatDate(value, locale) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date)
}

export default function DocumentsPage() {
  const { t, locale } = useLanguage()
  const copy = useMessages().documents
  const inputRef = useRef(null)

  const [documents, setDocuments] = useState([])
  const [loadingList, setLoadingList] = useState(true)
  const [listError, setListError] = useState(null)

  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadNotice, setUploadNotice] = useState(null)
  const [uploadError, setUploadError] = useState(null)
  const [dragging, setDragging] = useState(false)

  const [selected, setSelected] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [actionError, setActionError] = useState(null)

  const [query, setQuery] = useState('')
  const [filterId, setFilterId] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState(null)
  const [searchError, setSearchError] = useState(null)

  const refreshDocuments = useCallback(async () => {
    setLoadingList(true)
    setListError(null)
    try {
      const data = await listDocuments()
      setDocuments(data.documents ?? [])
    } catch (error) {
      setListError(toApiError(error).message)
    } finally {
      setLoadingList(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    listDocuments()
      .then((data) => {
        if (active) setDocuments(data.documents ?? [])
      })
      .catch((error) => {
        if (active) setListError(toApiError(error).message)
      })
      .finally(() => {
        if (active) setLoadingList(false)
      })
    return () => {
      active = false
    }
  }, [])

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList ?? [])
    if (!files.length || uploading) return

    const accepted = []
    let validationError = null
    files.forEach((file) => {
      const isPdf =
        file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
      if (!isPdf) {
        validationError = copy.errorType
      } else if (file.size > MAX_BYTES) {
        validationError = copy.errorSize
      } else {
        accepted.push(file)
      }
    })

    if (!accepted.length) {
      setUploadNotice(null)
      setUploadError(validationError)
      return
    }

    setUploading(true)
    setUploadError(null)
    setUploadNotice(null)
    setProgress(0)

    try {
      for (const file of accepted) {
        const result = await uploadDocument(file, {
          onUploadProgress: (event) => {
            if (event.total) {
              setProgress(Math.round((event.loaded / event.total) * 100))
            }
          },
        })
        setUploadNotice(
          result.duplicate ? copy.duplicate : copy.uploadSuccess,
        )
        if (result.duplicate) {
          setSelected(result.document)
        }
      }
      await refreshDocuments()
      if (inputRef.current) inputRef.current.value = ''
    } catch (error) {
      setUploadError(toApiError(error).message)
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const handleInput = (event) => {
    handleFiles(event.target.files)
    event.target.value = ''
  }

  const openDetails = async (document) => {
    setSelected(document)
    setDetailsLoading(true)
    setActionError(null)
    try {
      setSelected(await getDocument(document.document_id))
    } catch (error) {
      setActionError(toApiError(error).message)
    } finally {
      setDetailsLoading(false)
    }
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    setActionError(null)
    try {
      await deleteDocument(pendingDelete.document_id)
      if (selected?.document_id === pendingDelete.document_id) setSelected(null)
      if (filterId === pendingDelete.document_id) setFilterId('')
      setUploadNotice(copy.deleteSuccess)
      setPendingDelete(null)
      await refreshDocuments()
      setResults(null)
    } catch (error) {
      setActionError(toApiError(error).message)
      setPendingDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  const handleSearch = async (event) => {
    event.preventDefault()
    const term = query.trim()
    if (!term || searching) return
    setSearching(true)
    setSearchError(null)
    setResults(null)
    try {
      setResults(
        await searchDocuments({
          query: term,
          top_k: 5,
          ...(filterId ? { document_id: filterId } : {}),
        }),
      )
    } catch (error) {
      setSearchError(toApiError(error).message)
    } finally {
      setSearching(false)
    }
  }

  return (
    <div>
      <ModuleHeader
        icon={FileText}
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        badge={t('common.live')}
      />

      <Notice tone="info" title={copy.noticeTitle} className="mt-6">
        {copy.noticeCopy}
      </Notice>

      {uploadNotice ? (
        <Notice tone="success" className="mt-3">
          {uploadNotice}
        </Notice>
      ) : null}
      {uploadError ? (
        <Notice tone="danger" className="mt-3">
          {uploadError}
        </Notice>
      ) : null}
      {actionError ? (
        <Notice tone="danger" className="mt-3">
          {actionError}
        </Notice>
      ) : null}

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
              onDrop={(event) => {
                event.preventDefault()
                setDragging(false)
                handleFiles(event.dataTransfer.files)
              }}
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
                onChange={handleInput}
                className="sr-only"
                tabIndex={-1}
              />
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-brand-800 ring-1 ring-inset ring-ink-200">
                <Upload className="h-6 w-6" aria-hidden="true" />
              </span>
              <h2 className="mt-4 font-display text-2xl text-brand-950">
                {dragging ? copy.dropActive : copy.dropTitle}
              </h2>
              <p className="mt-1.5 text-sm text-ink-500">{copy.dropCopy}</p>
              <Button
                type="button"
                variant="secondary"
                className="mt-5"
                onClick={() => inputRef.current?.click()}
                loading={uploading}
              >
                <FileText className="h-4 w-4" aria-hidden="true" />
                {copy.browse}
              </Button>
              <p className="mt-3 text-[11px] text-ink-400">{copy.accepted}</p>

              {uploading ? (
                <div className="mx-auto mt-4 max-w-sm">
                  <div className="flex items-center justify-between text-[11px] font-medium text-brand-800">
                    <span>{copy.uploading}</span>
                    <span>{progress}%</span>
                  </div>
                  <div
                    className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink-100"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={progress}
                  >
                    <div
                      className="h-full rounded-full bg-teal-500 transition-[width] duration-200"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-brand-950">
                  {copy.libraryTitle}
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-ink-500">
                  {copy.libraryCopy}
                </p>
              </div>
              {documents.length ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => inputRef.current?.click()}
                  disabled={uploading}
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  {copy.addMore}
                </Button>
              ) : null}
            </div>

            {pendingDelete ? (
              <Notice tone="danger" className="mt-4">
                <p className="text-xs leading-relaxed">{copy.deleteConfirm}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="accent"
                    size="sm"
                    loading={deleting}
                    onClick={confirmDelete}
                  >
                    {copy.deleteTitle}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={deleting}
                    onClick={() => setPendingDelete(null)}
                  >
                    {t('common.close')}
                  </Button>
                </div>
              </Notice>
            ) : null}

            {loadingList ? (
              <div className="mt-4 space-y-2">
                {[0, 1].map((item) => (
                  <div
                    key={item}
                    className="rounded-xl border border-ink-200 px-4 py-3"
                  >
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="mt-2 h-3 w-1/3" />
                  </div>
                ))}
              </div>
            ) : listError ? (
              <Notice tone="danger" className="mt-4" title={copy.loadError}>
                <div className="flex flex-wrap items-center gap-3">
                  <span>{listError}</span>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={refreshDocuments}
                  >
                    {copy.retry}
                  </Button>
                </div>
              </Notice>
            ) : documents.length ? (
              <ul className="mt-4 divide-y divide-ink-100 rounded-xl border border-ink-200">
                {documents.map((document) => (
                  <li
                    key={document.document_id}
                    className="flex flex-wrap items-center gap-3 px-4 py-3"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-cream-100 text-coral-700">
                      <FileText className="h-[18px] w-[18px]" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-medium text-brand-950">
                        {document.original_filename}
                      </p>
                      <p className="mt-0.5 text-[11px] text-ink-400">
                        {formatSize(document.size_bytes, locale)} ·{' '}
                        {document.page_count} {copy.pagesLabel} ·{' '}
                        {document.chunk_count} {copy.passagesLabel} ·{' '}
                        {formatDate(document.uploaded_at, locale)}
                      </p>
                    </div>
                    <Badge tone={STATUS_TONES[document.status] ?? 'neutral'}>
                      {copy.status[document.status] ?? document.status}
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => openDetails(document)}
                    >
                      <FileSearch className="h-3.5 w-3.5" aria-hidden="true" />
                      {copy.detailsTitle}
                    </Button>
                    <button
                      type="button"
                      onClick={() => setPendingDelete(document)}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-400 transition hover:bg-cream-100 hover:text-rose-600"
                      aria-label={`${copy.deleteTitle}: ${document.original_filename}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={FileText}
                title={copy.emptyTitle}
                copy={copy.emptyCopy}
                className="mt-4"
              />
            )}
          </Card>

          {selected ? (
            <Card className="p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-brand-950">
                    {copy.detailsTitle}
                  </h2>
                  <p className="mt-1 text-xs text-ink-500">{copy.detailsCopy}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 transition hover:bg-cream-100 hover:text-brand-950"
                  aria-label={copy.closeDetails}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              {detailsLoading ? (
                <div className="mt-4 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : (
                <dl className="mt-4 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
                  <div>
                    <dt className="font-semibold text-ink-500">
                      {copy.uploadedLabel}
                    </dt>
                    <dd className="mt-0.5 break-words text-brand-950">
                      {formatDate(selected.uploaded_at, locale)}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-ink-500">
                      {copy.pagesLabel}
                    </dt>
                    <dd className="mt-0.5 text-brand-950">
                      {selected.page_count} · {selected.chunk_count}{' '}
                      {copy.passagesLabel}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="font-semibold text-ink-500">
                      {copy.checksum}
                    </dt>
                    <dd className="mt-0.5 break-all font-mono text-[11px] text-brand-950">
                      {selected.checksum}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="font-semibold text-ink-500">
                      {copy.metadataTitle}
                    </dt>
                    <dd className="mt-0.5 text-brand-950">
                      {selected.metadata && Object.keys(selected.metadata).length
                        ? Object.entries(selected.metadata).map(([key, value]) => (
                            <span key={key} className="mr-3">
                              {key}: {value}
                            </span>
                          ))
                        : copy.noMetadata}
                    </dd>
                  </div>
                </dl>
              )}
            </Card>
          ) : null}

          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-ink-400" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-brand-950">
                {copy.searchTitle}
              </h2>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-ink-500">
              {copy.searchCopy}
            </p>

            <form
              className="mt-4 flex flex-col gap-2 sm:flex-row"
              onSubmit={handleSearch}
            >
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={copy.searchPlaceholder}
                aria-label={copy.searchTitle}
                className="h-11 min-w-0 flex-1 rounded-xl border border-ink-200 bg-cream-50 px-3.5 text-sm text-ink-800 placeholder:text-ink-400 focus:border-brand-400 focus:bg-white"
              />
              <select
                value={filterId}
                onChange={(event) => setFilterId(event.target.value)}
                aria-label={copy.filterAll}
                className="h-11 rounded-xl border border-ink-200 bg-cream-50 px-3 text-sm text-ink-800 focus:border-brand-400 focus:bg-white"
              >
                <option value="">{copy.filterAll}</option>
                {documents.map((document) => (
                  <option key={document.document_id} value={document.document_id}>
                    {document.original_filename}
                  </option>
                ))}
              </select>
              <Button type="submit" loading={searching} disabled={!query.trim()}>
                <Search className="h-4 w-4" aria-hidden="true" />
                {copy.searchButton}
              </Button>
            </form>

            {searchError ? (
              <Notice tone="danger" className="mt-4">
                {searchError}
              </Notice>
            ) : null}

            {results ? (
              <div className="mt-5">
                {results.has_evidence ? (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-xs font-semibold text-brand-950">
                        {copy.resultsTitle}
                      </h3>
                      <Badge tone="brand">
                        {results.count} {copy.resultsCount}
                      </Badge>
                    </div>
                    <Notice
                      tone="info"
                      className="mt-3"
                      title={copy.resultNoticeTitle}
                    >
                      {results.similarity_notice || copy.resultNoticeCopy}
                    </Notice>
                    <ul className="mt-3 space-y-3">
                      {results.results.map((result) => (
                        <li
                          key={`${result.document_id}-${result.chunk_index}`}
                          className="rounded-xl border border-ink-200 bg-cream-50/70 p-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="break-words text-xs font-semibold text-brand-950">
                              {result.original_filename}
                            </p>
                            <Badge tone="teal">
                              {copy.pageLabel} {result.page_number}
                            </Badge>
                          </div>
                          <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-ink-700">
                            {result.text}
                          </p>
                          <p className="mt-3 text-[11px] text-ink-400">
                            {copy.similarity}:{' '}
                            {Math.round(result.similarity * 100)}%
                          </p>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <EmptyState
                    icon={FileSearch}
                    title={copy.noResultsTitle}
                    copy={copy.noResultsCopy}
                  />
                )}
              </div>
            ) : null}
          </Card>
        </div>

        <aside className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center gap-2">
              <FileSearch className="h-4 w-4 text-ink-400" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-brand-950">
                {copy.stepsTitle}
              </h2>
            </div>
            <ol className="mt-3 space-y-3">
              {copy.steps.map((step, index) => (
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
                  {copy.privacyTitle}
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-teal-900/80">
                  {copy.privacyCopy}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-ink-400" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-brand-950">
                {copy.formatsTitle}
              </h2>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-ink-500">
              {copy.formatsCopy}
            </p>
            <p className="mt-3 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-teal-700">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              {copy.accepted}
            </p>
          </Card>
        </aside>
      </div>
    </div>
  )
}
