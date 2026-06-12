import type { QuizHandlerContext } from '~/modules/quiz/handler'
import type { TopScorerForMinigame } from '~/modules/quiz/types'

import { logger } from '~/modules/logger'
import { QUIZ_TYPE } from '~/modules/quiz/constants'
import { BaseQuizHandler } from '~/modules/quiz/handler'
import { getTextContent } from '~/modules/shared/text'

type RoundQuestion = {
  roundNumber: number
  seasonNumber: number
}

export class TopScorersHandler extends BaseQuizHandler<TopScorerForMinigame[]> {
  readonly type = QUIZ_TYPE.ARTILHEIRO_DA_RODADA

  private readonly dialogSelector = '[role="dialog"]'
  private readonly questionSelector = '[role="dialog"] .rounded-lg.border.p-4'
  private readonly roundLineSelector = '[role="dialog"] .rounded-lg.border.p-4 .font-display.font-semibold'
  private readonly roundCounterSelector = '[role="dialog"] .flex.items-center.justify-between > span:first-child'
  private readonly optionsSelector = '[role="dialog"] .space-y-2 button'

  private readonly roundDataCache = new Map<string, TopScorerForMinigame[]>()

  parsePayload(body: unknown) {
    return this.parseArrayPayload(body, this.isTopScorer)
  }

  storePayload(data: TopScorerForMinigame[]): void {
    const [first] = data

    if (!first) return

    const key = this.getCacheKey(first.season_number, first.round_number)

    this.roundDataCache.set(key, data)

    logger.info('cached top scorers round', { key, players: data.length })
  }

  async solve(data: TopScorerForMinigame[], ctx: QuizHandlerContext) {
    this.storePayload(data)
    await this.progress(ctx)
  }

  async progress(ctx: QuizHandlerContext): Promise<void> {
    const { current, total } = await this.readRoundCounter(ctx)
    const question = await this.readQuestion(ctx)
    const key = this.getCacheKey(question.seasonNumber, question.roundNumber)
    const cached = this.roundDataCache.get(key)

    if (!cached) {
      logger.info('round data not cached yet', {
        key,
        cachedKeys: [...this.roundDataCache.keys()],
      })

      return
    }

    const topScorer = this.getTopScorer(cached)

    if (!topScorer) {
      throw new Error(`No top scorer data found for round ${question.roundNumber} · T${question.seasonNumber}`)
    }

    logger.info('solving artilheiro round', {
      key,
      current,
      total,
      roundNumber: question.roundNumber,
      seasonNumber: question.seasonNumber,
      topScorer: topScorer.full_name,
      totalGoals: topScorer.total_goals,
    })

    await this.clickOptionByText(ctx, this.optionsSelector, topScorer.full_name)

    if (current >= total) {
      logger.info('artilheiro quiz complete, clearing cache')
      this.roundDataCache.clear()
      return
    }

    await this.waitForRoundAdvance(ctx, current, total, question)
    await this.progress(ctx)
  }

  private getCacheKey(seasonNumber: number, roundNumber: number): string {
    return `${seasonNumber}_${roundNumber}`
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

  private async readQuestion(ctx: QuizHandlerContext): Promise<RoundQuestion> {
    await ctx.waitForElement(this.questionSelector)

    const lineElement = await ctx.waitForElement(this.roundLineSelector)
    const parsed = this.parseRoundLineText(getTextContent(lineElement))

    if (!parsed) {
      throw new Error(`Invalid round line: ${getTextContent(lineElement)}`)
    }

    return parsed
  }

  private parseRoundLineText(text: string): RoundQuestion | null {
    const match = text.match(/Rodada\s+(\d+)\s*·\s*T(\d+)/i)

    if (!match) return null

    return {
      roundNumber: Number(match[1]),
      seasonNumber: Number(match[2]),
    }
  }

  private getTopScorer(scorers: TopScorerForMinigame[]): TopScorerForMinigame | null {
    if (scorers.length === 0) return null

    return scorers.reduce((top, current) => (current.total_goals > top.total_goals ? current : top))
  }

  private questionKey(question: RoundQuestion): string {
    return this.getCacheKey(question.seasonNumber, question.roundNumber)
  }

  private async waitForRoundAdvance(
    ctx: QuizHandlerContext,
    currentRound: number,
    total: number,
    previousQuestion: RoundQuestion,
  ): Promise<void> {
    const previousKey = this.questionKey(previousQuestion)

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

      const readQuestionKey = () => {
        const lineElement = ctx.document.querySelector(this.roundLineSelector)

        if (!lineElement) return ''

        const parsed = this.parseRoundLineText(getTextContent(lineElement))

        return parsed ? this.questionKey(parsed) : ''
      }

      const hasAdvanced = () => {
        const parsed = readCounter()

        if (parsed && parsed.current === currentRound + 1 && parsed.total === total) {
          return true
        }

        const currentKey = readQuestionKey()

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

  private isTopScorer(item: unknown): item is TopScorerForMinigame {
    if (typeof item !== 'object' || item === null) return false

    const scorer = item as TopScorerForMinigame

    return (
      typeof scorer.full_name === 'string' &&
      typeof scorer.total_goals === 'number' &&
      typeof scorer.round_number === 'number' &&
      typeof scorer.season_number === 'number' &&
      typeof scorer.is_human === 'boolean' &&
      typeof scorer.player_profile_id === 'string'
    )
  }
}

export const topScorersHandler = new TopScorersHandler()
