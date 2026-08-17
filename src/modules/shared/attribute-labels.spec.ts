import { describe, expect, it } from 'vitest'

import { getAttrKeyByLabel, getAttributeLabel } from './attribute-labels'

describe('attribute-labels', () => {
  it('maps known attr keys to page labels', () => {
    expect(getAttributeLabel('agilidade')).toBe('Agilidade')
    expect(getAttributeLabel('controle_bola')).toBe('Controle de Bola')
    expect(getAttributeLabel('stamina')).toBe('Condição Física')
    expect(getAttributeLabel('acuracia_chute')).toBe('Precisão do Chute')
    expect(getAttributeLabel('posicionamento_gol')).toBe('Posicionamento')
  })

  it('returns the attr key when label is unknown', () => {
    expect(getAttributeLabel('unknown_attr')).toBe('unknown_attr')
  })

  it('resolves attr key from page label', () => {
    expect(getAttrKeyByLabel('Agilidade')).toBe('agilidade')
    expect(getAttrKeyByLabel('  Precisão do Chute  ')).toBe('acuracia_chute')
    expect(getAttrKeyByLabel('Não existe')).toBeNull()
  })
})
