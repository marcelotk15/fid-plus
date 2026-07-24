import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockContext } from '~tests/mocks/handler-context'
import { createLeagueHuman } from '~tests/mocks/league-human'

import { QUIZ_TYPE } from '../constants'
import { WordleDaLigaHandler } from './wordle-da-liga.handler'

function buildDialogDom(options: { clubName?: string; position?: string; letterCount?: number }) {
  const { clubName = 'Royal Identity', position = 'LW', letterCount = 5 } = options

  document.body.innerHTML = `
    <div role="dialog">
      <div class="text-center space-y-1">
        <p class="text-xs text-muted-foreground">Pista</p>
        <p class="text-sm font-medium">${clubName} · ${position} · ${letterCount} letras</p>
      </div>
      <div class="flex gap-2">
        <input maxlength="${letterCount}" placeholder="${letterCount} letras" />
        <button>Chutar</button>
      </div>
    </div>
  `
}

function createRealWaitForElementContext() {
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

describe('WordleDaLigaHandler', () => {
  const handler = new WordleDaLigaHandler()

  beforeEach(() => {
    document.body.innerHTML = ''
    vi.spyOn(console, 'info').mockImplementation(() => {})
  })

  it('has the wordle da liga quiz type', () => {
    expect(handler.type).toBe(QUIZ_TYPE.WORDLE_DA_LIGA)
  })

  describe('parsePayload', () => {
    it('returns league humans from a valid payload', () => {
      const player = createLeagueHuman()

      expect(handler.parsePayload([player])).toEqual([player])
    })

    it('returns null for an empty array', () => {
      expect(handler.parsePayload([])).toBeNull()
    })

    it('returns null when club name is missing', () => {
      const { club_name: _, ...playerWithoutClub } = createLeagueHuman()

      expect(handler.parsePayload([playerWithoutClub])).toBeNull()
    })

    it('returns null when primary position is missing', () => {
      const { primary_position: _, ...playerWithoutPosition } = createLeagueHuman()

      expect(handler.parsePayload([playerWithoutPosition])).toBeNull()
    })
  })

  describe('solve', () => {
    it('fills the input with the first name in uppercase and clicks Chutar', async () => {
      buildDialogDom({ clubName: 'Royal Identity', position: 'LW', letterCount: 5 })

      const player = createLeagueHuman({
        full_name: 'Pedro',
        club_name: 'Royal Identity',
        primary_position: 'LW',
      })
      const input = document.querySelector('[role="dialog"] input') as HTMLInputElement
      const guessButton = document.querySelector('[role="dialog"] button') as HTMLButtonElement
      const clickSpy = vi.spyOn(guessButton, 'click')

      const ctx = createRealWaitForElementContext()

      const solvePromise = handler.solve([player], ctx)

      setTimeout(() => {
        input.remove()
        guessButton.remove()
      }, 0)

      await solvePromise

      expect(input.value).toBe('PEDRO')
      expect(clickSpy).toHaveBeenCalledOnce()
    })

    it('uses only the first part of a compound name', async () => {
      buildDialogDom({ clubName: 'Royal Identity', position: 'ST', letterCount: 9 })

      const player = createLeagueHuman({
        full_name: 'Cristiano Ronaldo',
        club_name: 'Royal Identity',
        primary_position: 'ST',
      })
      const input = document.querySelector('[role="dialog"] input') as HTMLInputElement
      const guessButton = document.querySelector('[role="dialog"] button') as HTMLButtonElement

      const ctx = createRealWaitForElementContext()

      const solvePromise = handler.solve([player], ctx)

      setTimeout(() => {
        input.remove()
        guessButton.remove()
      }, 0)

      await solvePromise

      expect(input.value).toBe('CRISTIANO')
    })

    it('throws when the player does not match the hint', async () => {
      buildDialogDom({ clubName: 'Royal Identity', position: 'LW', letterCount: 5 })

      const ctx = createRealWaitForElementContext()

      await expect(
        handler.solve(
          [createLeagueHuman({ full_name: 'Ronaldo', club_name: 'Other Club', primary_position: 'LW' })],
          ctx,
        ),
      ).rejects.toThrow('Player not found in league data: royal identity · lw (5 letters)')
    })

    it('throws when the hint text is invalid', async () => {
      document.body.innerHTML = `
        <div role="dialog">
          <p class="text-sm font-medium">Royal Identity · LW · cinco letras</p>
          <input maxlength="5" />
          <button>Chutar</button>
        </div>
      `

      const ctx = createRealWaitForElementContext()

      await expect(handler.solve([createLeagueHuman()], ctx)).rejects.toThrow(
        'Invalid hint text: Royal Identity · LW · cinco letras',
      )
    })

    it('waits for success when the input disappears after submitting', async () => {
      buildDialogDom({ clubName: 'Royal Identity', position: 'LW', letterCount: 5 })

      const player = createLeagueHuman({
        full_name: 'Pedro',
        club_name: 'Royal Identity',
        primary_position: 'LW',
      })
      const input = document.querySelector('[role="dialog"] input') as HTMLInputElement
      const guessButton = document.querySelector('[role="dialog"] button') as HTMLButtonElement

      const ctx = createRealWaitForElementContext()

      const solvePromise = handler.solve([player], ctx)

      setTimeout(() => {
        input.remove()
      }, 50)

      await expect(solvePromise).resolves.toBeUndefined()
      expect(guessButton.isConnected).toBe(true)
    })
  })
})
