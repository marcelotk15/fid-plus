import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { waitForAssertion } from '~tests/helpers/wait-for'

import type { PlayerAttributes } from '~/modules/player/types'

import { ATTRS_GRID_SELECTOR } from '~/modules/player/render-attrs-grid'
import { PlayerProfileRunner } from '~/modules/player/runner'
import { MESSAGE_SOURCE, MESSAGE_TYPE } from '~/modules/shared/consts'

vi.mock('~/modules/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}))

const PLAYER_ID = 'c5075e8e-e5cc-455d-a566-7b1cacb2341b'

const playerRoute = {
  href: `https://footballidentity.org/player/${PLAYER_ID}`,
  pathname: `/player/${PLAYER_ID}`,
  search: '',
}

const sampleAttributes: PlayerAttributes = {
  id: '5a12d99f-9520-4867-9cbc-f0d144e3c234',
  player_profile_id: PLAYER_ID,
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

function createPlayerAttributesMessage(
  overrides: {
    status?: number
    body?: unknown
    source?: string
    type?: string
  } = {},
) {
  return new MessageEvent('message', {
    data: {
      source: overrides.source ?? MESSAGE_SOURCE.PLAYER_CONTENT,
      type: overrides.type ?? MESSAGE_TYPE.PLAYER_ATTRIBUTES,
      payload: {
        pageUrl: playerRoute.href,
        status: overrides.status ?? 200,
        body: overrides.body ?? [sampleAttributes],
      },
    },
    source: window,
  })
}

describe('PlayerProfileRunner', () => {
  const runners: PlayerProfileRunner[] = []

  const createRunner = () => {
    const runner = new PlayerProfileRunner()
    runners.push(runner)
    return runner
  }

  beforeEach(() => {
    document.body.innerHTML = `
      <main class="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
        <div class="space-y-6 max-w-2xl">
          <div class="first-section">Header</div>
          <div class="second-section">Other</div>
        </div>
      </main>
    `
  })

  afterEach(() => {
    for (const runner of runners) {
      runner.dispose()
    }

    runners.length = 0
    document.body.innerHTML = ''
  })

  it('does not process messages before entering player profile route', async () => {
    const runner = createRunner()

    runner.onPlayerAttributes(createPlayerAttributesMessage())

    await waitForAssertion(() => {
      expect(document.querySelector(ATTRS_GRID_SELECTOR)).toBeNull()
    })
  })

  it('removes max-w-2xl when entering player profile route', async () => {
    const runner = createRunner()
    const container = document.querySelector('main .space-y-6')

    runner.onRouteChange(playerRoute)

    await waitForAssertion(() => {
      expect(container?.classList.contains('max-w-2xl')).toBe(false)
    })
  })

  it('removes max-w-2xl after SPA navigation updates the DOM', async () => {
    document.body.innerHTML = `
      <main class="flex-1">
        <div class="space-y-6 max-w-2xl">
          <div class="home-section">Home</div>
        </div>
      </main>
    `

    const runner = createRunner()
    runner.onRouteChange(playerRoute)

    setTimeout(() => {
      const main = document.querySelector('main')!
      main.innerHTML = `
        <div class="space-y-6 max-w-2xl">
          <div class="first-section">Header</div>
          <div class="second-section">Other</div>
        </div>
      `
    }, 10)

    await waitForAssertion(() => {
      const container = document.querySelector('main .space-y-6')
      expect(container?.classList.contains('max-w-2xl')).toBe(false)
    })
  })

  it('renders attributes grid from intercepted payload', async () => {
    const runner = createRunner()

    runner.onRouteChange(playerRoute)
    runner.onPlayerAttributes(createPlayerAttributesMessage())

    await waitForAssertion(() => {
      const grid = document.querySelector(ATTRS_GRID_SELECTOR)
      expect(grid).not.toBeNull()
      expect(grid?.querySelector('.stat-card')).not.toBeNull()
    })
  })

  it('inserts attributes grid between the first two child divs', async () => {
    const runner = createRunner()

    runner.onRouteChange(playerRoute)
    runner.onPlayerAttributes(createPlayerAttributesMessage())

    await waitForAssertion(() => {
      const container = document.querySelector('main .space-y-6')
      const grid = document.querySelector(ATTRS_GRID_SELECTOR)
      const children = Array.from(container?.children ?? [])

      expect(grid).not.toBeNull()
      expect(children[0]?.classList.contains('first-section')).toBe(true)
      expect(children[1]).toBe(grid)
      expect(children[2]?.classList.contains('second-section')).toBe(true)
    })
  })

  it('ignores payload when profile id does not match route', async () => {
    const runner = createRunner()

    runner.onRouteChange(playerRoute)
    runner.onPlayerAttributes(
      createPlayerAttributesMessage({
        body: [{ ...sampleAttributes, player_profile_id: 'other-id' }],
      }),
    )

    await waitForAssertion(() => {
      expect(document.querySelector(ATTRS_GRID_SELECTOR)).toBeNull()
    })
  })

  it('restores layout when leaving player profile route', async () => {
    const runner = createRunner()
    const container = document.querySelector('main .space-y-6')

    runner.onRouteChange(playerRoute)

    await waitForAssertion(() => {
      expect(container?.classList.contains('max-w-2xl')).toBe(false)
    })

    runner.onRouteChange({ href: 'https://footballidentity.org/player/home', pathname: '/player/home', search: '' })

    await waitForAssertion(() => {
      expect(container?.classList.contains('max-w-2xl')).toBe(true)
      expect(document.querySelector(ATTRS_GRID_SELECTOR)).toBeNull()
    })
  })
})
