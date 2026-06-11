import type { QuizHandlerContext } from '~/modules/quiz/handler'
import type { SquadHumanForMinigame } from '~/modules/quiz/types'

import { logger } from '~/modules/logger'
import { QUIZ_TYPE } from '~/modules/quiz/constants'
import { BaseQuizHandler } from '~/modules/quiz/handler'
import { clickElement, findElementsByText } from '~/modules/shared/dom'
import { getTextContent, normalizeText } from '~/modules/shared/text'

type SquadWordleHint = {
  position: string
  letterCount: number
}

export class SquadWordleHandler extends BaseQuizHandler<SquadHumanForMinigame[]> {
  readonly type = QUIZ_TYPE.SQUAD_WORDLE

  private readonly dialogSelector = '[role="dialog"]'
  private readonly hintSelector = '[role="dialog"] p.text-sm.font-medium'
  private readonly guessInputSelector = '[role="dialog"] input'
  private readonly guessButtonSelector = '[role="dialog"] button'
  private readonly successTimeoutMs = 5_000

  parsePayload(body: unknown) {
    return this.parseArrayPayload(body, this.isSquadHuman)
  }

  async solve(data: SquadHumanForMinigame[], ctx: QuizHandlerContext) {
    const hint = await this.readHint(ctx)
    const player = this.findTargetPlayer(data, hint)

    if (!player) {
      throw new Error(`Player not found in squad data: ${hint.position} (${hint.letterCount} letters)`)
    }

    const answer = this.getFirstName(player.full_name)

    logger.info('solving squad wordle', {
      position: hint.position,
      letterCount: hint.letterCount,
      answer,
    })

    await this.fillGuessInput(ctx, answer)
    await this.submitGuess(ctx)
    await this.waitForGuessSuccess(ctx)
  }

  private async readHint(ctx: QuizHandlerContext): Promise<SquadWordleHint> {
    await ctx.waitForElement(this.hintSelector)

    const hintElement = Array.from(ctx.document.querySelectorAll(this.hintSelector)).find((element) =>
      getTextContent(element).includes('letras'),
    )

    if (!hintElement) {
      throw new Error('Hint element not found in dialog')
    }

    const parsed = this.parseHintText(getTextContent(hintElement))

    if (!parsed) {
      throw new Error(`Invalid hint text: ${hintElement.textContent ?? ''}`)
    }

    return parsed
  }

  private parseHintText(text: string): SquadWordleHint | null {
    const match = text.match(/^(.+?)\s*·\s*(\d+)\s*letras?$/i)

    if (!match) return null

    const letterCount = Number(match[2])

    if (!Number.isFinite(letterCount) || letterCount <= 0) return null

    return {
      position: match[1].trim(),
      letterCount,
    }
  }

  private getFirstName(fullName: string): string {
    return fullName.split(/\s+/)[0] ?? fullName
  }

  private findTargetPlayer(players: SquadHumanForMinigame[], hint: SquadWordleHint): SquadHumanForMinigame | null {
    const normalizedPosition = normalizeText(hint.position)

    const matches = players.filter(
      (player) =>
        normalizeText(player.primary_position) === normalizedPosition &&
        this.getFirstName(player.full_name).length === hint.letterCount,
    )

    if (matches.length === 0) return null

    return matches.find((player) => player.is_human) ?? matches[0]
  }

  private async fillGuessInput(ctx: QuizHandlerContext, answer: string): Promise<void> {
    const input = await ctx.waitForElement(this.guessInputSelector)

    if (!(input instanceof HTMLInputElement)) {
      throw new Error('Guess input is not an HTMLInputElement')
    }

    const value = answer.toUpperCase()

    input.value = value
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('change', { bubbles: true }))

    logger.info('filled guess input', { value })
  }

  private async submitGuess(ctx: QuizHandlerContext): Promise<void> {
    await ctx.waitForElement(this.guessButtonSelector)

    const matches = findElementsByText(ctx.document, this.guessButtonSelector, 'Chutar')

    if (matches.length === 0) {
      throw new Error('Guess button not found: Chutar')
    }

    const [button] = matches

    logger.info('clicking guess button')

    clickElement(button)
  }

  private async waitForGuessSuccess(ctx: QuizHandlerContext): Promise<void> {
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

      const hasSucceeded = () => {
        const input = ctx.document.querySelector(this.guessInputSelector)
        const buttons = findElementsByText(ctx.document, this.guessButtonSelector, 'Chutar')

        return !input || buttons.length === 0
      }

      const check = () => {
        if (hasSucceeded()) {
          cleanup()
          resolve()
        }
      }

      timeoutId = setTimeout(() => {
        cleanup()
        reject(new Error('Guess success timeout: input and submit button still present'))
      }, this.successTimeoutMs)

      const observeTarget = ctx.document.querySelector(this.dialogSelector) ?? ctx.document.documentElement

      observer = new MutationObserver(check)

      ctx.signal.addEventListener('abort', onAbort, { once: true })

      observer.observe(observeTarget, {
        childList: true,
        subtree: true,
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
      typeof player.is_human === 'boolean' &&
      typeof player.player_profile_id === 'string'
    )
  }
}

export const squadWordleHandler = new SquadWordleHandler()
