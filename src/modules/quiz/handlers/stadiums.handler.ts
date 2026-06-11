import type { QuizHandlerContext } from '~/modules/quiz/handler'
import type { StadiumForMinigame } from '~/modules/quiz/types'

import { logger } from '~/modules/logger'
import { QUIZ_TYPE } from '~/modules/quiz/constants'
import { BaseQuizHandler } from '~/modules/quiz/handler'
import { getTextContent, normalizeText } from '~/modules/shared/text'

type QuestionMode = 'clubToStadium' | 'stadiumToClub'

type Question = {
  mode: QuestionMode
  value: string
}

export class StadiumsHandler extends BaseQuizHandler<StadiumForMinigame[]> {
  readonly type = QUIZ_TYPE.TIME_ESTADIO

  private readonly dialogSelector = '[role="dialog"]'
  private readonly questionSelector = '[role="dialog"] .rounded-lg.border.p-4'
  private readonly promptSelector = '[role="dialog"] .rounded-lg.border.p-4 p.text-xs.uppercase'
  private readonly roundCounterSelector = '[role="dialog"] .flex.items-center.justify-between > span:first-child'
  private readonly optionsSelector = '[role="dialog"] .grid button'

  parsePayload(body: unknown) {
    return this.parseArrayPayload(body, this.isStadium)
  }

  async solve(data: StadiumForMinigame[], ctx: QuizHandlerContext) {
    const { current, total } = await this.readRoundCounter(ctx)

    logger.info('starting time estadio', { current, total })

    for (let round = current; round <= total; round++) {
      const question = await this.readQuestion(ctx)
      const answer = this.resolveAnswer(data, question)

      if (!answer) {
        throw new Error(this.buildNotFoundError(question))
      }

      logger.info('solving round', {
        round,
        total,
        mode: question.mode,
        questionValue: question.value,
        answer,
      })

      await this.clickOptionByText(ctx, this.optionsSelector, answer)

      if (round < total) {
        await this.waitForRoundAdvance(ctx, round, total, question.value)
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

  private async readQuestion(ctx: QuizHandlerContext): Promise<Question> {
    const questionBox = await ctx.waitForElement(this.questionSelector)
    const promptElement = await ctx.waitForElement(this.promptSelector)
    const prompt = getTextContent(promptElement)
    const mode: QuestionMode = this.isStadiumToClubPrompt(prompt) ? 'stadiumToClub' : 'clubToStadium'
    const value = this.readQuestionValueFromBox(questionBox, mode)

    if (!value) {
      throw new Error(`Question value not found in prompt: ${prompt}`)
    }

    return { mode, value }
  }

  private readQuestionValueFromBox(questionBox: Element, mode: QuestionMode): string {
    if (mode === 'stadiumToClub') {
      const stadiumElement = questionBox.querySelector(':scope > .font-display.font-semibold, :scope > p.font-display.font-semibold')

      return stadiumElement ? getTextContent(stadiumElement) : ''
    }

    const clubNameElement = questionBox.querySelector('.flex .font-display.font-semibold')

    return clubNameElement ? getTextContent(clubNameElement) : ''
  }

  private isStadiumToClubPrompt(prompt: string): boolean {
    return prompt.includes('joga neste estadio') || prompt.includes('joga neste estádio')
  }

  private resolveAnswer(stadiums: StadiumForMinigame[], question: Question): string | null {
    if (question.mode === 'clubToStadium') {
      return this.findStadiumByClub(stadiums, question.value)?.stadium_name ?? null
    }

    return this.findClubByStadium(stadiums, question.value)?.club_name ?? null
  }

  private buildNotFoundError(question: Question): string {
    if (question.mode === 'clubToStadium') {
      return `Stadium not found for club: ${question.value}`
    }

    return `Club not found for stadium: ${question.value}`
  }

  private findStadiumByClub(stadiums: StadiumForMinigame[], clubName: string): StadiumForMinigame | null {
    const normalizedClubName = normalizeText(clubName)

    return stadiums.find((stadium) => normalizeText(stadium.club_name) === normalizedClubName) ?? null
  }

  private findClubByStadium(stadiums: StadiumForMinigame[], stadiumName: string): StadiumForMinigame | null {
    const normalizedStadiumName = normalizeText(stadiumName)

    return stadiums.find((stadium) => normalizeText(stadium.stadium_name) === normalizedStadiumName) ?? null
  }

  private async waitForRoundAdvance(
    ctx: QuizHandlerContext,
    currentRound: number,
    total: number,
    previousQuestionValue: string,
  ): Promise<void> {
    const normalizedPreviousValue = normalizeText(previousQuestionValue)

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

      const readQuestionValue = () => {
        const questionBox = ctx.document.querySelector(this.questionSelector)

        if (!questionBox) return ''

        const promptElement = questionBox.querySelector('p.text-xs.uppercase')
        const prompt = promptElement ? getTextContent(promptElement) : ''
        const mode: QuestionMode = this.isStadiumToClubPrompt(prompt) ? 'stadiumToClub' : 'clubToStadium'

        return this.readQuestionValueFromBox(questionBox, mode)
      }

      const hasAdvanced = () => {
        const parsed = readCounter()

        if (parsed && parsed.current === currentRound + 1 && parsed.total === total) {
          return true
        }

        const currentValue = readQuestionValue()

        return currentValue.length > 0 && currentValue !== normalizedPreviousValue
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

  private isStadium(item: unknown): item is StadiumForMinigame {
    if (typeof item !== 'object' || item === null) return false

    const stadium = item as StadiumForMinigame

    return typeof stadium.club_name === 'string' && typeof stadium.stadium_name === 'string'
  }
}

export const stadiumsHandler = new StadiumsHandler()
