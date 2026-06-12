import type { QuizHandlerContext } from '~/modules/quiz/handler'
import type { LeagueHumanForMinigame } from '~/modules/quiz/types'

import { logger } from '~/modules/logger'
import { QUIZ_TYPE } from '~/modules/quiz/constants'
import { BaseQuizHandler } from '~/modules/quiz/handler'
import { clickElement, findElementsByText } from '~/modules/shared/dom'
import { getTextContent, normalizeText } from '~/modules/shared/text'

type RoundSnapshot = {
  optionsFingerprint: string
  remainingRounds: number
}

type VerificationResult = 'failure' | 'roundComplete' | 'quizComplete'

const MAX_CONFIRM_RETRIES = 10

export class QuemJogaNoClubeHandler extends BaseQuizHandler<LeagueHumanForMinigame[]> {
  readonly type = QUIZ_TYPE.QUEM_JOGA_NO_CLUBE

  private readonly dialogSelector = '[role="dialog"]'
  private readonly questionBoxSelector = '[role="dialog"] .rounded-lg.border'
  private readonly heartsSelector = '[role="dialog"] .flex.items-center.justify-between .text-pitch'
  private readonly optionsSelector = '[role="dialog"] .grid button'
  private readonly optionNameSelector = 'span.truncate'
  private readonly confirmButtonSelector = '[role="dialog"] button'
  private readonly verificationTimeoutMs = 5_000

  parsePayload(body: unknown) {
    return this.parseArrayPayload(body, this.isLeagueHuman)
  }

  async solve(data: LeagueHumanForMinigame[], ctx: QuizHandlerContext) {
    await this.progress(data, ctx)
  }

  async progress(data: LeagueHumanForMinigame[], ctx: QuizHandlerContext): Promise<void> {
    const dialog = ctx.document.querySelector(this.dialogSelector)

    if (!dialog) {
      logger.info('quem joga no clube: dialog not open')
      return
    }

    if (!(await this.hasActiveQuestion(ctx))) {
      logger.info('quem joga no clube: question not visible')
      return
    }

    const remainingRounds = await this.readRemainingRounds(ctx)

    if (remainingRounds === 0) {
      logger.info('quem joga no clube: no remaining rounds')
      return
    }

    const snapshotBeforeRound = await this.readRoundSnapshot(ctx)

    await this.solveRound(data, ctx)

    const stillOpen = ctx.document.querySelector(this.dialogSelector)

    if (!stillOpen) {
      return
    }

    const newRemaining = await this.readRemainingRounds(ctx)

    if (newRemaining === 0) {
      return
    }

    const snapshotAfterRound = await this.readRoundSnapshot(ctx)

    if (this.hasRoundAdvanced(snapshotBeforeRound, snapshotAfterRound)) {
      await this.progress(data, ctx)
      return
    }

    await this.waitForRoundAdvance(ctx, snapshotBeforeRound)
    await this.progress(data, ctx)
  }

  private async solveRound(data: LeagueHumanForMinigame[], ctx: QuizHandlerContext): Promise<void> {
    const clubName = await this.readClubName(ctx)
    const requiredCount = await this.readRequiredCount(ctx)
    const optionNames = await this.readOptionNames(ctx)
    const group = this.findPlayersForClub(data, clubName, optionNames, requiredCount)

    if (!group) {
      throw new Error(`Not enough players for club "${clubName}" in options (required: ${requiredCount})`)
    }

    logger.info('solving quem joga no clube round', {
      clubName,
      requiredCount,
      remainingRounds: await this.readRemainingRounds(ctx),
      players: group.map((player) => player.full_name),
    })

    const playerNames = group.map((player) => player.full_name)
    let retries = 0

    while (true) {
      const snapshot = await this.readRoundSnapshot(ctx)

      if (retries >= MAX_CONFIRM_RETRIES) {
        throw new Error('Max confirm retries reached')
      }

      await this.selectPlayers(ctx, playerNames)

      const markedBeforeConfirm = this.readMarkedCount(ctx) ?? 0

      await this.clickConfirm(ctx)

      const result = await this.waitForVerificationResult(ctx, snapshot, markedBeforeConfirm)

      if (result === 'quizComplete' || result === 'roundComplete') {
        return
      }

      retries += 1
    }
  }

  private async readQuestionBox(ctx: QuizHandlerContext): Promise<Element> {
    await ctx.waitForElement(this.questionBoxSelector)

    const questionBox = ctx.document.querySelector(this.questionBoxSelector)

    if (!questionBox) {
      throw new Error('Question box not found in dialog')
    }

    return questionBox
  }

