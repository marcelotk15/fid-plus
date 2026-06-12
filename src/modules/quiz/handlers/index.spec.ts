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

  it('registers the conexoes da liga handler', () => {
    expect(quizHandlerRegistry.getByQuizType(QUIZ_TYPE.CONEXOES_DA_LIGA)).toBeDefined()
  })

  it('registers the artilheiro da rodada handler', () => {
    expect(quizHandlerRegistry.getByQuizType(QUIZ_TYPE.ARTILHEIRO_DA_RODADA)).toBeDefined()
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

  it('groups league quizzes under the league humans API', () => {
    const handlers = quizHandlerRegistry.getByApiType(MESSAGE_TYPE.GET_LEAGUE_HUMANS_FOR_MINIGAME)

    expect(handlers).toHaveLength(2)
    expect(handlers.map((handler) => handler.type)).toEqual([QUIZ_TYPE.WORDLE_DA_LIGA, QUIZ_TYPE.CONEXOES_DA_LIGA])
  })

  it('groups artilheiro da rodada under the top scorers API', () => {
    const handlers = quizHandlerRegistry.getByApiType(MESSAGE_TYPE.GET_TOP_SCORERS_FOR_MINIGAME)

    expect(handlers).toHaveLength(1)
    expect(handlers[0]?.type).toBe(QUIZ_TYPE.ARTILHEIRO_DA_RODADA)
  })
})
