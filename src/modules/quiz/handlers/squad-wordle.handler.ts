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
    const candidates = this.findCandidatePlayers(data, hint)

    if (candidates.length === 0) {
      throw new Error(`Player not found in squad data: ${hint.position} (${hint.letterCount} letters)`)
    }

    for (const [index, player] of candidates.entries()) {
      const answer = this.getFirstName(player.full_name)

      logger.info('solving squad wordle', {
        position: hint.position,
        letterCount: hint.letterCount,
        answer,
        attempt: index + 1,
        totalCandidates: candidates.length,
      })

      await this.fillGuessInput(ctx, answer)
      await this.submitGuess(ctx)

      const result = await this.waitForGuessResult(ctx)

      if (result === 'success') return
    }

    throw new Error(`All ${candidates.length} guesses failed for ${hint.position} (${hint.letterCount} letters)`)
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

  private findCandidatePlayers(players: SquadHumanForMinigame[], hint: SquadWordleHint): SquadHumanForMinigame[] {
    const normalizedPosition = normalizeText(hint.position)

    const matches = players.filter(
      (player) =>
        normalizeText(player.primary_position) === normalizedPosition &&
        this.getFirstName(player.full_name).length === hint.letterCount,
    )

    const humans = matches.filter((player) => player.is_human)
    const nonHumans = matches.filter((player) => !player.is_human)

    return [...humans, ...nonHumans]
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

  private async waitForGuessResult(ctx: QuizHandlerContext): Promise<'success' | 'incorrect'> {
    return new Promise((resolve, reject) => {
      if (ctx.signal.aborted) {
        reject(new DOMException('Aborted', 'AbortError'))
        return
      }

      let observer: MutationObserver | undefined
      let timeoutId: ReturnType<typeof setTimeout> | undefined
      let pollId: ReturnType<typeof setInterval> | undefined
      const input = ctx.document.querySelector(this.guessInputSelector)

      const cleanup = () => {
        observer?.disconnect()
        ctx.signal.removeEventListener('abort', onAbort)

        if (input instanceof HTMLInputElement) {
          input.removeEventListener('input', check)
        }

        if (timeoutId !== undefined) {
          clearTimeout(timeoutId)
        }

        if (pollId !== undefined) {
          clearInterval(pollId)
        }
      }

      const onAbort = () => {
        cleanup()
        reject(new DOMException('Aborted', 'AbortError'))
      }

      const hasSucceeded = () => {
        const currentInput = ctx.document.querySelector(this.guessInputSelector)
        const buttons = findElementsByText(ctx.document, this.guessButtonSelector, 'Chutar')

        return !currentInput || buttons.length === 0
      }

      const isIncorrect = () => {
        const currentInput = ctx.document.querySelector(this.guessInputSelector)
        const buttons = findElementsByText(ctx.document, this.guessButtonSelector, 'Chutar')

        if (!(currentInput instanceof HTMLInputElement) || buttons.length === 0) return false

        return currentInput.value === ''
      }

      const check = () => {
        if (hasSucceeded()) {
          cleanup()
          resolve('success')
          return
        }

        if (isIncorrect()) {
          cleanup()
          resolve('incorrect')
        }
      }

      timeoutId = setTimeout(() => {
        cleanup()
        reject(new Error('Guess result timeout: input and submit button still present'))
      }, this.successTimeoutMs)

      const observeTarget = ctx.document.querySelector(this.dialogSelector) ?? ctx.document.documentElement

      observer = new MutationObserver(check)

      ctx.signal.addEventListener('abort', onAbort, { once: true })

      if (input instanceof HTMLInputElement) {
        input.addEventListener('input', check)
      }

      observer.observe(observeTarget, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
      })

      pollId = setInterval(check, 100)

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
