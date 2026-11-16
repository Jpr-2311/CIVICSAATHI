import { useEffect, useRef, useState } from 'react'
import {
  CircleCheck,
  FileText,
  Info,
  Languages,
  MessagesSquare,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Notice from '@/components/ui/Notice'
import ModuleHeader from '@/components/workspace/ModuleHeader'
import { ShieldMark } from '@/components/brand/Logo'
import { useLanguage, useMessages } from '@/i18n'

const INITIAL_THREAD = [
  { id: 'example-question', role: 'user', kind: 'example' },
  { id: 'example-answer', role: 'assistant', kind: 'example' },
]

const TRUST_ICONS = [ShieldCheck, Languages, CircleCheck]

export default function AssistantPage() {
  const { t } = useLanguage()
  const copy = useMessages()
  const [thread, setThread] = useState(INITIAL_THREAD)
  const [draft, setDraft] = useState('')
  const inputRef = useRef(null)
  const scrollRef = useRef(null)
  const threadLengthRef = useRef(INITIAL_THREAD.length)

  useEffect(() => {
    if (thread.length === threadLengthRef.current) return
    threadLengthRef.current = thread.length

    const node = scrollRef.current
    if (!node) return

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    node.scrollTo({
      top: thread.length <= INITIAL_THREAD.length ? 0 : node.scrollHeight,
      behavior: reduceMotion ? 'auto' : 'smooth',
    })
  }, [thread])

  const handleSubmit = (event) => {
    event.preventDefault()
    const question = draft.trim()
    if (!question) return

    setThread((previous) => [
      ...previous,
      {
        id: `question-${Date.now()}`,
        role: 'user',
        kind: 'text',
        text: question,
      },
      {
        id: `reply-${Date.now()}`,
        role: 'assistant',
        kind: 'preview',
      },
    ])
    setDraft('')
  }

  const applySuggestion = (suggestion) => {
    setDraft(suggestion)
    inputRef.current?.focus()
  }

  return (
    <div>
      <ModuleHeader
        icon={MessagesSquare}
        eyebrow={copy.assistant.eyebrow}
        title={copy.assistant.title}
        description={copy.assistant.description}
        badge={t('common.preview')}
      />

      <Notice
        tone="preview"
        title={copy.assistant.noticeTitle}
        className="mt-6"
      >
        {copy.assistant.noticeCopy}
      </Notice>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_19rem]">
        <Card className="flex h-[30rem] flex-col overflow-hidden sm:h-[34rem] lg:h-[36rem]">
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
              <Badge tone="coral">{copy.assistant.previewBadge}</Badge>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setThread(INITIAL_THREAD)}
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                {copy.assistant.reset}
              </Button>
            </div>
          </div>

          <div
            ref={scrollRef}
            className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain bg-cream-50/60 px-4 py-5 sm:px-5"
            aria-live="polite"
          >
            {thread.map((message) => {
              if (message.role === 'user') {
                return (
                  <div key={message.id} className="flex justify-end">
                    <div className="max-w-[88%] rounded-2xl rounded-br-md bg-brand-950 px-4 py-3 text-[13px] leading-relaxed text-cream-50">
                      {message.kind === 'example'
                        ? copy.assistant.question
                        : message.text}
                    </div>
                  </div>
                )
              }

              if (message.kind === 'example') {
                return (
                  <div key={message.id} className="flex gap-2.5">
                    <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-950 text-cream-50">
                      <ShieldMark className="h-4 w-4" />
                    </span>
                    <div className="max-w-[92%] rounded-2xl rounded-tl-md border border-ink-200 bg-white p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="coral">
                          {copy.assistant.exampleBadge}
                        </Badge>
                      </div>
                      <p className="mt-2.5 text-[13px] leading-relaxed text-ink-700">
                        {copy.assistant.answer}
                      </p>

                      <div className="mt-3.5 rounded-xl border border-teal-200 bg-teal-50/50 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex min-w-0 items-center gap-1.5 text-[10px] font-medium text-ink-500">
                            <FileText
                              className="h-3.5 w-3.5 shrink-0"
                              aria-hidden="true"
                            />
                            <span className="truncate">
                              {copy.assistant.file}
                            </span>
                          </span>
                          <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[9px] font-semibold text-teal-700 ring-1 ring-inset ring-teal-200">
                            {copy.assistant.page}
                          </span>
                        </div>
                        <p className="mt-2 border-l-2 border-teal-300 pl-2.5 text-[11.5px] italic leading-relaxed text-ink-500">
                          {copy.assistant.excerpt}
                        </p>
                        <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.12em] text-teal-700">
                          {copy.assistant.sourceLabel}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              }

              return (
                <div key={message.id} className="flex gap-2.5">
                  <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-950 text-cream-50">
                    <ShieldMark className="h-4 w-4" />
                  </span>
                  <div className="max-w-[92%] rounded-2xl rounded-tl-md border border-coral-200 bg-coral-50/70 p-4">
                    <Badge tone="coral">{copy.assistant.previewBadge}</Badge>
                    <p className="mt-2.5 text-[13px] font-semibold text-coral-900">
                      {copy.assistant.previewReplyTitle}
                    </p>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-ink-600">
                      {copy.assistant.previewReply}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          <form
            onSubmit={handleSubmit}
            className="border-t border-ink-200/70 bg-white p-3 sm:p-4"
          >
            <label htmlFor="assistant-question" className="sr-only">
              {copy.assistant.composerLabel}
            </label>
            <div className="flex items-center gap-2">
              <input
                id="assistant-question"
                ref={inputRef}
                type="text"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={copy.assistant.composerPlaceholder}
                className="h-11 min-w-0 flex-1 rounded-xl border border-ink-200 bg-cream-50 px-3.5 text-sm text-ink-800 placeholder:text-ink-400 focus:border-brand-400 focus:bg-white"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!draft.trim()}
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
                  onClick={() => applySuggestion(suggestion)}
                  className="w-full rounded-xl border border-ink-200 bg-cream-50 px-3 py-2.5 text-left text-xs leading-relaxed text-ink-600 transition hover:border-ink-300 hover:bg-white hover:text-brand-950"
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
          </Card>
        </aside>
      </div>
    </div>
  )
}
