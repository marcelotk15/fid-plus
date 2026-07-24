import { vi } from 'vitest'

import type { QuizHandler } from '~/modules/quiz/handler'
import type { QuizType } from '~/modules/quiz/types'

import { QUIZ_TYPE } from '~/modules/quiz/constants'

type MockHandlerOverrides = Partial<QuizHandler> & {
  type?: QuizType
}

export function createMockHandler(overrides: MockHandlerOverrides = {}): QuizHandler {
  return {
    type: overrides.type ?? QUIZ_TYPE.QUEM_E_QUEM,
    matchesRoute: overrides.matchesRoute ?? vi.fn(() => true),
    parsePayload: overrides.parsePayload ?? vi.fn(() => ({ ok: true })),
    solve: overrides.solve ?? vi.fn(async () => {}),
  }
}
