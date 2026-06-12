import type { QuizHandlerContext } from '~/modules/quiz/handler'
import type { QuizType } from '~/modules/quiz/types'

import { logger } from '~/modules/logger'
import { QUIZ_MODAL_TITLE_SELECTOR, QUIZ_TYPE } from '~/modules/quiz/constants'
import { getTextContent, normalizeText } from '~/modules/shared/text'

const QUIZ_QUESTION_SELECTOR = '[role="dialog"] .rounded-lg.border.p-4'

function resolveQuizTypeFromTitle(title: string): QuizType | null {
  const normalized = normalizeText(title)

  const exact = Object.values(QUIZ_TYPE).find((quizType) => normalizeText(quizType) === normalized)

  if (exact) return exact

  return (
    Object.values(QUIZ_TYPE).find((quizType) => {
      const normalizedQuizType = normalizeText(quizType)

      return normalized.startsWith(normalizedQuizType) || normalized.includes(normalizedQuizType)
    }) ?? null
  )
}

function inferQuizTypeFromQuestion(ctx: QuizHandlerContext): QuizType | null {
  const wordleHint = Array.from(ctx.document.querySelectorAll('[role="dialog"] p.text-sm.font-medium')).find(
    (element) => getTextContent(element).includes('letras'),
  )

  if (wordleHint) {
    const hintText = getTextContent(wordleHint)
    const isLeagueWordle = /^.+?\s*·\s*[^·]+?\s*·\s*\d+\s*letras?$/i.test(hintText)

    return isLeagueWordle ? QUIZ_TYPE.WORDLE_DA_LIGA : QUIZ_TYPE.SQUAD_WORDLE
  }

  const questionBox = ctx.document.querySelector(QUIZ_QUESTION_SELECTOR)

  if (!questionBox) return null

  const uppercasePrompt = questionBox.querySelector('p.text-xs.uppercase')

  if (uppercasePrompt) {
    const prompt = getTextContent(uppercasePrompt)

    if (prompt.includes('posição')) {
      return QUIZ_TYPE.QUEM_E_QUEM
    }

    if (prompt.includes('camisa')) {
      return QUIZ_TYPE.QUAL_E_A_CAMISA
    }

    if (prompt.includes('artilheiro')) {
      return QUIZ_TYPE.ARTILHEIRO_DA_RODADA
    }
  }

  const nameLine = questionBox.querySelector('.font-display.font-semibold')
  const positionLine = questionBox.querySelector('p.text-xs.text-muted-foreground:not(.uppercase)')

  if (nameLine && positionLine && !getTextContent(nameLine).includes('#')) {
    return QUIZ_TYPE.QUAL_E_A_CAMISA
  }

  return null
}

/**
 * Lê o título do minigame no modal para identificar o quiz type.
 * Usado quando a API é compartilhada entre vários minigames.
 */
export async function readModalQuizType(ctx: QuizHandlerContext): Promise<QuizType | null> {
  const titleElement = await ctx.waitForElement(QUIZ_MODAL_TITLE_SELECTOR)
  const title = getTextContent(titleElement)
  const quizType = resolveQuizTypeFromTitle(title) ?? inferQuizTypeFromQuestion(ctx)

  if (!quizType) {
    logger.error('unknown quiz title in modal', { title })
    return null
  }

  logger.info('quiz type detected from modal', { quizType, title })

  return quizType
}
