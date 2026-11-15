import { useState } from 'react'
import {
  FileText,
  Info,
  Scale,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

import { ShieldMark } from '@/components/brand/Logo'
import { cn } from '@/lib/cn'

function Cite({ children }) {
  return (
    <span className="ml-0.5 align-super text-[9px] font-semibold text-brand-700">
      [{children}]
    </span>
  )
}

const CONTENT = {
  en: {
    label: 'EN',
    question:
      'What documents do I need to apply for this farmer welfare scheme?',
    answer: (
      <>
        The notification lists three documents: an Aadhaar card, a ration card,
        and a recent income certificate from the Village Office.
        <Cite>1</Cite> Applications are submitted at the nearest Akshaya Centre.
        <Cite>2</Cite>
      </>
    ),
    excerpt:
      '“Applicants shall submit proof of identity, proof of residence and an annual income certificate issued by the Village Office...”',
    disclaimer: 'Illustrative preview — not an official answer.',
  },
  ml: {
    label: 'മലയാളം',
    question: 'ഈ കർഷക ക്ഷേമ പദ്ധതിക്ക് എന്തെല്ലാം രേഖകൾ വേണം?',
    answer: (
      <>
        അറിയിപ്പിൽ മൂന്ന് രേഖകൾ ആവശ്യപ്പെടുന്നു: ആധാർ കാർഡ്, റേഷൻ കാർഡ്,
        വില്ലേജ് ഓഫീസ് നൽകിയ സമീപകാല വരുമാന സർട്ടിഫിക്കറ്റ്.
        <Cite>1</Cite> അപേക്ഷ അടുത്തുള്ള അക്ഷയ കേന്ദ്രത്തിൽ സമർപ്പിക്കണം.
        <Cite>2</Cite>
      </>
    ),
    excerpt:
      '“അപേക്ഷകൻ ഐഡന്റിറ്റി, താമസം, വാർഷിക വരുമാനം എന്നിവയുടെ തെളിവ് സമർപ്പിക്കണം...”',
    disclaimer: 'ഉദാഹരണ പ്രിവ്യൂ — ഔദ്യോഗിക ഉത്തരമല്ല.',
  },
}

/**
 * An illustrative product preview, not a live AI call. The label makes
 * that explicit so it can never be mistaken for an official answer.
 */
export default function AnswerPreview() {
  const [language, setLanguage] = useState('en')
  const copy = CONTENT[language]

  return (
    <div className="relative mx-auto max-w-[30rem] lg:max-w-none">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white shadow-[0_40px_100px_-30px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between gap-3 border-b border-ink-100 bg-ink-50/80 px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white">
              <ShieldMark className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-ink-900">
                CivicSaathi Assistant
              </p>
              <p className="truncate text-[10px] text-ink-400">
                Grounded in your documents
              </p>
            </div>
          </div>

          <div
            className="flex shrink-0 items-center rounded-full bg-ink-100 p-0.5"
            role="group"
            aria-label="Preview language"
          >
            <button
              type="button"
              onClick={() => setLanguage('en')}
              aria-pressed={language === 'en'}
              className={cn(
                'rounded-full px-2.5 py-1 text-[10px] font-semibold transition',
                language === 'en'
                  ? 'bg-white text-ink-900 shadow-sm'
                  : 'text-ink-500 hover:text-ink-800',
              )}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage('ml')}
              aria-pressed={language === 'ml'}
              className={cn(
                'rounded-full px-2.5 py-1 font-malayalam text-[10px] font-semibold transition',
                language === 'ml'
                  ? 'bg-white text-ink-900 shadow-sm'
                  : 'text-ink-500 hover:text-ink-800',
              )}
            >
              മലയാളം
            </button>
          </div>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          <div className="ml-auto max-w-[88%] rounded-2xl rounded-br-md bg-ink-100 px-4 py-3">
            <p
              className={cn(
                'text-[13px] leading-relaxed text-ink-700',
                language === 'ml' && 'font-malayalam',
              )}
            >
              {copy.question}
            </p>
          </div>

          <div className="rounded-2xl rounded-tl-md border border-brand-100 bg-brand-50/50 p-4">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-700">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Answer
            </div>
            <p
              key={language}
              className={cn(
                'fade-swap mt-2 text-[13px] leading-relaxed text-ink-700',
                language === 'ml' && 'font-malayalam',
              )}
            >
              {copy.answer}
            </p>

            <div className="mt-3.5 rounded-xl border border-brand-200/70 bg-white p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-1.5 text-[10px] font-medium tracking-wide text-ink-400">
                  <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">demo_notification.pdf</span>
                </span>
                <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-[9px] font-semibold text-brand-700 ring-1 ring-inset ring-brand-200">
                  page 3
                </span>
              </div>
              <p className="mt-2 border-l-2 border-brand-300 pl-2.5 text-[11.5px] italic leading-relaxed text-ink-500">
                {copy.excerpt}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-ink-100 pt-3">
            <p className="flex items-center gap-1.5 text-[10px] text-ink-400">
              <Info className="h-3 w-3 shrink-0" aria-hidden="true" />
              {copy.disclaimer}
            </p>
            <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-medium text-brand-700">
              <ShieldCheck className="h-3 w-3" aria-hidden="true" />
              Evidence attached
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 px-1 text-[11px] text-ink-400">
        <Scale className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Eligibility is rule-checked, never guessed by the model.
      </div>
    </div>
  )
}
