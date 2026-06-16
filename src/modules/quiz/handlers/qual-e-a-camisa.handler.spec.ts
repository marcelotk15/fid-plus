import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockContext } from '~tests/mocks/handler-context'
import { createSquadHuman } from '~tests/mocks/squad-human'

import { QUIZ_TYPE } from '../constants'
import { QualECamisaHandler } from './qual-e-a-camisa.handler'

function buildDialogDom(options: {
  current?: number
  total?: number
  playerName?: string
  position?: string
  jerseys?: number[]
}) {
  const { current = 1, total = 1, playerName = 'John Doe', position = 'ST', jerseys = [7, 10] } = options

  document.body.innerHTML = `
    <div role="dialog">
      <div class="flex items-center justify-between">
        <span>${current} / ${total}</span>
      </div>
      <div class="rounded-lg border p-4">
        <div class="font-display font-semibold">${playerName}</div>
        <p class="text-xs text-muted-foreground">${position}</p>
      </div>
      <div class="grid">
        ${jerseys.map((number) => `<button>#${number}</button>`).join('')}
      </div>
    </div>
  `
}

describe('QualECamisaHandler', () => {
  const handler = new QualECamisaHandler()

  beforeEach(() => {
    document.body.innerHTML = ''
    vi.spyOn(console, 'info').mockImplementation(() => {})
  })

  it('has the qual e a camisa quiz type', () => {
    expect(handler.type).toBe(QUIZ_TYPE.QUAL_E_A_CAMISA)
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
    it('clicks the jersey option for the matching player', async () => {
      buildDialogDom({})

      const player = createSquadHuman()
      const jerseyButton = document.querySelector('[role="dialog"] .grid button:nth-child(2)') as HTMLButtonElement
      const clickSpy = vi.spyOn(jerseyButton, 'click')

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
      buildDialogDom({ playerName: 'Unknown Player' })

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
        'Player not found in squad data: unknown player (st)',
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

    it('throws when the jersey option is not found', async () => {
      buildDialogDom({ jerseys: [7, 9] })

      const ctx = createMockContext({
        waitForElement: vi.fn(async (selector: string) => {
          const element = document.querySelector(selector)

          if (!element) {
            throw new Error(`Element not found: ${selector}`)
          }

          return element
        }),
      })

      await expect(handler.solve([createSquadHuman({ jersey_number: 10 })], ctx)).rejects.toThrow(
        'Jersey option not found: #10',
      )
    })
  })
})
