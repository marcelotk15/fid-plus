import { describe, expect, it } from 'vitest'

import { getPositionLabel } from './position-labels'

describe('getPositionLabel', () => {
  it('maps FIFA codes to Brazilian abbreviations', () => {
    expect(getPositionLabel('LM')).toBe('ME')
    expect(getPositionLabel('ST')).toBe('ATA')
    expect(getPositionLabel('GK')).toBe('GOL')
    expect(getPositionLabel('CB')).toBe('ZAG')
  })

  it('looks up codes case-insensitively', () => {
    expect(getPositionLabel('lm')).toBe('ME')
    expect(getPositionLabel('  Rm  ')).toBe('MD')
  })

  it('returns the original code when unknown', () => {
    expect(getPositionLabel('XX')).toBe('XX')
  })
})
