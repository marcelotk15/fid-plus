import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockContext } from '~tests/mocks/handler-context'
import { createLeagueHuman } from '~tests/mocks/league-human'

import * as dom from '~/modules/shared/dom'

import { QUIZ_TYPE } from '../constants'
import { ConexoesDaLigaHandler } from './conexoes-da-liga.handler'

function buildHearts(count: number): string {
  return Array.from({ length: count }, () => '<span class="text-pitch">♥</span>').join('')
}

function buildDialogDom(options: {
  requiredCount?: number
  optionNames?: string[]
  attempts?: number
  maxAttempts?: number
  remainingRounds?: number
}) {
  const {
    requiredCount = 4,
    optionNames = ['Player A', 'Player B', 'Player C', 'Player D', 'Player E'],
    attempts = 0,
    maxAttempts = 4,
    remainingRounds = 1,
  } = options

  const optionButtons = optionNames.map((name) => `<button class="px-1 py-2 rounded">${name}</button>`).join('')

  document.body.innerHTML = `
    <div role="dialog">
      <h2>Conexões da Liga</h2>
      <div class="flex items-center justify-between text-xs">
        <span class="text-muted-foreground">Selecione ${requiredCount} do MESMO clube</span>
        <span>${buildHearts(remainingRounds)}</span>
      </div>
      <div class="grid grid-cols-4 gap-1.5">
        ${optionButtons}
      </div>
      <button class="w-full">Verificar (${attempts}/${maxAttempts})</button>
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

function createPlayersForOptions(optionNames: string[], clubId: string, clubName: string) {
  return optionNames.map((name, index) =>
    createLeagueHuman({
      full_name: name,
      club_id: clubId,
      club_name: clubName,
      player_profile_id: `player-${index}`,
    }),
  )
}

describe('ConexoesDaLigaHandler', () => {
  const handler = new ConexoesDaLigaHandler()

  beforeEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
    vi.spyOn(console, 'info').mockImplementation(() => {})
  })

  it('has the conexoes da liga quiz type', () => {
    expect(handler.type).toBe(QUIZ_TYPE.CONEXOES_DA_LIGA)
  })

  describe('parsePayload', () => {
    it('returns league humans from a valid payload', () => {
      const player = createLeagueHuman()

      expect(handler.parsePayload([player])).toEqual([player])
    })

    it('returns null for an empty array', () => {
      expect(handler.parsePayload([])).toBeNull()
    })

    it('returns null when club id is missing', () => {
      const { club_id: _, ...playerWithoutClubId } = createLeagueHuman()

      expect(handler.parsePayload([playerWithoutClubId])).toBeNull()
    })
  })

  describe('solve', () => {
    it('clicks the required players from the same club and verifies', async () => {
      const optionNames = ['Player A', 'Player B', 'Player C', 'Player D', 'Player E']
      buildDialogDom({ optionNames })

      const players = [
        ...createPlayersForOptions(['Player A', 'Player B', 'Player C', 'Player D'], 'club-1', 'Club One'),
        createLeagueHuman({
          full_name: 'Player E',
          club_id: 'club-2',
          club_name: 'Club Two',
          player_profile_id: 'player-e',
        }),
      ]

      const buttons = Array.from(document.querySelectorAll('[role="dialog"] .grid button'))
      const clickSpies = buttons.map((button) => vi.spyOn(button, 'click' as never))
      const verifyButton = document.querySelector('[role="dialog"] button.w-full') as HTMLButtonElement
      const verifyClickSpy = vi.spyOn(verifyButton, 'click' as never)

      const ctx = createRealWaitForElementContext()

      const solvePromise = handler.solve(players, ctx)

      setTimeout(() => {
        verifyButton.closest('[role="dialog"]')?.remove()
      }, 0)

      await solvePromise

      expect(clickSpies[0]).toHaveBeenCalledOnce()
      expect(clickSpies[1]).toHaveBeenCalledOnce()
      expect(clickSpies[2]).toHaveBeenCalledOnce()
      expect(clickSpies[3]).toHaveBeenCalledOnce()
      expect(clickSpies[4]).not.toHaveBeenCalled()
      expect(verifyClickSpy).toHaveBeenCalledOnce()
    })

    it('selects a dynamic required count from the objective', async () => {
      const optionNames = ['Player A', 'Player B', 'Player C', 'Player D']
      buildDialogDom({ requiredCount: 3, optionNames, maxAttempts: 3 })

      const players = createPlayersForOptions(optionNames, 'club-1', 'Club One')
      const buttons = Array.from(document.querySelectorAll('[role="dialog"] .grid button'))
      const clickSpies = buttons.map((button) => vi.spyOn(button, 'click' as never))
      const verifyButton = document.querySelector('[role="dialog"] button.w-full') as HTMLButtonElement

      const ctx = createRealWaitForElementContext()

      const solvePromise = handler.solve(players, ctx)

      setTimeout(() => {
        verifyButton.closest('[role="dialog"]')?.remove()
      }, 0)

      await solvePromise

      expect(clickSpies[0]).toHaveBeenCalledOnce()
      expect(clickSpies[1]).toHaveBeenCalledOnce()
      expect(clickSpies[2]).toHaveBeenCalledOnce()
      expect(clickSpies[3]).not.toHaveBeenCalled()
    })

    it('solves multiple rounds until all hearts are completed', async () => {
      const roundOneOptions = ['Player A', 'Player B', 'Player C', 'Player D', 'Player E']
      const roundTwoOptions = ['Player F', 'Player G', 'Player H', 'Player I', 'Player J']

      buildDialogDom({ optionNames: roundOneOptions, remainingRounds: 2 })

      const players = [
        ...createPlayersForOptions(['Player A', 'Player B', 'Player C', 'Player D'], 'club-1', 'Club One'),
        createLeagueHuman({
          full_name: 'Player E',
          club_id: 'club-2',
          club_name: 'Club Two',
          player_profile_id: 'player-e',
        }),
        ...createPlayersForOptions(['Player F', 'Player G', 'Player H', 'Player I'], 'club-3', 'Club Three'),
        createLeagueHuman({
          full_name: 'Player J',
          club_id: 'club-4',
          club_name: 'Club Four',
          player_profile_id: 'player-j',
        }),
      ]

      let verifyClickCount = 0

      vi.spyOn(dom, 'clickElement').mockImplementation((element) => {
        if ((element.textContent ?? '').toLowerCase().includes('verificar')) {
          verifyClickCount += 1
        }

        if (element instanceof HTMLElement) {
          element.click()
        }
      })

      const ctx = createRealWaitForElementContext()

      const solvePromise = handler.solve(players, ctx)

      setTimeout(() => {
        buildDialogDom({ optionNames: roundTwoOptions, remainingRounds: 1 })
      }, 0)

      setTimeout(() => {
        document.querySelector('[role="dialog"]')?.remove()
      }, 20)

      await solvePromise

      expect(verifyClickCount).toBe(2)
    })

    it('throws when no club has enough players in the visible options', async () => {
      buildDialogDom({
        optionNames: ['Player A', 'Player B', 'Player C', 'Player D'],
      })

      const players = [
        createLeagueHuman({ full_name: 'Player A', club_id: 'club-1', player_profile_id: 'p1' }),
        createLeagueHuman({ full_name: 'Player B', club_id: 'club-2', player_profile_id: 'p2' }),
        createLeagueHuman({ full_name: 'Player C', club_id: 'club-3', player_profile_id: 'p3' }),
        createLeagueHuman({ full_name: 'Player D', club_id: 'club-4', player_profile_id: 'p4' }),
      ]

      const ctx = createRealWaitForElementContext()

      await expect(handler.solve(players, ctx)).rejects.toThrow('No club with enough players in options (required: 4)')
    })

    it('retries the same group after a failed verification', async () => {
      const optionNames = ['Player A', 'Player B', 'Player C', 'Player D']
      buildDialogDom({ optionNames })

      const players = createPlayersForOptions(optionNames, 'club-1', 'Club One')
      const verifyButton = document.querySelector('[role="dialog"] button.w-full') as HTMLButtonElement
      const verifyClickSpy = vi.spyOn(verifyButton, 'click' as never)

      const ctx = createRealWaitForElementContext()

      const solvePromise = handler.solve(players, ctx)

      setTimeout(() => {
        verifyButton.textContent = 'Verificar (1/4)'
      }, 0)

      setTimeout(() => {
        verifyButton.closest('[role="dialog"]')?.remove()
      }, 20)

      await solvePromise

      expect(verifyClickSpy).toHaveBeenCalledTimes(2)
    })
  })
})
