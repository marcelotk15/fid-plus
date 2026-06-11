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

  it('registers the time estadio handler', () => {
    expect(quizHandlerRegistry.getByQuizType(QUIZ_TYPE.TIME_ESTADIO)).toBeDefined()
  })

  it('registers the wordle da liga handler', () => {
    expect(quizHandlerRegistry.getByQuizType(QUIZ_TYPE.WORDLE_DA_LIGA)).toBeDefined()
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

  it('groups time estadio under the stadiums API', () => {
    const handlers = quizHandlerRegistry.getByApiType(MESSAGE_TYPE.GET_STADIUMS_FOR_MINIGAME)

    expect(handlers).toHaveLength(1)
    expect(handlers[0]?.type).toBe(QUIZ_TYPE.TIME_ESTADIO)
  })

  it('groups wordle da liga under the league humans API', () => {
    const handlers = quizHandlerRegistry.getByApiType(MESSAGE_TYPE.GET_LEAGUE_HUMANS_FOR_MINIGAME)

    expect(handlers).toHaveLength(1)
    expect(handlers[0]?.type).toBe(QUIZ_TYPE.WORDLE_DA_LIGA)
  })
})
