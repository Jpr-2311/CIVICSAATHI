import { describe, expect, it } from 'vitest'

import { messages } from '@/i18n/messages'

function flatten(value, prefix = '', out = []) {
  for (const [key, item] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (Array.isArray(item)) {
      out.push(`${path}#length=${item.length}`)
      item.forEach((entry, index) => {
        if (entry && typeof entry === 'object') {
          flatten(entry, `${path}[${index}]`, out)
        }
      })
    } else if (item && typeof item === 'object') {
      flatten(item, path, out)
    } else {
      out.push(`${path}:${typeof item}`)
    }
  }
  return out.sort()
}

describe('translation catalogues', () => {
  it('keeps exact EN / ML / HI key parity', () => {
    const english = flatten(messages.en)
    expect(flatten(messages.ml)).toEqual(english)
    expect(flatten(messages.hi)).toEqual(english)
  })

  it('has no empty assistant strings', () => {
    for (const catalog of Object.values(messages)) {
      expect(catalog.assistant.title.length).toBeGreaterThan(0)
      expect(catalog.assistant.suggestions.length).toBe(3)
      expect(catalog.assistant.trust.length).toBe(3)
      for (const suggestion of catalog.assistant.suggestions) {
        expect(suggestion.length).toBeGreaterThan(0)
      }
    }
  })
})
