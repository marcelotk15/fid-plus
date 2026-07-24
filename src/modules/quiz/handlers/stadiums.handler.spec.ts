import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockContext } from '~tests/mocks/handler-context'
import { createStadium } from '~tests/mocks/stadium'

import { QUIZ_TYPE } from '../constants'
import { StadiumsHandler } from './stadiums.handler'

function buildClubToStadiumDom(options: {
  current?: number
  total?: number
  clubName?: string
  optionNames?: string[]
}) {
  const {
    current = 1,
    total = 1,
    clubName = 'FK Vedernik Prauzhda',
    optionNames = ['Atlantis Arena', 'Livada', 'Torlak Worriors', 'Gradski stadion Spartak'],
  } = options

  document.body.innerHTML = `
    <div role="dialog">
      <div class="flex items-center justify-between">
        <span>${current} / ${total}</span>
      </div>
      <div class="rounded-lg border border-tactical/30 bg-tactical/5 p-4 text-center space-y-2">
        <p class="text-xs text-muted-foreground uppercase tracking-wide">Qual é o estádio deste time?</p>
        <div class="flex items-center justify-center gap-2">
          <div class="flex items-center justify-center overflow-hidden w-10 h-10 rounded-md">
            <img src="https://example.com/crest.png" alt="VED">
          </div>
          <p class="font-display font-semibold text-lg">${clubName}</p>
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        ${optionNames
          .map(
            (optionName) =>
              `<button class="px-3 py-3 rounded-md border-2"><span class="font-display font-semibold text-sm flex-1">${optionName}</span></button>`,
          )
          .join('')}
      </div>
    </div>
  `
}

function buildStadiumToClubDom(options: {
  current?: number
  total?: number
  stadiumName?: string
  optionNames?: string[]
}) {
  const {
    current = 1,
    total = 1,
    stadiumName = 'Livada',
    optionNames = ['Bradford City', 'FK Vedernik Prauzhda', 'Spartak', 'Atlantis FC'],
  } = options

  document.body.innerHTML = `
    <div role="dialog">
      <div class="flex items-center justify-between">
        <span>${current} / ${total}</span>
      </div>
      <div class="rounded-lg border border-tactical/30 bg-tactical/5 p-4 text-center space-y-2">
        <p class="text-xs text-muted-foreground uppercase tracking-wide">Qual time joga neste estádio?</p>
        <p class="font-display font-semibold text-lg">${stadiumName}</p>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        ${optionNames
          .map(
            (optionName) =>
              `<button class="px-3 py-3 rounded-md border-2"><span class="font-display font-semibold text-sm flex-1">${optionName}</span></button>`,
          )
          .join('')}
      </div>
    </div>
  `
}

