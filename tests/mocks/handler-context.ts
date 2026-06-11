import { vi } from 'vitest'

import type { RouteChangePayload } from '~/entrypoints/content'
import type { QuizHandlerContext } from '~/modules/quiz/handler'

const defaultRoute: RouteChangePayload = {
  href: 'https://footballidentity.org/player/quiz',
  pathname: '/player/quiz',
  search: '',
}

type MockContextOverrides = Partial<QuizHandlerContext>

export function createMockContext(overrides: MockContextOverrides = {}): QuizHandlerContext {
  return {
    document: overrides.document ?? document,
    route: overrides.route ?? defaultRoute,
    signal: overrides.signal ?? new AbortController().signal,
    waitForElement: overrides.waitForElement ?? vi.fn(async () => document.createElement('div')),
  }
}
