import { describe, expect, it } from 'vitest'

import { getAttributeBarWidth, getAttributeLabel } from '~/modules/player/labels'

describe('getAttributeLabel', () => {
  it('returns Péssimo for values below 20', () => {
    expect(getAttributeLabel(15)).toEqual({
      label: 'Péssimo',
      barClass: 'bg-destructive',
      textClass: 'text-red-600',
    })
  })

  it('returns Ruim for values between 20 and 39', () => {
    expect(getAttributeLabel(34)).toEqual({
      label: 'Ruim',
      barClass: 'bg-destructive',
      textClass: 'text-red-400',
    })
  })

  it('returns Fraco for values between 40 and 49', () => {
    expect(getAttributeLabel(46)).toEqual({
      label: 'Fraco',
      barClass: 'bg-warning',
      textClass: 'text-orange-400',
    })
  })

  it('returns Mediano for values between 50 and 59', () => {
    expect(getAttributeLabel(53)).toEqual({
      label: 'Mediano',
      barClass: 'bg-warning',
      textClass: 'text-amber-400',
    })
  })

  it('returns Bom for values between 60 and 74', () => {
    expect(getAttributeLabel(70)).toEqual({
      label: 'Bom',
      barClass: 'bg-success',
      textClass: 'text-green-400',
    })
  })
})

describe('getAttributeBarWidth', () => {
  it('calculates width as percentage of max value', () => {
    expect(getAttributeBarWidth(49.5)).toBe(`${(49.5 / 99) * 100}%`)
  })

  it('clamps width between 0 and 100', () => {
    expect(getAttributeBarWidth(-5)).toBe('0%')
    expect(getAttributeBarWidth(150)).toBe('100%')
  })
})
