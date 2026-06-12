import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockContext } from '~tests/mocks/handler-context'
import { createLeagueHuman } from '~tests/mocks/league-human'

import * as dom from '~/modules/shared/dom'

import { QUIZ_TYPE } from '../constants'
import { QuemJogaNoClubeHandler } from './quem-joga-no-clube.handler'

function buildHearts(count: number): string {
  return Array.from({ length: count }, () => '<span class="text-pitch">♥</span>').join('')
}

function buildOptionButton(name: string): string {
  return `<button class="px-2 py-2 rounded text-xs font-medium border-2 text-left leading-tight">
    <div class="flex items-center justify-between gap-1">
      <span class="truncate">${name}</span>
    </div>
  </button>`
}

function buildDialogDom(options: {
  clubName?: string
  requiredCount?: number
  optionNames?: string[]
  markedCount?: number
  remainingRounds?: number
}) {
  const {
    clubName = 'Leichester FC',
    requiredCount = 4,
    optionNames = ['Player A', 'Player B', 'Player C', 'Player D', 'Player E'],
    markedCount = 0,
    remainingRounds = 1,
  } = options

  const optionButtons = optionNames.map((name) => buildOptionButton(name)).join('')

  document.body.innerHTML = `
    <div role="dialog">
      <h2>Quem Joga no Clube</h2>
      <div class="flex items-center justify-between text-xs">
        <span></span>
        <span>${buildHearts(remainingRounds)}</span>
      </div>
      <div class="rounded-lg border border-tactical/30 bg-tactical/5 p-3 text-center">
        <p class="text-xs text-muted-foreground uppercase tracking-wide">Marque quem joga em:</p>
        <p class="font-display font-bold text-lg">${clubName}</p>
        <p class="text-[11px] text-muted-foreground">${requiredCount} estão neste clube</p>
      </div>
      <div class="grid grid-cols-2 gap-1.5">
        ${optionButtons}
      </div>
      <button class="w-full">Confirmar (${markedCount} marcados)</button>
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

function createPlayersForClub(optionNames: string[], clubId: string, clubName: string) {
  return optionNames.map((name, index) =>
    createLeagueHuman({
      full_name: name,
      club_id: clubId,
      club_name: clubName,
      player_profile_id: `player-${index}`,
    }),
  )
}

describe('QuemJogaNoClubeHandler', () => {
  const handler = new QuemJogaNoClubeHandler()

  beforeEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
    vi.spyOn(console, 'info').mockImplementation(() => {})
  })

  it('has the quem joga no clube quiz type', () => {
    expect(handler.type).toBe(QUIZ_TYPE.QUEM_JOGA_NO_CLUBE)
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
    it('solves when the quiz has no heart counter in the dialog', async () => {
      const clubName = 'Leichester FC'
      const optionNames = ['Player A', 'Player B', 'Player C', 'Player D']
      buildDialogDom({ clubName, optionNames, remainingRounds: 0 })

      const players = createPlayersForClub(optionNames, 'club-1', clubName)
      const confirmButton = document.querySelector('[role="dialog"] button.w-full') as HTMLButtonElement
      const confirmClickSpy = vi.spyOn(confirmButton, 'click' as never)

      const ctx = createRealWaitForElementContext()

      const solvePromise = handler.solve(players, ctx)

      setTimeout(() => {
        confirmButton.closest('[role="dialog"]')?.remove()
      }, 0)

      await solvePromise

      expect(confirmClickSpy).toHaveBeenCalledOnce()
    })

    it('clicks the players from the target club and confirms', async () => {
      const clubName = 'Leichester FC'
      const optionNames = ['Player A', 'Player B', 'Player C', 'Player D', 'Player E']
      buildDialogDom({ clubName, optionNames })

      const players = [
        ...createPlayersForClub(['Player A', 'Player B', 'Player C', 'Player D'], 'club-1', clubName),
        createLeagueHuman({
          full_name: 'Player E',
          club_id: 'club-2',
          club_name: 'Other Club',
          player_profile_id: 'player-e',
        }),
      ]

      const buttons = Array.from(document.querySelectorAll('[role="dialog"] .grid button'))
      const clickSpies = buttons.map((button) => vi.spyOn(button, 'click' as never))
      const confirmButton = document.querySelector('[role="dialog"] button.w-full') as HTMLButtonElement
      const confirmClickSpy = vi.spyOn(confirmButton, 'click' as never)

      const ctx = createRealWaitForElementContext()

      const solvePromise = handler.solve(players, ctx)

      setTimeout(() => {
        confirmButton.closest('[role="dialog"]')?.remove()
      }, 0)

      await solvePromise

      expect(clickSpies[0]).toHaveBeenCalledOnce()
      expect(clickSpies[1]).toHaveBeenCalledOnce()
      expect(clickSpies[2]).toHaveBeenCalledOnce()
      expect(clickSpies[3]).toHaveBeenCalledOnce()
      expect(clickSpies[4]).not.toHaveBeenCalled()
      expect(confirmClickSpy).toHaveBeenCalledOnce()
    })

    it('selects a dynamic required count from the hint', async () => {
      const clubName = 'Leichester FC'
      const optionNames = ['Player A', 'Player B', 'Player C', 'Player D']
      buildDialogDom({ clubName, requiredCount: 3, optionNames })

      const players = createPlayersForClub(optionNames, 'club-1', clubName)
      const buttons = Array.from(document.querySelectorAll('[role="dialog"] .grid button'))
      const clickSpies = buttons.map((button) => vi.spyOn(button, 'click' as never))
      const confirmButton = document.querySelector('[role="dialog"] button.w-full') as HTMLButtonElement

      const ctx = createRealWaitForElementContext()

      const solvePromise = handler.solve(players, ctx)

      setTimeout(() => {
        confirmButton.closest('[role="dialog"]')?.remove()
      }, 0)

      await solvePromise

      expect(clickSpies[0]).toHaveBeenCalledOnce()
      expect(clickSpies[1]).toHaveBeenCalledOnce()
      expect(clickSpies[2]).toHaveBeenCalledOnce()
      expect(clickSpies[3]).not.toHaveBeenCalled()
    })

    it('solves multiple rounds until all hearts are completed', async () => {
      const clubOne = 'Leichester FC'
      const clubTwo = 'Royal Identity'
      const roundOneOptions = ['Player A', 'Player B', 'Player C', 'Player D', 'Player E']
      const roundTwoOptions = ['Player F', 'Player G', 'Player H', 'Player I', 'Player J']

      buildDialogDom({ clubName: clubOne, optionNames: roundOneOptions, remainingRounds: 2 })

      const players = [
        ...createPlayersForClub(['Player A', 'Player B', 'Player C', 'Player D'], 'club-1', clubOne),
        createLeagueHuman({
          full_name: 'Player E',
          club_id: 'club-2',
          club_name: 'Other Club',
          player_profile_id: 'player-e',
        }),
        ...createPlayersForClub(['Player F', 'Player G', 'Player H', 'Player I'], 'club-3', clubTwo),
        createLeagueHuman({
          full_name: 'Player J',
          club_id: 'club-4',
          club_name: 'Another Club',
          player_profile_id: 'player-j',
        }),
      ]

      let verifyClickCount = 0

      vi.spyOn(dom, 'clickElement').mockImplementation((element) => {
        if ((element.textContent ?? '').toLowerCase().includes('confirmar')) {
          verifyClickCount += 1
        }

        if (element instanceof HTMLElement) {
          element.click()
        }
      })

      const ctx = createRealWaitForElementContext()

      const solvePromise = handler.solve(players, ctx)

      setTimeout(() => {
        buildDialogDom({ clubName: clubTwo, optionNames: roundTwoOptions, remainingRounds: 1 })
      }, 0)

      setTimeout(() => {
        document.querySelector('[role="dialog"]')?.remove()
      }, 20)

      await solvePromise

      expect(verifyClickCount).toBe(2)
    })

    it('throws when the club does not have enough players in the visible options', async () => {
      buildDialogDom({
        clubName: 'Leichester FC',
        optionNames: ['Player A', 'Player B', 'Player C', 'Player D'],
      })

      const players = [
        createLeagueHuman({
          full_name: 'Player A',
          club_id: 'club-1',
          club_name: 'Leichester FC',
          player_profile_id: 'p1',
        }),
        createLeagueHuman({
          full_name: 'Player B',
          club_id: 'club-2',
          club_name: 'Other Club',
          player_profile_id: 'p2',
        }),
        createLeagueHuman({
          full_name: 'Player C',
          club_id: 'club-3',
          club_name: 'Another Club',
          player_profile_id: 'p3',
        }),
        createLeagueHuman({
          full_name: 'Player D',
          club_id: 'club-4',
          club_name: 'Third Club',
          player_profile_id: 'p4',
        }),
      ]

      const ctx = createRealWaitForElementContext()

      await expect(handler.solve(players, ctx)).rejects.toThrow(
        'Not enough players for club "leichester fc" in options (required: 4)',
      )
    })

    it('retries the same group after a failed confirmation', async () => {
      const clubName = 'Leichester FC'
      const optionNames = ['Player A', 'Player B', 'Player C', 'Player D']
      buildDialogDom({ clubName, optionNames })

      const players = createPlayersForClub(optionNames, 'club-1', clubName)
      const confirmButton = document.querySelector('[role="dialog"] button.w-full') as HTMLButtonElement
      const confirmClickSpy = vi.spyOn(confirmButton, 'click' as never)

      vi.spyOn(dom, 'clickElement').mockImplementation((element) => {
        if (element instanceof HTMLElement) {
          if (element.matches('[role="dialog"] .grid button')) {
            confirmButton.textContent = 'Confirmar (4 marcados)'
          }

          element.click()
        }
      })

      const ctx = createRealWaitForElementContext()

      const solvePromise = handler.solve(players, ctx)

      setTimeout(() => {
        confirmButton.textContent = 'Confirmar (0 marcados)'
      }, 0)

      setTimeout(() => {
        confirmButton.closest('[role="dialog"]')?.remove()
      }, 20)

      await solvePromise

      expect(confirmClickSpy).toHaveBeenCalledTimes(2)
    })
  })
})
