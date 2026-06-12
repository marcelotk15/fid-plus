import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockContext } from '~tests/mocks/handler-context'
import { createTopScorer } from '~tests/mocks/top-scorer'

import { QUIZ_TYPE } from '../constants'
import { TopScorersHandler } from './top-scorers.handler'

function buildDom(options: {
  current?: number
  total?: number
  roundNumber?: number
  seasonNumber?: number
  optionNames?: string[]
}) {
  const {
    current = 1,
    total = 1,
    roundNumber = 6,
    seasonNumber = 1,
    optionNames = ['Edónho', 'Reece Jaime', 'Rodheiser', 'Edu Guollo'],
  } = options

  document.body.innerHTML = `
    <div role="dialog">
      <h2 class="text-lg font-semibold">Artilheiro da Rodada</h2>
      <div class="flex items-center justify-between">
        <span>${current} / ${total}</span>
      </div>
      <div class="rounded-lg border border-tactical/30 bg-tactical/5 p-4 text-center space-y-1">
        <p class="text-xs text-muted-foreground uppercase tracking-wide">Quem foi o artilheiro?</p>
        <p class="font-display font-semibold text-base">Rodada ${roundNumber} · T${seasonNumber}</p>
      </div>
      <div class="space-y-2">
        ${optionNames
          .map(
            (name) =>
              `<button class="w-full px-3 py-2 rounded-md border-2"><span>${name}</span><span class="text-xs opacity-80"></span></button>`,
          )
          .join('')}
      </div>
    </div>
  `
}

function createCtx() {
  return createMockContext({
    waitForElement: vi.fn(async (selector: string) => {
      const element = document.querySelector(selector)

      if (!element) {
        throw new Error(`Element not found: ${selector}`)
      }

      return element
    }),
  })
}