describe('StadiumsHandler', () => {
  const handler = new StadiumsHandler()

  beforeEach(() => {
    document.body.innerHTML = ''
    vi.spyOn(console, 'info').mockImplementation(() => {})
  })

  it('has the time estadio quiz type', () => {
    expect(handler.type).toBe(QUIZ_TYPE.TIME_ESTADIO)
  })

  describe('parsePayload', () => {
    it('returns stadiums from a valid payload', () => {
      const stadium = createStadium()

      expect(handler.parsePayload([stadium])).toEqual([stadium])
    })

    it('returns null for an empty array', () => {
      expect(handler.parsePayload([])).toBeNull()
    })

    it('returns null when club name is missing', () => {
      const { club_name: _, ...stadiumWithoutClubName } = createStadium()

      expect(handler.parsePayload([stadiumWithoutClubName])).toBeNull()
    })

    it('returns null when stadium name is missing', () => {
      const { stadium_name: _, ...stadiumWithoutStadiumName } = createStadium()

      expect(handler.parsePayload([stadiumWithoutStadiumName])).toBeNull()
    })
  })

  describe('solve', () => {
    it('clicks the stadium option when asked for the club stadium', async () => {
      buildClubToStadiumDom({})

      const stadium = createStadium()
      const stadiumButton = document.querySelector('[role="dialog"] .grid button:nth-child(2)') as HTMLButtonElement
      const clickSpy = vi.spyOn(stadiumButton, 'click')

      const ctx = createMockContext({
        waitForElement: vi.fn(async (selector: string) => {
          const element = document.querySelector(selector)

          if (!element) {
            throw new Error(`Element not found: ${selector}`)
          }

          return element
        }),
      })

      await handler.solve([stadium], ctx)

      expect(clickSpy).toHaveBeenCalledOnce()
    })

    it('clicks the club option when asked who plays at the stadium', async () => {
      buildStadiumToClubDom({})

      const stadium = createStadium()
      const clubButton = document.querySelector('[role="dialog"] .grid button:nth-child(2)') as HTMLButtonElement
      const clickSpy = vi.spyOn(clubButton, 'click')

      const ctx = createMockContext({
        waitForElement: vi.fn(async (selector: string) => {
          const element = document.querySelector(selector)

          if (!element) {
            throw new Error(`Element not found: ${selector}`)
          }

          return element
        }),
      })

      await handler.solve([stadium], ctx)

      expect(clickSpy).toHaveBeenCalledOnce()
    })

    it('throws when the club is not found in stadium data', async () => {
      buildClubToStadiumDom({ clubName: 'Unknown Club' })

      const ctx = createMockContext({
        waitForElement: vi.fn(async (selector: string) => {
          const element = document.querySelector(selector)

          if (!element) {
            throw new Error(`Element not found: ${selector}`)
          }

          return element
        }),
      })

      await expect(handler.solve([createStadium()], ctx)).rejects.toThrow('Stadium not found for club: unknown club')
    })

    it('throws when the stadium is not found in stadium data', async () => {
      buildStadiumToClubDom({ stadiumName: 'Unknown Stadium' })

      const ctx = createMockContext({
        waitForElement: vi.fn(async (selector: string) => {
          const element = document.querySelector(selector)

          if (!element) {
            throw new Error(`Element not found: ${selector}`)
          }

          return element
        }),
      })

      await expect(handler.solve([createStadium()], ctx)).rejects.toThrow('Club not found for stadium: unknown stadium')
    })

    it('throws when the round counter is invalid', async () => {
      document.body.innerHTML = `
        <div role="dialog">
          <div class="flex items-center justify-between">
            <span>invalid</span>
          </div>
        </div>
      `

      const ctx = createMockContext({
        waitForElement: vi.fn(async (selector: string) => {
          const element = document.querySelector(selector)

          if (!element) {
            throw new Error(`Element not found: ${selector}`)
          }

          return element
        }),
      })

      await expect(handler.solve([createStadium()], ctx)).rejects.toThrow('Invalid round counter: invalid')
    })

    it('throws when the stadium option is not found', async () => {
      buildClubToStadiumDom({ optionNames: ['Atlantis Arena', 'Gradski stadion Spartak'] })

      const ctx = createMockContext({
        waitForElement: vi.fn(async (selector: string) => {
          const element = document.querySelector(selector)

          if (!element) {
            throw new Error(`Element not found: ${selector}`)
          }

          return element
        }),
      })

      await expect(handler.solve([createStadium()], ctx)).rejects.toThrow('Quiz option not found for text: Livada')
    })

    it('throws when the club option is not found', async () => {
      buildStadiumToClubDom({
        stadiumName: 'Livada',
        optionNames: ['Bradford City', 'Spartak', 'Atlantis FC'],
      })

      const ctx = createMockContext({
        waitForElement: vi.fn(async (selector: string) => {
          const element = document.querySelector(selector)

          if (!element) {
            throw new Error(`Element not found: ${selector}`)
          }

          return element
        }),
      })

      await expect(handler.solve([createStadium()], ctx)).rejects.toThrow(
        'Quiz option not found for text: FK Vedernik Prauzhda',
      )
    })
  })
})
