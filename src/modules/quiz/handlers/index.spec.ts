import { describe, expect, it } from 'vitest'

import { MESSAGE_TYPE } from '~/modules/shared/consts'

import { QUIZ_TYPE } from '../constants'
import { QuizHandlerRegistry } from '../registry'
import { quizHandlerRegistry } from './index'

describe('quizHandlerRegistry', () => {
  it('is an instance of QuizHandlerRegistry', () => {
    expect(quizHandlerRegistry).toBeInstanceOf(QuizHandlerRegistry)
  })

  it('registers the qual e a camisa handler', () => {
    expect(quizHandlerRegistry.getByQuizType(QUIZ_TYPE.QUAL_E_A_CAMISA)).toBeDefined()
  })

  it('registers the quem e quem handler', () => {
    expect(quizHandlerRegistry.getByQuizType(QUIZ_TYPE.QUEM_E_QUEM)).toBeDefined()
  })

  it('registers the squad wordle handler', () => {
    expect(quizHandlerRegistry.getByQuizType(QUIZ_TYPE.SQUAD_WORDLE)).toBeDefined()
  })

  it('groups squad quizzes under the squad humans API', () => {
    const handlers = quizHandlerRegistry.getByApiType(MESSAGE_TYPE.GET_SQUAD_HUMANS_FOR_MINIGAME)

    expect(handlers).toHaveLength(3)
    expect(handlers.map((handler) => handler.type)).toEqual([
      QUIZ_TYPE.QUAL_E_A_CAMISA,
      QUIZ_TYPE.QUEM_E_QUEM,
      QUIZ_TYPE.SQUAD_WORDLE,
    ])
  })
})
