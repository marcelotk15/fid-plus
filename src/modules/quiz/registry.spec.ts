import { describe, expect, it, vi } from 'vitest'
import { createMockHandler } from '~tests/mocks/quiz-handler'

import { MESSAGE_TYPE } from '~/modules/shared/consts'

import { QUIZ_TYPE } from './constants'
import { QuizHandlerRegistry } from './registry'

const quizRoute = { href: 'https://footballidentity.org/player/quiz', pathname: '/player/quiz', search: '' }
const homeRoute = { href: 'https://footballidentity.org/player', pathname: '/player', search: '' }

describe('QuizHandlerRegistry', () => {
  it('returns handler by quiz type', () => {
    const handler = createMockHandler({ type: QUIZ_TYPE.QUEM_E_QUEM })
    const registry = new QuizHandlerRegistry([handler])

    expect(registry.getByQuizType(QUIZ_TYPE.QUEM_E_QUEM)).toBe(handler)
  })

  it('returns handlers by api type', () => {
    const quemEQuem = createMockHandler({ type: QUIZ_TYPE.QUEM_E_QUEM })
    const squadWordle = createMockHandler({ type: QUIZ_TYPE.SQUAD_WORDLE })
    const registry = new QuizHandlerRegistry([quemEQuem, squadWordle])

    const handlers = registry.getByApiType(MESSAGE_TYPE.GET_SQUAD_HUMANS_FOR_MINIGAME)

    expect(handlers).toHaveLength(2)
    expect(handlers).toContain(quemEQuem)
    expect(handlers).toContain(squadWordle)
  })

  it('resolves handler by activeQuizType when API is compatible', () => {
    const quemEQuem = createMockHandler({ type: QUIZ_TYPE.QUEM_E_QUEM })
    const squadWordle = createMockHandler({ type: QUIZ_TYPE.SQUAD_WORDLE })
    const registry = new QuizHandlerRegistry([quemEQuem, squadWordle])

    const resolved = registry.resolve(MESSAGE_TYPE.GET_SQUAD_HUMANS_FOR_MINIGAME, quizRoute, QUIZ_TYPE.QUEM_E_QUEM)

    expect(resolved).toBe(quemEQuem)
  })

  it('returns null when multiple candidates share the API and quiz type is unknown', () => {
    const matchesRoute = createMockHandler({
      type: QUIZ_TYPE.SQUAD_WORDLE,
      matchesRoute: vi.fn((route) => route.pathname.startsWith('/player/quiz')),
    })
    const noMatch = createMockHandler({
      type: QUIZ_TYPE.QUEM_E_QUEM,
      matchesRoute: vi.fn(() => false),
    })
    const registry = new QuizHandlerRegistry([noMatch, matchesRoute])

    const resolved = registry.resolve(MESSAGE_TYPE.GET_SQUAD_HUMANS_FOR_MINIGAME, quizRoute)

    expect(resolved).toBeNull()
  })

  it('returns null when there are no candidates', () => {
    const registry = new QuizHandlerRegistry([])

    expect(registry.resolve(MESSAGE_TYPE.GET_STADIUMS_FOR_MINIGAME, quizRoute)).toBeNull()
  })

  it('resolves wordle da liga by activeQuizType with league humans API', () => {
    const wordleHandler = createMockHandler({ type: QUIZ_TYPE.WORDLE_DA_LIGA })
    const registry = new QuizHandlerRegistry([wordleHandler])

    const resolved = registry.resolve(MESSAGE_TYPE.GET_LEAGUE_HUMANS_FOR_MINIGAME, quizRoute, QUIZ_TYPE.WORDLE_DA_LIGA)

    expect(resolved).toBe(wordleHandler)
  })

  it('returns null when multiple candidates share the API and quiz type is unknown', () => {
    const first = createMockHandler({
      type: QUIZ_TYPE.QUEM_E_QUEM,
      matchesRoute: vi.fn(() => false),
    })
    const second = createMockHandler({
      type: QUIZ_TYPE.SQUAD_WORDLE,
      matchesRoute: vi.fn(() => false),
    })
    const registry = new QuizHandlerRegistry([first, second])

    const resolved = registry.resolve(MESSAGE_TYPE.GET_SQUAD_HUMANS_FOR_MINIGAME, homeRoute)

    expect(resolved).toBeNull()
  })
})
