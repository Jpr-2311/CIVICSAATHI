/** Normalize the browser-side API base URL without a localhost fallback. */
export function normalizeApiBaseUrl(value) {
  if (typeof value !== 'string') return ''

  const trimmed = value.trim()
  if (!trimmed) return ''

  // Relative bases are useful behind a same-origin reverse proxy.
  if (trimmed.startsWith('/')) {
    return trimmed.replace(/\/+$/, '') || '/'
  }

  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return ''
    return trimmed.replace(/\/+$/, '')
  } catch {
    return ''
  }
}
