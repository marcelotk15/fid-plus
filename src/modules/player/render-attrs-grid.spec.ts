import { describe, expect, it } from 'vitest'

import type { PlayerAttributes } from '~/modules/player/types'

import { ATTRIBUTE_GROUPS } from '~/modules/player/constants'
import { ATTRS_GRID_SELECTOR, isExtensionAttrsGrid, renderAttrsGrid } from '~/modules/player/render-attrs-grid'

const sampleAttributes: PlayerAttributes = {
  id: '5a12d99f-9520-4867-9cbc-f0d144e3c234',
  player_profile_id: 'c5075e8e-e5cc-455d-a566-7b1cacb2341b',
  velocidade: 22,
  aceleracao: 31,
  agilidade: 34.2,
  forca: 42,
  equilibrio: 32,
  resistencia: 34.61,
  pulo: 43,
  stamina: 35.68,
  drible: 18,
  controle_bola: 36,
  marcacao: 36,
  desarme: 38,
  um_toque: 33,
  curva: 35,
  passe_baixo: 35,
  passe_alto: 36,
  visao_jogo: 33.25,
  tomada_decisao: 36,
  antecipacao: 35,
  trabalho_equipe: 32.56,
  coragem: 37,
  posicionamento_ofensivo: 35,
  posicionamento_defensivo: 37,
  cabeceio: 43,
  acuracia_chute: 23,
  forca_chute: 33,
  reflexo: 70.89,
  posicionamento_gol: 61.13,
  defesa_aerea: 54.56,
  pegada: 61.14,
  saida_gol: 44,
  um_contra_um: 42,
  distribuicao_curta: 37.36,
  distribuicao_longa: 38.92,
  tempo_reacao: 54.62,
  comando_area: 46,
  created_at: '2026-05-22T12:47:26.812172+00:00',
  updated_at: '2026-06-15T17:32:48.31638+00:00',
}

describe('renderAttrsGrid', () => {
  it('renders grid with category cards', () => {
    const grid = renderAttrsGrid(sampleAttributes)

    expect(grid.matches(ATTRS_GRID_SELECTOR)).toBe(true)
    expect(isExtensionAttrsGrid(grid)).toBe(true)
    expect(grid.className).toContain('grid')
    expect(grid.querySelectorAll('.stat-card')).toHaveLength(ATTRIBUTE_GROUPS.length)
  })

  it('renders attribute rows with value and rating', () => {
    const grid = renderAttrsGrid(sampleAttributes)
    const velocidadeRow = Array.from(grid.querySelectorAll('.text-xs.text-muted-foreground')).find(
      (element) => element.textContent === 'Velocidade',
    )

    expect(velocidadeRow).toBeTruthy()

    const row = velocidadeRow?.closest('.flex.items-center.gap-2')
    expect(row?.querySelector('.font-display.text-sm.font-bold')?.textContent).toBe('22.00')
    expect(row?.querySelector('.text-red-400')?.textContent).toBe('Ruim')
  })

  it('does not render growth or training controls', () => {
    const grid = renderAttrsGrid(sampleAttributes)
    const html = grid.innerHTML

    expect(html).not.toContain('Treinar')
    expect(html).not.toContain('lucide-arrow-up')
    expect(html).not.toContain('bg-emerald-400')
    expect(html).not.toContain('Limite:')
    expect(html).not.toContain('lucide-info')
    expect(grid.querySelectorAll('button')).toHaveLength(0)
  })
})
