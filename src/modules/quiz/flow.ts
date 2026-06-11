import type { QuizHandlerContext } from '~/modules/quiz/handler'
import type { QuizType } from '~/modules/quiz/types'

import { logger } from '~/modules/logger'
import { QUIZ_MODAL_TITLE_SELECTOR, QUIZ_TYPE } from '~/modules/quiz/constants'
import { getTextContent, normalizeText } from '~/modules/shared/text'

function resolveQuizTypeFromTitle(title: string): QuizType | null {
  const normalized = normalizeText(title)

  return Object.values(QUIZ_TYPE).find((quizType) => normalizeText(quizType) === normalized) ?? null
}

/**
 * Lê o título do minigame no modal para identificar o quiz type.
 * Usado quando a API é compartilhada entre vários minigames.
 */
export async function readModalQuizType(ctx: QuizHandlerContext): Promise<QuizType | null> {
  const titleElement = await ctx.waitForElement(QUIZ_MODAL_TITLE_SELECTOR)
  const title = getTextContent(titleElement)
  const quizType = resolveQuizTypeFromTitle(title)

  if (!quizType) {
    logger.error('unknown quiz title in modal', { title })
    return null
  }

  logger.info('quiz type detected from modal', { quizType, title })

  return quizType
}
