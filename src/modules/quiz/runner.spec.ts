import { beforeEach, describe, expect, it, vi } from 'vitest'
import { waitForAssertion } from '~tests/helpers/wait-for'
import { createMockHandler } from '~tests/mocks/quiz-handler'

import { MESSAGE_SOURCE, MESSAGE_TYPE } from '~/modules/shared/consts'

import { QUIZ_TYPE } from './constants'
import { QuizHandlerRegistry } from './registry'
import { QuizRunner } from './runner'

vi.mock('~/modules/quiz/flow', () => ({
  readModalQuizType: vi.fn(),
}))

vi.mock('~/modules/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}))

import { readModalQuizType } from '~/modules/quiz/flow'

const quizRoute = {
  href: 'https://footballidentity.org/player/quiz',
  pathname: '/player/quiz',
  search: '',
}

function createQuizMessage(
  overrides: {
    source?: string
    type?: string | null
    status?: number
    body?: unknown
  } = {},
) {
  return new MessageEvent('message', {
    data: {
      source: overrides.source ?? MESSAGE_SOURCE.QUIZ_CONTENT,
      type: overrides.type ?? MESSAGE_TYPE.GET_SQUAD_HUMANS_FOR_MINIGAME,
      payload: {
        status: overrides.status ?? 200,
        body: overrides.body ?? [{ id: '1' }],
      },
    },
    source: window,
  })
}

describe('QuizRunner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(readModalQuizType as ReturnType<typeof vi.fn>).mockResolvedValue(QUIZ_TYPE.QUEM_E_QUEM)
  })

  it('does not process messages before entering quiz route', async () => {
    const handler = createMockHandler({ type: QUIZ_TYPE.QUEM_E_QUEM })
    const runner = new QuizRunner(new QuizHandlerRegistry([handler]))

    runner.onQuizData(createQuizMessage())

    await waitForAssertion(() => {
      expect(handler.solve).not.toHaveBeenCalled()
    })
  })

  it('resets state when leaving quiz route', async () => {
    const handler = createMockHandler({ type: QUIZ_TYPE.QUEM_E_QUEM })
    const runner = new QuizRunner(new QuizHandlerRegistry([handler]))

    runner.onRouteChange(quizRoute)
    runner.onRouteChange({ href: 'https://footballidentity.org/player', pathname: '/player', search: '' })
    runner.onQuizData(createQuizMessage())

    await waitForAssertion(() => {
      expect(handler.solve).not.toHaveBeenCalled()
    })
  })

  it('ignores messages with invalid source', async () => {
    const handler = createMockHandler({ type: QUIZ_TYPE.QUEM_E_QUEM })
    const runner = new QuizRunner(new QuizHandlerRegistry([handler]))

    runner.onRouteChange(quizRoute)
    runner.onQuizData(createQuizMessage({ source: 'invalid' }))

    await waitForAssertion(() => {
      expect(handler.solve).not.toHaveBeenCalled()
    })
  })

  it('ignores messages with non-200 status', async () => {
    const handler = createMockHandler({ type: QUIZ_TYPE.QUEM_E_QUEM })
    const runner = new QuizRunner(new QuizHandlerRegistry([handler]))

    runner.onRouteChange(quizRoute)
    runner.onQuizData(createQuizMessage({ status: 500 }))

    await waitForAssertion(() => {
      expect(handler.solve).not.toHaveBeenCalled()
    })
  })

  it('ignores messages without type', async () => {
    const handler = createMockHandler({ type: QUIZ_TYPE.QUEM_E_QUEM })
    const runner = new QuizHandlerRegistry([handler])
    const quizRunner = new QuizRunner(runner)

    quizRunner.onRouteChange(quizRoute)
    quizRunner.onQuizData(createQuizMessage({ type: null }))

    await waitForAssertion(() => {
      expect(handler.solve).not.toHaveBeenCalled()
    })
  })

  it('resolves and runs handler once per round', async () => {
    const handler = createMockHandler({
      type: QUIZ_TYPE.QUEM_E_QUEM,
      parsePayload: vi.fn(() => [{ id: '1' }]),
      solve: vi.fn(async () => {}),
    })
    const runner = new QuizRunner(new QuizHandlerRegistry([handler]))
    const message = createQuizMessage()

    runner.onRouteChange(quizRoute)
    runner.onQuizData(message)
    runner.onQuizData(message)

    await waitForAssertion(() => {
      expect(handler.parsePayload).toHaveBeenCalledOnce()
      expect(handler.solve).toHaveBeenCalledOnce()
    })
  })

  it('caches all payloads in a batch before calling progress once for cached handlers', async () => {
    const storePayload = vi.fn()
    const progress = vi.fn(async () => {})

    const handler = {
      type: QUIZ_TYPE.ARTILHEIRO_DA_RODADA,
      matchesRoute: vi.fn(() => true),
      parsePayload: vi.fn((body: unknown) => body),
      storePayload,
      progress,
      solve: vi.fn(async () => {}),
    }

    const runner = new QuizRunner(new QuizHandlerRegistry([handler]))

    runner.onRouteChange(quizRoute)
    ;(readModalQuizType as ReturnType<typeof vi.fn>).mockResolvedValue(QUIZ_TYPE.ARTILHEIRO_DA_RODADA)

    runner.onQuizData(
      createQuizMessage({
        type: MESSAGE_TYPE.GET_TOP_SCORERS_FOR_MINIGAME,
        body: [{ round_number: 6, season_number: 1, full_name: 'Player A' }],
      }),
    )
    runner.onQuizData(
      createQuizMessage({
        type: MESSAGE_TYPE.GET_TOP_SCORERS_FOR_MINIGAME,
        body: [{ round_number: 7, season_number: 1, full_name: 'Player B' }],
      }),
    )

    await waitForAssertion(() => {
      expect(storePayload).toHaveBeenCalledTimes(2)
      expect(progress).toHaveBeenCalled()
      expect(handler.solve).not.toHaveBeenCalled()
    })
  })

  it('stores later payloads without starting a second progress while one is in flight', async () => {
    let releaseProgress: (() => void) | undefined

    const progressGate = new Promise<void>((resolve) => {
      releaseProgress = resolve
    })

    const storePayload = vi.fn()
    const progress = vi.fn(async () => {
      await progressGate
    })

    const handler = {
      type: QUIZ_TYPE.ARTILHEIRO_DA_RODADA,
      matchesRoute: vi.fn(() => true),
      parsePayload: vi.fn((body: unknown) => body),
      storePayload,
      progress,
      solve: vi.fn(async () => {}),
    }

    const runner = new QuizRunner(new QuizHandlerRegistry([handler]))

    runner.onRouteChange(quizRoute)
    ;(readModalQuizType as ReturnType<typeof vi.fn>).mockResolvedValue(QUIZ_TYPE.ARTILHEIRO_DA_RODADA)

    runner.onQuizData(
      createQuizMessage({
        type: MESSAGE_TYPE.GET_TOP_SCORERS_FOR_MINIGAME,
        body: [{ round_number: 6, season_number: 1, full_name: 'Player A' }],
      }),
    )

    await waitForAssertion(() => {
      expect(progress).toHaveBeenCalledOnce()
      expect(storePayload).toHaveBeenCalledOnce()
    })

    runner.onQuizData(
      createQuizMessage({
        type: MESSAGE_TYPE.GET_TOP_SCORERS_FOR_MINIGAME,
        body: [{ round_number: 7, season_number: 1, full_name: 'Player B' }],
      }),
    )

    await waitForAssertion(() => {
      expect(storePayload).toHaveBeenCalledOnce()
      expect(progress).toHaveBeenCalledOnce()
    })

    releaseProgress?.()

    await waitForAssertion(() => {
      expect(storePayload).toHaveBeenCalledTimes(2)
      expect(progress.mock.calls.length).toBeGreaterThanOrEqual(1)
    })
  })

  it('clears state on dispose', async () => {
    const handler = createMockHandler({ type: QUIZ_TYPE.QUEM_E_QUEM })
    const runner = new QuizRunner(new QuizHandlerRegistry([handler]))

    runner.onRouteChange(quizRoute)
    runner.dispose()
    runner.onQuizData(createQuizMessage())

    await waitForAssertion(() => {
      expect(handler.solve).not.toHaveBeenCalled()
    })
  })
})
