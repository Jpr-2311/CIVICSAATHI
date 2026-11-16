export const LANGUAGES = [
  {
    code: 'en',
    label: 'English',
    nativeLabel: 'English',
    shortLabel: 'EN',
    fontClass: '',
    locale: 'en-IN',
  },
  {
    code: 'ml',
    label: 'Malayalam',
    nativeLabel: 'മലയാളം',
    shortLabel: 'ML',
    fontClass: 'font-malayalam',
    locale: 'ml-IN',
  },
  {
    code: 'hi',
    label: 'Hindi',
    nativeLabel: 'हिन्दी',
    shortLabel: 'HI',
    fontClass: 'font-hindi',
    locale: 'hi-IN',
  },
]

export const DEFAULT_LANGUAGE = 'en'
export const LANGUAGE_STORAGE_KEY = 'civicsaathi.language'

export function isSupportedLanguage(code) {
  return LANGUAGES.some((language) => language.code === code)
}

export function getLanguage(code) {
  return LANGUAGES.find((language) => language.code === code) ?? LANGUAGES[0]
}

export function detectInitialLanguage() {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE

  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (isSupportedLanguage(stored)) return stored
  } catch {
    // Local storage may be unavailable in private or restricted contexts.
  }

  const browserLanguage = window.navigator.language?.slice(0, 2)
  return isSupportedLanguage(browserLanguage) ? browserLanguage : DEFAULT_LANGUAGE
}