  private async readClubName(ctx: QuizHandlerContext): Promise<string> {
    const questionBox = await this.readQuestionBox(ctx)
    const clubElement = questionBox.querySelector('.font-display.font-bold')

    if (!clubElement) {
      throw new Error('Club name element not found in dialog')
    }

    const clubName = getTextContent(clubElement)

    if (!clubName) {
      throw new Error('Club name is empty')
    }

    return clubName
  }

  private async readRequiredCount(ctx: QuizHandlerContext): Promise<number> {
    const questionBox = await this.readQuestionBox(ctx)
    const hintText = getTextContent(questionBox)
    const match = hintText.match(/(\d+)\s+est[aã]o\s+neste\s+clube/i)

    if (match) {
      const requiredCount = Number(match[1])

      if (Number.isFinite(requiredCount) && requiredCount > 0) {
        return requiredCount
      }

      throw new Error(`Invalid required count: ${match[1]}`)
    }

    throw new Error('Required count hint not found in dialog')
  }

  private async readOptionNames(ctx: QuizHandlerContext): Promise<string[]> {
    await ctx.waitForElement(this.optionsSelector)

    return Array.from(ctx.document.querySelectorAll(this.optionsSelector)).map((element) => {
      const nameElement = element.querySelector(this.optionNameSelector)

      return nameElement ? getTextContent(nameElement) : getTextContent(element)
    })
  }

  private countHearts(ctx: QuizHandlerContext): number {
    return ctx.document.querySelectorAll(this.heartsSelector).length
  }

  private async hasActiveQuestion(ctx: QuizHandlerContext): Promise<boolean> {
    try {
      await ctx.waitForElement(this.questionBoxSelector)
    } catch {
      return false
    }

    return Boolean(ctx.document.querySelector(this.questionBoxSelector))
  }

  private async readRemainingRounds(ctx: QuizHandlerContext): Promise<number> {
    await ctx.waitForElement(this.questionBoxSelector)

    const hearts = this.countHearts(ctx)

    if (hearts > 0) {
      return hearts
    }

    return (await this.hasActiveQuestion(ctx)) ? 1 : 0
  }

  private async readRoundSnapshot(ctx: QuizHandlerContext): Promise<RoundSnapshot> {
    const optionNames = await this.readOptionNames(ctx)

    return {
      optionsFingerprint: this.getOptionsFingerprint(optionNames),
      remainingRounds: await this.readRemainingRounds(ctx),
    }
  }

  private getOptionsFingerprint(optionNames: string[]): string {
    return [...optionNames].sort().join('|')
  }

  private hasRoundAdvanced(before: RoundSnapshot, after: RoundSnapshot): boolean {
    return after.optionsFingerprint !== before.optionsFingerprint || after.remainingRounds < before.remainingRounds
  }

  private findPlayersForClub(
    players: LeagueHumanForMinigame[],
    clubName: string,
    optionNames: string[],
    requiredCount: number,
  ): LeagueHumanForMinigame[] | null {
    const normalizedClub = normalizeText(clubName)
    const normalizedOptions = new Set(optionNames.map((name) => normalizeText(name)))

    const clubPlayers = players.filter(
      (player) =>
        normalizeText(player.club_name) === normalizedClub && normalizedOptions.has(normalizeText(player.full_name)),
    )

    if (clubPlayers.length < requiredCount) {
      return null
    }

    return clubPlayers.slice(0, requiredCount)
  }

  private async selectPlayers(ctx: QuizHandlerContext, names: string[]): Promise<void> {
    for (const name of names) {
      await this.clickOptionByText(ctx, this.optionsSelector, name)
    }
  }

  private async clickConfirm(ctx: QuizHandlerContext): Promise<void> {
    await ctx.waitForElement(this.confirmButtonSelector)

    const matches = findElementsByText(ctx.document, this.confirmButtonSelector, 'Confirmar')

    if (matches.length === 0) {
      throw new Error('Confirm button not found: Confirmar')
    }

    const [button] = matches

    logger.info('clicking confirm button', { text: getTextContent(button) })

    clickElement(button)
  }

  private readMarkedCount(ctx: QuizHandlerContext): number | null {
    const matches = findElementsByText(ctx.document, this.confirmButtonSelector, 'Confirmar')

    if (matches.length === 0) {
      return null
    }

    const [button] = matches
    const match = getTextContent(button).match(/confirmar\s*\((\d+)\s+marcados?\)/)

    if (!match) {
      return null
    }

    const markedCount = Number(match[1])

    return Number.isFinite(markedCount) ? markedCount : null
  }

