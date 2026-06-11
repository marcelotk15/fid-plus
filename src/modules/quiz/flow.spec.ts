import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockContext } from '~tests/mocks/handler-context'

import { QUIZ_TYPE } from './constants'
import { readModalQuizType } from './flow'

vi.mock('~/modules/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}))

import { logger } from '~/modules/logger'

describe('readModalQuizType', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns quiz type when title is known', async () => {
    const titleElement = document.createElement('h2')
    titleElement.textContent = 'Quem é Quem?'

    const ctx = createMockContext({
      waitForElement: vi.fn(async () => titleElement),
    })

    const quizType = await readModalQuizType(ctx)

    expect(quizType).toBe(QUIZ_TYPE.QUEM_E_QUEM)
    expect(logger.info).toHaveBeenCalled()
  })

  it('returns null and logs error when title is unknown', async () => {
    const titleElement = document.createElement('h2')
    titleElement.textContent = 'Unknown Quiz'

    const ctx = createMockContext({
      waitForElement: vi.fn(async () => titleElement),
    })

    const quizType = await readModalQuizType(ctx)

    expect(quizType).toBeNull()
    expect(logger.error).toHaveBeenCalledWith('unknown quiz title in modal', { title: 'unknown quiz' })
  })
})
