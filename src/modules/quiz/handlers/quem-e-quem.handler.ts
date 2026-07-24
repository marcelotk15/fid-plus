import type { QuizHandlerContext } from '~/modules/quiz/handler'
import type { SquadHumanForMinigame } from '~/modules/quiz/types'

import { logger } from '~/modules/logger'
import { QUIZ_TYPE } from '~/modules/quiz/constants'
import { BaseQuizHandler } from '~/modules/quiz/handler'
import { getTextContent, normalizeText } from '~/modules/shared/text'

export class QuemEQuemHandler extends BaseQuizHandler<SquadHumanForMinigame[]> {
  readonly type = QUIZ_TYPE.QUEM_E_QUEM

  private readonly dialogSelector = '[role="dialog"]'
  private readonly questionSelector = '[role="dialog"] .rounded-lg.border.p-4'
  private readonly playerLineSelector = '[role="dialog"] .rounded-lg.border.p-4 .font-display.font-semibold'
  private readonly roundCounterSelector = '[role="dialog"] .flex.items-center.justify-between > span:first-child'
  private readonly optionsSelector = '[role="dialog"] .grid button'

  parsePayload(body: unknown) {
    return this.parseArrayPayload(body, this.isSquadHuman)
  }

  async solve(data: SquadHumanForMinigame[], ctx: QuizHandlerContext) {
    const { current, total } = await this.readRoundCounter(ctx)

    logger.info('starting quem e quem', { current, total })

    for (let round = current; round <= total; round++) {
      const { name, jerseyNumber } = await this.readQuestion(ctx)
      const player = this.findPlayer(data, name, jerseyNumber)

      if (!player) {
        throw new Error(`Player not found in squad data: ${name} (#${jerseyNumber})`)
      }

      logger.info('solving round', { round, total, name, jerseyNumber, position: player.primary_position })

      await this.clickOptionByText(ctx, this.optionsSelector, player.primary_position)

      if (round < total) {
        await this.waitForRoundAdvance(ctx, round, total, name, jerseyNumber)
      }
    }
  }

  private async readRoundCounter(ctx: QuizHandlerContext): Promise<{ current: number; total: number }> {
    const counterElement = await ctx.waitForElement(this.roundCounterSelector)
    const parsed = this.parseRoundCounterText(getTextContent(counterElement))

    if (!parsed) {
      throw new Error(`Invalid round counter: ${getTextContent(counterElement)}`)
    }

    return parsed
  }

  private parseRoundCounterText(text: string): { current: number; total: number } | null {
    const match = text.match(/(\d+)\s*\/\s*(\d+)/)

    if (!match) return null

    return {
      current: Number(match[1]),
      total: Number(match[2]),
    }
  }

  private async readQuestion(ctx: QuizHandlerContext): Promise<{ name: string; jerseyNumber: number }> {
    await ctx.waitForElement(this.questionSelector)

    const lineElement = await ctx.waitForElement(this.playerLineSelector)
    const lineText = getTextContent(lineElement)
    const jerseyMatch = lineText.match(/#(\d+)/)

    if (!jerseyMatch) {
      throw new Error(`Jersey number not found in question: ${lineText}`)
    }

    const name = lineText.split('#')[0]?.trim() ?? ''
    const jerseyNumber = Number(jerseyMatch[1])

    return { name, jerseyNumber }
  }

  private findPlayer(
    players: SquadHumanForMinigame[],
    name: string,
    jerseyNumber: number,
  ): SquadHumanForMinigame | null {
    const normalizedName = normalizeText(name)

    return (
      players.find(
        (player) => normalizeText(player.full_name) === normalizedName && player.jersey_number === jerseyNumber,
      ) ?? null
    )
  }

  private playerKey(name: string, jerseyNumber: number): string {
    return `${normalizeText(name)}#${jerseyNumber}`
  }

  private async waitForRoundAdvance(
    ctx: QuizHandlerContext,
    currentRound: number,
    total: number,
    previousPlayerName: string,
    previousJerseyNumber: number,
  ): Promise<void> {
    const previousKey = this.playerKey(previousPlayerName, previousJerseyNumber)

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

      const readCounter = () => {
        const counterElement = ctx.document.querySelector(this.roundCounterSelector)

        if (!counterElement) return null

        return this.parseRoundCounterText(getTextContent(counterElement))
      }

      const readPlayerKey = () => {
        const lineElement = ctx.document.querySelector(this.playerLineSelector)

        if (!lineElement) return ''

        const lineText = getTextContent(lineElement)
        const jerseyMatch = lineText.match(/#(\d+)/)

        if (!jerseyMatch) return ''

        const name = lineText.split('#')[0]?.trim() ?? ''

        return this.playerKey(name, Number(jerseyMatch[1]))
      }

      const hasAdvanced = () => {
        const parsed = readCounter()

        if (parsed && parsed.current === currentRound + 1 && parsed.total === total) {
          return true
        }

        const currentKey = readPlayerKey()

        return currentKey.length > 0 && currentKey !== previousKey
      }

      const check = () => {
        if (hasAdvanced()) {
          cleanup()
          resolve()
        }
      }

      const observeTarget = ctx.document.querySelector(this.dialogSelector) ?? ctx.document.documentElement

      observer = new MutationObserver(check)

      ctx.signal.addEventListener('abort', onAbort, { once: true })

      observer.observe(observeTarget, {
        childList: true,
        subtree: true,
        characterData: true,
      })

      check()
    })
  }

  private isSquadHuman(item: unknown): item is SquadHumanForMinigame {
    if (typeof item !== 'object' || item === null) return false

    const player = item as SquadHumanForMinigame

    return (
      typeof player.full_name === 'string' &&
      typeof player.primary_position === 'string' &&
      typeof player.jersey_number === 'number' &&
      typeof player.player_profile_id === 'string'
    )
  }
}

export const quemEQuemHandler = new QuemEQuemHandler()
