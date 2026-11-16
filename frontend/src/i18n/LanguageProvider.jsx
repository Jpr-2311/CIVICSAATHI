import { useCallback, useEffect, useMemo, useState } from 'react'

import { LanguageContext } from '@/i18n/context'
import {
  detectInitialLanguage,
  getLanguage,
  isSupportedLanguage,
  LANGUAGE_STORAGE_KEY,
} from '@/i18n/languages'
import { messages } from '@/i18n/messages'

function resolveMessage(catalog, path) {
  return path.split('.').reduce((value, key) => {
    if (value && typeof value === 'object' && key in value) return value[key]
    return undefined
  }, catalog)
}

function interpolate(message, variables) {
  if (!variables) return message

  return message.replace(/\{(\w+)\}/g, (match, key) =>
    key in variables ? String(variables[key]) : match,
  )
}

export default function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(detectInitialLanguage)
  const catalog = messages[language] ?? messages.en
  const languageMeta = getLanguage(language)

  const setLanguage = useCallback((code) => {
    if (!isSupportedLanguage(code)) return
    setLanguageState(code)

    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, code)
    } catch {
      // The interface still switches; only the stored preference is lost.
    }
  }, [])

  const t = useCallback(
    (path, variables) => {
      const message =
        resolveMessage(catalog, path) ?? resolveMessage(messages.en, path)

      if (typeof message !== 'string') return path

      return interpolate(message, variables)
    },
    [catalog],
  )

  useEffect(() => {
    document.documentElement.lang = language
    document.title = t('meta.title')

    const description = document.querySelector('meta[name="description"]')
    if (description) description.setAttribute('content', t('meta.description'))
  }, [language, t])

  const value = useMemo(
    () => ({
      language,
      languageMeta,
      locale: languageMeta.locale,
      setLanguage,
      t,
      catalog,
    }),
    [language, languageMeta, setLanguage, t, catalog],
  )

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}
