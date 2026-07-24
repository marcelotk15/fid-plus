import type { QuizHandlerContext } from '~/modules/quiz/handler'
import type { SquadHumanForMinigame } from '~/modules/quiz/types'

import { logger } from '~/modules/logger'
import { QUIZ_TYPE } from '~/modules/quiz/constants'
import { BaseQuizHandler } from '~/modules/quiz/handler'
import { clickElement } from '~/modules/shared/dom'
import { getTextContent, normalizeText } from '~/modules/shared/text'

export class QualECamisaHandler extends BaseQuizHandler<SquadHumanForMinigame[]> {
  readonly type = QUIZ_TYPE.QUAL_E_A_CAMISA

  private readonly dialogSelector = '[role="dialog"]'
  private readonly questionSelector = '[role="dialog"] .rounded-lg.border.p-4'
  private readonly playerNameSelector = '[role="dialog"] .rounded-lg.border.p-4 .font-display.font-semibold'
  private readonly playerPositionSelector =
    '[role="dialog"] .rounded-lg.border.p-4 p.text-xs.text-muted-foreground:not(.uppercase)'
  private readonly roundCounterSelector = '[role="dialog"] .flex.items-center.justify-between > span:first-child'
  private readonly optionsSelector = '[role="dialog"] .grid button'

  parsePayload(body: unknown) {
    return this.parseArrayPayload(body, this.isSquadHuman)
  }

  async solve(data: SquadHumanForMinigame[], ctx: QuizHandlerContext) {
    const { current, total } = await this.readRoundCounter(ctx)

    logger.info('starting qual e a camisa', { current, total })

    for (let round = current; round <= total; round++) {
      const { name, position } = await this.readQuestion(ctx)
      const player = this.findPlayer(data, name, position)

      if (!player) {
        throw new Error(`Player not found in squad data: ${name} (${position})`)
      }

      logger.info('solving round', { round, total, name, position, jerseyNumber: player.jersey_number })

      await this.clickJerseyOption(ctx, player.jersey_number)

      if (round < total) {
        await this.waitForRoundAdvance(ctx, round, total, name)
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

  private async readQuestion(ctx: QuizHandlerContext): Promise<{ name: string; position: string }> {
    await ctx.waitForElement(this.questionSelector)

    const nameElement = await ctx.waitForElement(this.playerNameSelector)
    const positionElement = await ctx.waitForElement(this.playerPositionSelector)

    return {
      name: getTextContent(nameElement),
      position: getTextContent(positionElement),
    }
  }

  private findPlayer(players: SquadHumanForMinigame[], name: string, position: string): SquadHumanForMinigame | null {
    const normalizedName = normalizeText(name)
    const normalizedPosition = normalizeText(position)

    return (
      players.find(
        (player) =>
          normalizeText(player.full_name) === normalizedName &&
          normalizeText(player.primary_position) === normalizedPosition,
      ) ?? null
    )
  }

  private async clickJerseyOption(ctx: QuizHandlerContext, jerseyNumber: number): Promise<void> {
    const label = `#${jerseyNumber}`
    const normalizedLabel = normalizeText(label)

    await ctx.waitForElement(this.optionsSelector)

    const option = Array.from(ctx.document.querySelectorAll(this.optionsSelector)).find((element) => {
      return getTextContent(element) === normalizedLabel
    })

    if (!option) {
      throw new Error(`Jersey option not found: ${label}`)
    }

    logger.info('clicking jersey option', { label })

    clickElement(option)
  }

  private async waitForRoundAdvance(
    ctx: QuizHandlerContext,
    currentRound: number,
    total: number,
    previousPlayerName: string,
  ): Promise<void> {
    const normalizedPreviousName = normalizeText(previousPlayerName)

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

      const readPlayerName = () => {
        const nameElement = ctx.document.querySelector(this.playerNameSelector)

        if (!nameElement) return ''

        return normalizeText(getTextContent(nameElement))
      }

      const hasAdvanced = () => {
        const parsed = readCounter()

        if (parsed && parsed.current === currentRound + 1 && parsed.total === total) {
          return true
        }

        const currentName = readPlayerName()

        return currentName.length > 0 && currentName !== normalizedPreviousName
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

export const qualECamisaHandler = new QualECamisaHandler()
