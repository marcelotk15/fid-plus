import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockContext } from '~tests/mocks/handler-context'
import { createSquadHuman } from '~tests/mocks/squad-human'

import { QUIZ_TYPE } from '../constants'
import { QuemEQuemHandler } from './quem-e-quem.handler'

function buildDialogDom(options: {
  current?: number
  total?: number
  playerName?: string
  jerseyNumber?: number
  positions?: string[]
}) {
  const { current = 1, total = 1, playerName = 'John Doe', jerseyNumber = 10, positions = ['GK', 'ST'] } = options

  document.body.innerHTML = `
    <div role="dialog">
      <div class="flex items-center justify-between">
        <span>${current} / ${total}</span>
      </div>
      <div class="rounded-lg border border-tactical/30 bg-tactical/5 p-4 text-center space-y-1">
        <p class="text-xs text-muted-foreground uppercase tracking-wide">Qual a posição dele?</p>
        <p class="font-display font-semibold text-lg">${playerName}<span class="text-muted-foreground"> #${jerseyNumber}</span></p>
      </div>
      <div class="grid">
        ${positions.map((position) => `<button>${position}</button>`).join('')}
      </div>
    </div>
  `
}

describe('QuemEQuemHandler', () => {
  const handler = new QuemEQuemHandler()

  beforeEach(() => {
    document.body.innerHTML = ''
    vi.spyOn(console, 'info').mockImplementation(() => {})
  })

  it('has the quem e quem quiz type', () => {
    expect(handler.type).toBe(QUIZ_TYPE.QUEM_E_QUEM)
  })

  describe('parsePayload', () => {
    it('returns squad humans from a valid payload', () => {
      const player = createSquadHuman()

      expect(handler.parsePayload([player])).toEqual([player])
    })

    it('returns null for an empty array', () => {
      expect(handler.parsePayload([])).toBeNull()
    })

    it('returns null when jersey number is missing', () => {
      const { jersey_number: _, ...playerWithoutJersey } = createSquadHuman()

      expect(handler.parsePayload([playerWithoutJersey])).toBeNull()
    })
  })

  describe('solve', () => {
    it('clicks the position option for the matching player', async () => {
      buildDialogDom({})

      const player = createSquadHuman()
      const positionButton = document.querySelector('[role="dialog"] .grid button:nth-child(2)') as HTMLButtonElement
      const clickSpy = vi.spyOn(positionButton, 'click')

      const ctx = createMockContext({
        waitForElement: vi.fn(async (selector: string) => {
          const element = document.querySelector(selector)

          if (!element) {
            throw new Error(`Element not found: ${selector}`)
          }

          return element
        }),
      })

      await handler.solve([player], ctx)

      expect(clickSpy).toHaveBeenCalledOnce()
    })

    it('throws when the player is not found in squad data', async () => {
      buildDialogDom({ playerName: 'Unknown Player', jerseyNumber: 99 })

      const ctx = createMockContext({
        waitForElement: vi.fn(async (selector: string) => {
          const element = document.querySelector(selector)

          if (!element) {
            throw new Error(`Element not found: ${selector}`)
          }

          return element
        }),
      })

      await expect(handler.solve([createSquadHuman()], ctx)).rejects.toThrow(
        'Player not found in squad data: unknown player (#99)',
      )
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

      await expect(handler.solve([createSquadHuman()], ctx)).rejects.toThrow('Invalid round counter: invalid')
    })

    it('throws when the position option is not found', async () => {
      buildDialogDom({ positions: ['GK', 'CB'] })

      const ctx = createMockContext({
        waitForElement: vi.fn(async (selector: string) => {
          const element = document.querySelector(selector)

          if (!element) {
            throw new Error(`Element not found: ${selector}`)
          }

          return element
        }),
      })

      await expect(handler.solve([createSquadHuman({ primary_position: 'ST' })], ctx)).rejects.toThrow(
        'Quiz option not found for text: ST',
      )
    })
  })
})