describe('TopScorersHandler', () => {
  let handler: TopScorersHandler

  beforeEach(() => {
    handler = new TopScorersHandler()
    document.body.innerHTML = ''
    vi.spyOn(console, 'info').mockImplementation(() => {})
  })

  it('has the artilheiro da rodada quiz type', () => {
    expect(handler.type).toBe(QUIZ_TYPE.ARTILHEIRO_DA_RODADA)
  })

  describe('parsePayload', () => {
    it('returns scorers from a valid payload', () => {
      const scorer = createTopScorer()

      expect(handler.parsePayload([scorer])).toEqual([scorer])
    })

    it('returns null for an empty array', () => {
      expect(handler.parsePayload([])).toBeNull()
    })

    it('returns null when full_name is missing', () => {
      const { full_name: _, ...scorerWithoutName } = createTopScorer()

      expect(handler.parsePayload([scorerWithoutName])).toBeNull()
    })

    it('returns null when round_number is missing', () => {
      const { round_number: _, ...scorerWithoutRound } = createTopScorer()

      expect(handler.parsePayload([scorerWithoutRound])).toBeNull()
    })

    it('returns null when season_number is missing', () => {
      const { season_number: _, ...scorerWithoutSeason } = createTopScorer()

      expect(handler.parsePayload([scorerWithoutSeason])).toBeNull()
    })
  })

  describe('storePayload', () => {
    it('stores payload by season_round key from the first item', async () => {
      buildDom({ current: 1, total: 1, roundNumber: 6, seasonNumber: 1 })

      const payload = [
        createTopScorer({ full_name: 'Edónho', total_goals: 3, round_number: 6, season_number: 1 }),
      ]

      handler.storePayload(payload)

      const button = document.querySelector('[role="dialog"] .space-y-2 button:nth-child(1)') as HTMLButtonElement
      const clickSpy = vi.spyOn(button, 'click')

      await handler.progress(createCtx())

      expect(clickSpy).toHaveBeenCalledOnce()
    })
  })

  describe('progress', () => {
    it('clicks the player with the most goals for the displayed round', async () => {
      buildDom({ current: 1, total: 1, roundNumber: 6, seasonNumber: 1 })

      handler.storePayload([
        createTopScorer({ full_name: 'Edónho', total_goals: 2, round_number: 6, season_number: 1 }),
        createTopScorer({ full_name: 'Reece Jaime', total_goals: 4, round_number: 6, season_number: 1 }),
        createTopScorer({ full_name: 'Rodheiser', total_goals: 1, round_number: 6, season_number: 1 }),
        createTopScorer({ full_name: 'Edu Guollo', total_goals: 3, round_number: 6, season_number: 1 }),
      ])

      const topScorerButton = document.querySelector(
        '[role="dialog"] .space-y-2 button:nth-child(2)',
      ) as HTMLButtonElement
      const clickSpy = vi.spyOn(topScorerButton, 'click')

      await handler.progress(createCtx())

      expect(clickSpy).toHaveBeenCalledOnce()
    })

    it('returns early when round data is not cached yet', async () => {
      buildDom({ current: 1, total: 2, roundNumber: 6, seasonNumber: 1 })

      handler.storePayload([createTopScorer({ full_name: 'Edónho', total_goals: 3, round_number: 7, season_number: 1 })])

      const button = document.querySelector('[role="dialog"] .space-y-2 button') as HTMLButtonElement
      const clickSpy = vi.spyOn(button, 'click')

      await handler.progress(createCtx())

      expect(clickSpy).not.toHaveBeenCalled()
    })

    it('throws when the round counter is invalid', async () => {
      document.body.innerHTML = `
        <div role="dialog">
          <div class="flex items-center justify-between">
            <span>invalid</span>
          </div>
        </div>
      `

      await expect(handler.progress(createCtx())).rejects.toThrow('Invalid round counter: invalid')
    })

    it('throws when the round line is invalid', async () => {
      buildDom({})
      const roundLine = document.querySelector('[role="dialog"] .font-display.font-semibold') as HTMLElement
      roundLine.textContent = 'Rodada inválida'

      await expect(handler.progress(createCtx())).rejects.toThrow('Invalid round line: rodada inválida')
    })

    it('throws when the top scorer option is not found', async () => {
      buildDom({ optionNames: ['Reece Jaime', 'Rodheiser', 'Edu Guollo'] })

      handler.storePayload([createTopScorer({ full_name: 'Edónho', total_goals: 5 })])

      await expect(handler.progress(createCtx())).rejects.toThrow('Quiz option not found for text: Edónho')
    })

    it('solves multiple rounds when all rounds are cached', async () => {
      buildDom({ current: 1, total: 2, roundNumber: 6, seasonNumber: 1 })

      handler.storePayload([
        createTopScorer({ full_name: 'Edónho', total_goals: 3, round_number: 6, season_number: 1 }),
        createTopScorer({ full_name: 'Reece Jaime', total_goals: 1, round_number: 6, season_number: 1 }),
      ])
      handler.storePayload([
        createTopScorer({ full_name: 'Reece Jaime', total_goals: 2, round_number: 7, season_number: 1 }),
        createTopScorer({ full_name: 'Rodheiser', total_goals: 5, round_number: 7, season_number: 1 }),
      ])

      const roundOneButton = document.querySelector(
        '[role="dialog"] .space-y-2 button:nth-child(1)',
      ) as HTMLButtonElement
      const roundTwoButton = document.querySelector(
        '[role="dialog"] .space-y-2 button:nth-child(3)',
      ) as HTMLButtonElement
      const roundOneClickSpy = vi.spyOn(roundOneButton, 'click')
      const roundTwoClickSpy = vi.spyOn(roundTwoButton, 'click')

      const counter = document.querySelector(
        '[role="dialog"] .flex.items-center.justify-between > span:first-child',
      ) as HTMLElement
      const roundLine = document.querySelector('[role="dialog"] .font-display.font-semibold') as HTMLElement

      const progressPromise = handler.progress(createCtx())

      await new Promise((resolve) => setTimeout(resolve, 0))

      counter.textContent = '2 / 2'
      roundLine.textContent = 'Rodada 7 · T1'

      await progressPromise

      expect(roundOneClickSpy).toHaveBeenCalledOnce()
      expect(roundTwoClickSpy).toHaveBeenCalledOnce()
    })
  })
})
