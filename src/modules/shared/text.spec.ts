import { describe, expect, it } from 'vitest'

import { getTextContent, normalizeText } from './text'

describe('normalizeText', () => {
  it('collapses whitespace, trims edges and lowercases', () => {
    expect(normalizeText('  Hello   World  ')).toBe('hello world')
  })

  it('returns empty string for empty input', () => {
    expect(normalizeText('')).toBe('')
  })
})

describe('getTextContent', () => {
  it('normalizes the element textContent', () => {
    const element = document.createElement('div')
    element.textContent = '  Quem   é Quem?  '

    expect(getTextContent(element)).toBe('quem é quem?')
  })

  it('returns empty string when textContent is null', () => {
    const element = document.createElement('div')

    expect(getTextContent(element)).toBe('')
  })
})
