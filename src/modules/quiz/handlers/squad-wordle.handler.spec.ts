import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockContext } from '~tests/mocks/handler-context'
import { createSquadHuman } from '~tests/mocks/squad-human'

import { QUIZ_TYPE } from '../constants'
import { SquadWordleHandler } from './squad-wordle.handler'

function buildDialogDom(options: { position?: string; letterCount?: number }) {
  const { position = 'RM', letterCount = 8 } = options

  document.body.innerHTML = `
    <div role="dialog">
      <div class="text-center space-y-1">
        <p class="text-xs text-muted-foreground">Pista</p>
        <p class="text-sm font-medium">${position} · ${letterCount} letras</p>
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

describe('SquadWordleHandler', () => {
  const handler = new SquadWordleHandler()

  beforeEach(() => {
    document.body.innerHTML = ''
    vi.spyOn(console, 'info').mockImplementation(() => {})
  })

  it('has the squad wordle quiz type', () => {
    expect(handler.type).toBe(QUIZ_TYPE.SQUAD_WORDLE)
  })

  describe('parsePayload', () => {
    it('returns squad humans from a valid payload', () => {
      const player = createSquadHuman()

      expect(handler.parsePayload([player])).toEqual([player])
    })

    it('returns null for an empty array', () => {
      expect(handler.parsePayload([])).toBeNull()
    })

    it('returns null when primary position is missing', () => {
      const { primary_position: _, ...playerWithoutPosition } = createSquadHuman()

      expect(handler.parsePayload([playerWithoutPosition])).toBeNull()
    })
  })

  describe('solve', () => {
    it('fills the input with the first name in uppercase and clicks Chutar', async () => {
      buildDialogDom({ position: 'RM', letterCount: 8 })

      const player = createSquadHuman({
        full_name: 'Fernando',
        primary_position: 'RM',
      })
      const input = document.querySelector('[role="dialog"] input') as HTMLInputElement
      const guessButton = document.querySelector('[role="dialog"] button') as HTMLButtonElement
      const clickSpy = vi.spyOn(guessButton, 'click')

      const ctx = createRealWaitForElementContext()

      const solvePromise = handler.solve([player], ctx)

      input.remove()
      guessButton.remove()

      await solvePromise

      expect(input.value).toBe('FERNANDO')
      expect(clickSpy).toHaveBeenCalledOnce()
    })

    it('uses only the first part of a compound name', async () => {
      buildDialogDom({ position: 'ST', letterCount: 9 })

      const player = createSquadHuman({
        full_name: 'Cristiano Ronaldo',
        primary_position: 'ST',
      })
      const input = document.querySelector('[role="dialog"] input') as HTMLInputElement
      const guessButton = document.querySelector('[role="dialog"] button') as HTMLButtonElement

      const ctx = createRealWaitForElementContext()

      const solvePromise = handler.solve([player], ctx)

      input.remove()
      guessButton.remove()

      await solvePromise

      expect(input.value).toBe('CRISTIANO')
    })

    it('throws when the player does not match the hint', async () => {
      buildDialogDom({ position: 'RM', letterCount: 8 })

      const ctx = createRealWaitForElementContext()

      await expect(
        handler.solve([createSquadHuman({ full_name: 'Ronaldo', primary_position: 'ST' })], ctx),
      ).rejects.toThrow('Player not found in squad data: rm (8 letters)')
    })

    it('throws when the hint text is invalid', async () => {
      document.body.innerHTML = `
        <div role="dialog">
          <p class="text-sm font-medium">RM · oito letras</p>
          <input maxlength="8" />
          <button>Chutar</button>
        </div>
      `

      const ctx = createRealWaitForElementContext()

      await expect(handler.solve([createSquadHuman()], ctx)).rejects.toThrow('Invalid hint text: RM · oito letras')
    })

    it('waits for success when the input disappears after submitting', async () => {
      buildDialogDom({ position: 'RM', letterCount: 8 })

      const player = createSquadHuman({
        full_name: 'Fernando',
        primary_position: 'RM',
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
