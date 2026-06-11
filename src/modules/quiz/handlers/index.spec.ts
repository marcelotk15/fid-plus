import { describe, expect, it } from 'vitest'

import { MESSAGE_TYPE } from '~/modules/shared/consts'

import { QUIZ_TYPE } from '../constants'
import { QuizHandlerRegistry } from '../registry'
import { quizHandlerRegistry } from './index'

describe('quizHandlerRegistry', () => {
  it('is an instance of QuizHandlerRegistry', () => {
    expect(quizHandlerRegistry).toBeInstanceOf(QuizHandlerRegistry)
  })

  it('registers known handlers by quiz type', () => {
    expect(quizHandlerRegistry.getByQuizType(QUIZ_TYPE.QUEM_E_QUEM)).toBeDefined()
    expect(quizHandlerRegistry.getByQuizType(QUIZ_TYPE.SQUAD_WORDLE)).toBeDefined()
  })

  it('groups handlers that share the same API', () => {
    const handlers = quizHandlerRegistry.getByApiType(MESSAGE_TYPE.GET_SQUAD_HUMANS_FOR_MINIGAME)

    expect(handlers.length).toBeGreaterThanOrEqual(3)
  })
})
