import { describe, expect, it } from 'vitest'

import { normalizeApiBaseUrl } from '@/services/apiConfig'

describe('normalizeApiBaseUrl', () => {
  it('accepts an absolute HTTPS API origin', () => {
    expect(normalizeApiBaseUrl('https://api.example.com/')).toBe(
      'https://api.example.com',
    )
  })

  it('accepts a same-origin relative base', () => {
    expect(normalizeApiBaseUrl('/api-proxy/')).toBe('/api-proxy')
  })

  it('returns an empty string for missing or invalid values', () => {
    expect(normalizeApiBaseUrl(undefined)).toBe('')
    expect(normalizeApiBaseUrl('   ')).toBe('')
    expect(normalizeApiBaseUrl('ftp://api.example.com')).toBe('')
    expect(normalizeApiBaseUrl('not a url')).toBe('')
  })
})
