import type { QuizHandlerContext } from '~/modules/quiz/handler'
import type { LeagueHumanForMinigame } from '~/modules/quiz/types'

import { logger } from '~/modules/logger'
import { QUIZ_TYPE } from '~/modules/quiz/constants'
import { BaseQuizHandler } from '~/modules/quiz/handler'
import { clickElement, findElementsByText } from '~/modules/shared/dom'
import { getTextContent, normalizeText } from '~/modules/shared/text'

type AttemptState = {
  attempts: number
  maxAttempts: number
}

type RoundSnapshot = {
  optionsFingerprint: string
  remainingRounds: number
}

type VerificationResult = 'failure' | 'roundComplete' | 'quizComplete'

export class ConexoesDaLigaHandler extends BaseQuizHandler<LeagueHumanForMinigame[]> {
  readonly type = QUIZ_TYPE.CONEXOES_DA_LIGA

  private readonly dialogSelector = '[role="dialog"]'
  private readonly objectiveSelector = '[role="dialog"] span.text-muted-foreground'
  private readonly heartsSelector = '[role="dialog"] .flex.items-center.justify-between .text-pitch'
  private readonly optionsSelector = '[role="dialog"] .grid button'
  private readonly verifyButtonSelector = '[role="dialog"] button'
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
      return
    }

    const remainingRounds = await this.readRemainingRounds(ctx)

    if (remainingRounds === 0) {
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
    const requiredCount = await this.readRequiredCount(ctx)
    const optionNames = await this.readOptionNames(ctx)
    const group = this.findAnswerGroup(data, optionNames, requiredCount)

    if (!group) {
      throw new Error(`No club with enough players in options (required: ${requiredCount})`)
    }

    logger.info('solving conexoes da liga round', {
      requiredCount,
      remainingRounds: await this.readRemainingRounds(ctx),
      clubId: group[0]?.club_id,
      clubName: group[0]?.club_name,
      players: group.map((player) => player.full_name),
    })

    const playerNames = group.map((player) => player.full_name)

    while (true) {
      const snapshot = await this.readRoundSnapshot(ctx)
      const { attempts, maxAttempts } = await this.readAttemptState(ctx)

      if (attempts >= maxAttempts) {
        throw new Error('Max attempts reached')
      }

      await this.selectPlayers(ctx, playerNames)

      const attemptsBefore = attempts

      await this.clickVerify(ctx)

      const result = await this.waitForVerificationResult(ctx, attemptsBefore, snapshot)

      if (result === 'quizComplete' || result === 'roundComplete') {
        return
      }
    }
  }

  private async readRequiredCount(ctx: QuizHandlerContext): Promise<number> {
    await ctx.waitForElement(this.objectiveSelector)

    const objectiveElement = Array.from(ctx.document.querySelectorAll(this.objectiveSelector)).find((element) =>
      getTextContent(element).includes('mesmo clube'),
    )

    if (!objectiveElement) {
      throw new Error('Objective element not found in dialog')
    }

    const match = getTextContent(objectiveElement).match(/selecione\s+(\d+)\s+do\s+mesmo\s+clube/)

    if (!match) {
      throw new Error(`Invalid objective text: ${objectiveElement.textContent ?? ''}`)
    }

    const requiredCount = Number(match[1])

    if (!Number.isFinite(requiredCount) || requiredCount <= 0) {
      throw new Error(`Invalid required count: ${match[1]}`)
    }

    return requiredCount
  }

  private async readOptionNames(ctx: QuizHandlerContext): Promise<string[]> {
    await ctx.waitForElement(this.optionsSelector)

    return Array.from(ctx.document.querySelectorAll(this.optionsSelector)).map((element) => getTextContent(element))
  }

  private async readRemainingRounds(ctx: QuizHandlerContext): Promise<number> {
    await ctx.waitForElement(this.objectiveSelector)

    return ctx.document.querySelectorAll(this.heartsSelector).length
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

  private findAnswerGroup(
    players: LeagueHumanForMinigame[],
    optionNames: string[],
    requiredCount: number,
  ): LeagueHumanForMinigame[] | null {
    const normalizedOptions = new Set(optionNames.map((name) => normalizeText(name)))

    const visiblePlayers = players.filter((player) => normalizedOptions.has(normalizeText(player.full_name)))

    const byClub = new Map<string, LeagueHumanForMinigame[]>()

    for (const player of visiblePlayers) {
      const clubPlayers = byClub.get(player.club_id) ?? []

      clubPlayers.push(player)
      byClub.set(player.club_id, clubPlayers)
    }

    for (const clubPlayers of byClub.values()) {
      if (clubPlayers.length >= requiredCount) {
        return clubPlayers.slice(0, requiredCount)
      }
    }

    return null
  }

  private async selectPlayers(ctx: QuizHandlerContext, names: string[]): Promise<void> {
    for (const name of names) {
      await this.clickOptionByText(ctx, this.optionsSelector, name)
    }
  }

  private async clickVerify(ctx: QuizHandlerContext): Promise<void> {
    await ctx.waitForElement(this.verifyButtonSelector)

    const matches = findElementsByText(ctx.document, this.verifyButtonSelector, 'Verificar')

    if (matches.length === 0) {
      throw new Error('Verify button not found: Verificar')
    }

    const [button] = matches

    logger.info('clicking verify button', { text: getTextContent(button) })

    clickElement(button)
  }

  private async readAttemptState(ctx: QuizHandlerContext): Promise<AttemptState> {
    await ctx.waitForElement(this.verifyButtonSelector)

    const matches = findElementsByText(ctx.document, this.verifyButtonSelector, 'Verificar')

    if (matches.length === 0) {
      throw new Error('Verify button not found: Verificar')
    }

    const [button] = matches
    const match = getTextContent(button).match(/verificar\s*\((\d+)\/(\d+)\)/)

    if (!match) {
      throw new Error(`Invalid verify button text: ${button.textContent ?? ''}`)
    }

    const attempts = Number(match[1])
    const maxAttempts = Number(match[2])

    if (!Number.isFinite(attempts) || !Number.isFinite(maxAttempts)) {
      throw new Error(`Invalid attempt state: ${button.textContent ?? ''}`)
    }

    return { attempts, maxAttempts }
  }

  private async waitForVerificationResult(
    ctx: QuizHandlerContext,
    attemptsBefore: number,
    snapshotBefore: RoundSnapshot,
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
        const optionNames = Array.from(ctx.document.querySelectorAll(this.optionsSelector)).map((element) =>
          getTextContent(element),
        )

        return this.getOptionsFingerprint(optionNames)
      }

      const getResult = (): VerificationResult | null => {
        const dialog = ctx.document.querySelector(this.dialogSelector)
        const verifyButtons = findElementsByText(ctx.document, this.verifyButtonSelector, 'Verificar')

        if (!dialog || verifyButtons.length === 0) {
          return 'quizComplete'
        }

        const [button] = verifyButtons
        const match = getTextContent(button).match(/verificar\s*\((\d+)\/(\d+)\)/)

        if (match) {
          const attempts = Number(match[1])

          if (Number.isFinite(attempts) && attempts > attemptsBefore) {
            return 'failure'
          }
        }

        const remainingRounds = ctx.document.querySelectorAll(this.heartsSelector).length
        const optionsFingerprint = readCurrentOptionsFingerprint()

        if (remainingRounds === 0) {
          return 'quizComplete'
        }

        if (
          optionsFingerprint !== snapshotBefore.optionsFingerprint ||
          remainingRounds < snapshotBefore.remainingRounds
        ) {
          return 'roundComplete'
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

        const optionNames = Array.from(ctx.document.querySelectorAll(this.optionsSelector)).map((element) =>
          getTextContent(element),
        )
        const optionsFingerprint = this.getOptionsFingerprint(optionNames)
        const remainingRounds = ctx.document.querySelectorAll(this.heartsSelector).length

        return this.hasRoundAdvanced(previousSnapshot, {
          optionsFingerprint,
          remainingRounds,
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

export const conexoesDaLigaHandler = new ConexoesDaLigaHandler()
