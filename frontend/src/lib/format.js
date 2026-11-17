/** Small presentation helpers shared by the live scheme and eligibility pages. */

/** Format a date-only ISO string without shifting the calendar day. */
export function formatDate(value, locale = 'en-IN') {
  if (!value) return ''

  const date = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

/** Format a timestamp from the API for the current interface language. */
export function formatDateTime(value, locale = 'en-IN') {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formatNumber(value, locale = 'en-IN') {
  return new Intl.NumberFormat(locale).format(value ?? 0)
}