  private async waitForVerificationResult(
    ctx: QuizHandlerContext,
    snapshotBefore: RoundSnapshot,
    markedCountBeforeConfirm: number,
  ): Promise<VerificationResult> {
    return new Promise((resolve, reject) => {
      if (ctx.signal.aborted) {
        reject(new DOMException('Aborted', 'AbortError'))
        return
      }

      let observer: MutationObserver | undefined
      let timeoutId: ReturnType<typeof setTimeout> | undefined

      const cleanup = () => {
        observer?.disconnect()
        ctx.signal.removeEventListener('abort', onAbort)

        if (timeoutId !== undefined) {
          clearTimeout(timeoutId)
        }
      }

      const onAbort = () => {
        cleanup()
        reject(new DOMException('Aborted', 'AbortError'))
      }

      const readCurrentOptionsFingerprint = () => {
        const optionNames = Array.from(ctx.document.querySelectorAll(this.optionsSelector)).map((element) => {
          const nameElement = element.querySelector(this.optionNameSelector)

          return nameElement ? getTextContent(nameElement) : getTextContent(element)
        })

        return this.getOptionsFingerprint(optionNames)
      }

      const getResult = (): VerificationResult | null => {
        const dialog = ctx.document.querySelector(this.dialogSelector)
        const confirmButtons = findElementsByText(ctx.document, this.confirmButtonSelector, 'Confirmar')

        if (!dialog || confirmButtons.length === 0) {
          return 'quizComplete'
        }

        const hearts = ctx.document.querySelectorAll(this.heartsSelector).length
        const optionsFingerprint = readCurrentOptionsFingerprint()

        if (
          optionsFingerprint !== snapshotBefore.optionsFingerprint ||
          (hearts > 0 && hearts < snapshotBefore.remainingRounds)
        ) {
          return 'roundComplete'
        }

        const markedCount = this.readMarkedCount(ctx)

        if (markedCountBeforeConfirm > 0 && markedCount === 0) {
          return 'failure'
        }

        return null
      }

      const check = () => {
        const result = getResult()

        if (result) {
          cleanup()
          resolve(result)
        }
      }

      timeoutId = setTimeout(() => {
        cleanup()
        reject(new Error('Verification result timeout'))
      }, this.verificationTimeoutMs)

      observer = new MutationObserver(check)

      ctx.signal.addEventListener('abort', onAbort, { once: true })

      observer.observe(ctx.document.documentElement, {
        childList: true,
        subtree: true,
        characterData: true,
      })

      check()
    })
  }

  private async waitForRoundAdvance(ctx: QuizHandlerContext, previousSnapshot: RoundSnapshot): Promise<void> {
    return new Promise((resolve, reject) => {
      if (ctx.signal.aborted) {
        reject(new DOMException('Aborted', 'AbortError'))
        return
      }

      let observer: MutationObserver | undefined

      const cleanup = () => {
        observer?.disconnect()
        ctx.signal.removeEventListener('abort', onAbort)
      }

      const onAbort = () => {
        cleanup()
        reject(new DOMException('Aborted', 'AbortError'))
      }

      const hasAdvanced = () => {
        const dialog = ctx.document.querySelector(this.dialogSelector)

        if (!dialog) {
          return true
        }

        const optionNames = Array.from(ctx.document.querySelectorAll(this.optionsSelector)).map((element) => {
          const nameElement = element.querySelector(this.optionNameSelector)

          return nameElement ? getTextContent(nameElement) : getTextContent(element)
        })
        const optionsFingerprint = this.getOptionsFingerprint(optionNames)
        const hearts = this.countHearts(ctx)

        return this.hasRoundAdvanced(previousSnapshot, {
          optionsFingerprint,
          remainingRounds: hearts > 0 ? hearts : previousSnapshot.remainingRounds,
        })
      }

      const check = () => {
        if (hasAdvanced()) {
          cleanup()
          resolve()
        }
      }

      observer = new MutationObserver(check)

      ctx.signal.addEventListener('abort', onAbort, { once: true })

      observer.observe(ctx.document.documentElement, {
        childList: true,
        subtree: true,
        characterData: true,
      })

      check()
    })
  }

  private isLeagueHuman(item: unknown): item is LeagueHumanForMinigame {
    if (typeof item !== 'object' || item === null) return false

    const player = item as LeagueHumanForMinigame

    return (
      typeof player.full_name === 'string' &&
      typeof player.club_id === 'string' &&
      typeof player.club_name === 'string' &&
      typeof player.is_human === 'boolean' &&
      typeof player.player_profile_id === 'string'
    )
  }
}

export const quemJogaNoClubeHandler = new QuemJogaNoClubeHandler()
