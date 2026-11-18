import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  CircleCheck,
  FileSearch,
  FileText,
  Info,
  Languages,
  LoaderCircle,
  MessagesSquare,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from 'lucide-react'

import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Notice from '@/components/ui/Notice'
import ModuleHeader from '@/components/workspace/ModuleHeader'
import { ShieldMark } from '@/components/brand/Logo'
import { LANGUAGES, useLanguage, useMessages } from '@/i18n'
import { askAssistant, listDocuments, toApiError } from '@/services/api'

const TRUST_ICONS = [ShieldCheck, Languages, CircleCheck]

export default function AssistantPage() {
  const { language, setLanguage, t } = useLanguage()
  const copy = useMessages()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedDocumentId = searchParams.get('document') || ''

  const [draft, setDraft] = useState('')
  const [allDocuments, setAllDocuments] = useState([])
  const [documentStatus, setDocumentStatus] = useState('loading')
  const [staleNotice, setStaleNotice] = useState(null)
  const [result, setResult] = useState(null)
  const [lastQuestion, setLastQuestion] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const previousLanguageRef = useRef(language)
  const languageRef = useRef(language)
  const busyRef = useRef(false)
  const languageRetryRef = useRef(false)
  languageRef.current = language

  const indexedDocuments = allDocuments.filter(
    (document) => document.status === 'indexed',
  )

  const clearDocumentParam = useCallback(() => {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        next.delete('document')
        return next
      },
      { replace: true },
    )
  }, [setSearchParams])

  const loadDocuments = useCallback(async () => {
    setDocumentStatus('loading')
    try {
      const data = await listDocuments()
      const documents = data?.documents ?? []
      setAllDocuments(documents)
      setDocumentStatus('ready')
      return documents
    } catch {
      setAllDocuments([])
      setDocumentStatus('error')
      return []
    }
  }, [])

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  useEffect(() => {
    const refreshOnReturn = () => {
      if (document.visibilityState === 'visible') loadDocuments()
    }
    document.addEventListener('visibilitychange', refreshOnReturn)
    return () => document.removeEventListener('visibilitychange', refreshOnReturn)
  }, [loadDocuments])

  useEffect(() => {
    if (!selectedDocumentId) {
      setStaleNotice(null)
      return
    }
    if (documentStatus !== 'ready') return

    const target = allDocuments.find(
      (document) => document.document_id === selectedDocumentId,
    )
    if (!target) {
      setStaleNotice('missing')
      clearDocumentParam()
      return
    }
    if (target.status !== 'indexed') {
      setStaleNotice('not_indexed')
      clearDocumentParam()
      return
    }
    setStaleNotice(null)
  }, [allDocuments, clearDocumentParam, documentStatus, selectedDocumentId])

  const submit = async (questionText) => {
    const question = questionText.trim()
    if (!question || busyRef.current) return

    busyRef.current = true
    setLastQuestion(question)
    setBusy(true)
    setError(null)
    setResult(null)

    try {
      const data = await askAssistant({
        question,
        language: languageRef.current,
        document_id: selectedDocumentId || null,
      })
      setResult(data)
    } catch (caught) {
      const apiError = toApiError(caught)
      if (apiError.code === 'document_not_found' && selectedDocumentId) {
        setStaleNotice('missing')
        clearDocumentParam()
        loadDocuments()
      } else {
        setError(apiError)
      }
    } finally {
      busyRef.current = false
      setBusy(false)
      if (languageRetryRef.current && question) {
        languageRetryRef.current = false
        submit(question)
      }
    }
  }

  useEffect(() => {
    if (language === previousLanguageRef.current) return
    previousLanguageRef.current = language
    setResult(null)
    setError(null)
    if (!lastQuestion) return
    if (busyRef.current) {
      languageRetryRef.current = true
      return
    }
    submit(lastQuestion)
    // Re-ask the last question in the newly selected language only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language])

  const handleSubmit = (event) => {
    event.preventDefault()
    const question = draft
    setDraft('')
    submit(question)
  }

  const reset = () => {
    setResult(null)
    setError(null)
    setLastQuestion('')
    setDraft('')
  }

  const selectDocument = (documentId) => {
    setStaleNotice(null)
    if (!documentId) {
      clearDocumentParam()
      return
    }
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        next.set('document', documentId)
        return next
      },
      { replace: true },
    )
  }

  const visibleResult = result

  return (
    <div>
      <ModuleHeader
        icon={MessagesSquare}
        eyebrow={copy.assistant.eyebrow}
        title={copy.assistant.title}
        description={copy.assistant.description}
        badge={t('common.live')}
      />

      <Notice
        tone="info"
        title={copy.assistant.noticeTitle}
        className="mt-6"
      >
        {copy.assistant.noticeCopy}
      </Notice>

      {documentStatus === 'error' ? (
        <Notice
          tone="warning"
          title={copy.assistant.documentsErrorTitle}
          className="mt-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{copy.assistant.documentsErrorCopy}</span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={loadDocuments}
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              {copy.assistant.documentsRetry}
            </Button>
          </div>
        </Notice>
      ) : null}

      {staleNotice ? (
        <Notice
          tone="warning"
          title={
            staleNotice === 'missing'
              ? copy.assistant.staleTitle
              : copy.assistant.notIndexedTitle
          }
          className="mt-3"
        >
          {staleNotice === 'missing'
            ? copy.assistant.staleCopy
            : copy.assistant.notIndexedCopy}
        </Notice>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_19rem]">
        <Card className="flex min-h-[34rem] flex-col overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-200/70 px-4 py-3.5 sm:px-5">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-950 text-cream-50">
                <ShieldMark className="h-[20px] w-[20px]" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-brand-950">
                  {copy.assistant.chatTitle}
                </p>
                <p className="truncate text-[10px] text-ink-400">
                  {copy.assistant.chatSubtitle}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="success">{t('common.live')}</Badge>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={reset}
                disabled={busy}
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                {copy.assistant.reset}
              </Button>
            </div>
          </div>

          <div className="grid gap-3 border-b border-ink-200/70 bg-white px-4 py-3 sm:grid-cols-2 sm:px-5">
            <div>
              <label
                htmlFor="assistant-language"
                className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-500"
              >
                {copy.assistant.languageLabel}
              </label>
              <select
                id="assistant-language"
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                className="mt-1 h-9 w-full rounded-lg border border-ink-200 bg-cream-50 px-2.5 text-xs text-ink-800"
              >
                {LANGUAGES.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.nativeLabel}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="assistant-document"
                className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-500"
              >
                {copy.assistant.documentLabel}
              </label>
              <select
                id="assistant-document"
                value={selectedDocumentId}
                onChange={(event) => selectDocument(event.target.value)}
                className="mt-1 h-9 w-full rounded-lg border border-ink-200 bg-cream-50 px-2.5 text-xs text-ink-800"
              >
                <option value="">{copy.assistant.documentAll}</option>
                {indexedDocuments.map((document) => (
                  <option
                    key={document.document_id}
                    value={document.document_id}
                  >
                    {document.original_filename}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div
            className="min-h-0 flex-1 space-y-4 bg-cream-50/60 px-4 py-5 sm:px-5"
            aria-live="polite"
            aria-busy={busy}
          >
            {busy && (
              <div className="flex items-start gap-3 rounded-2xl border border-brand-200 bg-white p-4">
                <LoaderCircle
                  className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-brand-700"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-semibold text-brand-950">
                    {copy.assistant.loadingTitle}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-500">
                    {copy.assistant.loadingCopy}
                  </p>
                </div>
              </div>
            )}

            {!busy && error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4">
                <div className="flex items-center gap-2">
                  <TriangleAlert
                    className="h-4 w-4 text-rose-700"
                    aria-hidden="true"
                  />
                  <p className="text-sm font-semibold text-rose-900">
                    {copy.assistant.errorTitle}
                  </p>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-600">
                  {copy.assistant.errorCopy}
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                  onClick={() => submit(lastQuestion)}
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  {copy.assistant.retry}
                </Button>
              </div>
            )}

            {!busy && !error && visibleResult?.insufficient_evidence && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                <div className="flex items-center gap-2">
                  <Info
                    className="h-4 w-4 text-amber-700"
                    aria-hidden="true"
                  />
                  <p className="text-sm font-semibold text-amber-950">
                    {copy.assistant.insufficientTitle}
                  </p>
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-700">
                  {visibleResult.answer}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-ink-500">
                  {copy.assistant.insufficientCopy}
                </p>
              </div>
            )}

            {!busy &&
              !error &&
              visibleResult &&
              !visibleResult.insufficient_evidence && (
              <div className="flex gap-2.5">
                <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-950 text-cream-50">
                  <ShieldMark className="h-4 w-4" />
                </span>
                <div className="min-w-0 max-w-[92%] flex-1 rounded-2xl rounded-tl-md border border-ink-200 bg-white p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="success">{copy.assistant.answerTitle}</Badge>
                    {visibleResult.citations.length > 0 && (
                      <Badge tone="teal">
                        {t('assistant.sourceBadge', {
                          count: visibleResult.citations.length,
                        })}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-3 whitespace-pre-line text-[13px] leading-relaxed text-ink-700">
                    {visibleResult.answer}
                  </p>

                  {visibleResult.citations.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {visibleResult.citations.map((citation) => (
                        <details
                          key={citation.evidence_id}
                          className="group rounded-xl border border-teal-200 bg-teal-50/40"
                        >
                          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5">
                            <span className="flex min-w-0 items-center gap-2">
                              <FileText
                                className="h-3.5 w-3.5 shrink-0 text-teal-700"
                                aria-hidden="true"
                              />
                              <span className="truncate text-xs font-medium text-brand-950">
                                {citation.document_title}
                              </span>
                            </span>
                            <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-teal-700 ring-1 ring-inset ring-teal-200">
                              {t('assistant.pageLabel', {
                                page: citation.page,
                              })}
                            </span>
                          </summary>
                          <div className="border-t border-teal-200/70 px-3 py-2.5">
                            <p className="whitespace-pre-wrap break-words border-l-2 border-teal-300 pl-2.5 text-[11.5px] italic leading-relaxed text-ink-600">
                              {citation.excerpt}
                            </p>
                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-teal-200/70 pt-2.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-teal-700">
                                  {copy.assistant.sourceLabel}
                                </p>
                                {citation.evidence_id ? (
                                  <span className="text-[10px] text-ink-400">
                                    {t('assistant.citationId', {
                                      id: citation.evidence_id,
                                    })}
                                  </span>
                                ) : null}
                              </div>
                              {citation.document_id ? (
                                <Button
                                  as={Link}
                                  to={`/app/documents?document=${encodeURIComponent(
                                    citation.document_id,
                                  )}&page=${encodeURIComponent(citation.page)}`}
                                  state={{ citation }}
                                  variant="secondary"
                                  size="sm"
                                  className="h-7 px-2.5 text-[11px]"
                                >
                                  <FileSearch
                                    className="h-3 w-3"
                                    aria-hidden="true"
                                  />
                                  {copy.assistant.inspectSource}
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        </details>
                      ))}
                    </div>
                  )}

                  {visibleResult.message && (
                    <p className="mt-3 flex items-center gap-1.5 text-[10px] text-ink-400">
                      <ShieldCheck
                        className="h-3 w-3 shrink-0"
                        aria-hidden="true"
                      />
                      {visibleResult.message}
                    </p>
                  )}
                </div>
              </div>
            )}

            {!busy && !error && !visibleResult && (
              <div className="flex min-h-[16rem] flex-col items-center justify-center px-4 text-center">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-cream-100 text-brand-700">
                  <Search className="h-5 w-5" aria-hidden="true" />
                </span>
                <p className="mt-3 text-sm font-semibold text-brand-950">
                  {copy.assistant.emptyTitle}
                </p>
                <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-ink-500">
                  {copy.assistant.emptyCopy}
                </p>
              </div>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="border-t border-ink-200/70 bg-white p-3 sm:p-4"
          >
            <label htmlFor="assistant-question" className="sr-only">
              {copy.assistant.questionLabel}
            </label>
            <div className="flex items-center gap-2">
              <input
                id="assistant-question"
                type="text"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={copy.assistant.questionPlaceholder}
                disabled={busy}
                maxLength={1000}
                className="h-11 min-w-0 flex-1 rounded-xl border border-ink-200 bg-cream-50 px-3.5 text-sm text-ink-800 placeholder:text-ink-400 focus:border-brand-400 focus:bg-white disabled:opacity-60"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!draft.trim() || busy}
                aria-label={copy.assistant.send}
              >
                <Send className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-[10px] text-ink-400">
              <Info className="h-3 w-3 shrink-0" aria-hidden="true" />
              {copy.assistant.composerHint}
            </p>
          </form>
        </Card>

        <aside className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Sparkles
                className="h-4 w-4 text-coral-600"
                aria-hidden="true"
              />
              <h2 className="text-sm font-semibold text-brand-950">
                {copy.assistant.suggestionsTitle}
              </h2>
            </div>
            <div className="mt-3 space-y-2">
              {copy.assistant.suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setDraft(suggestion)
                    submit(suggestion)
                  }}
                  className="w-full rounded-xl border border-ink-200 bg-cream-50 px-3 py-2.5 text-left text-xs leading-relaxed text-ink-600 transition hover:border-ink-300 hover:bg-white hover:text-brand-950 disabled:opacity-60"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-brand-950">
              {copy.assistant.trustTitle}
            </h2>
            <ul className="mt-3 space-y-4">
              {copy.assistant.trust.map((item, index) => {
                const Icon = TRUST_ICONS[index] ?? ShieldCheck
                return (
                  <li key={item.title} className="flex gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-cream-100 text-brand-700">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-brand-950">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-ink-500">
                        {item.copy}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
            <p className="mt-4 border-t border-ink-200/70 pt-3 text-[10px] leading-relaxed text-ink-400">
              {copy.assistant.disclaimer}
            </p>
          </Card>
        </aside>
      </div>
    </div>
  )
}
