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
    document.body.innerHTML = ''
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

  it('returns quiz type when title includes extra suffix', async () => {
    const titleElement = document.createElement('h2')
    titleElement.textContent = 'Quem é Quem? · 5 rodadas'

    const ctx = createMockContext({
      waitForElement: vi.fn(async () => titleElement),
    })

    const quizType = await readModalQuizType(ctx)

    expect(quizType).toBe(QUIZ_TYPE.QUEM_E_QUEM)
  })

  it('infers quiz type from the question prompt when title is unknown', async () => {
    const titleElement = document.createElement('h2')
    titleElement.textContent = 'Minigame'

    document.body.innerHTML = `
      <div role="dialog">
        <div class="rounded-lg border p-4 text-center space-y-1">
          <p class="text-xs text-muted-foreground uppercase tracking-wide">Qual a posição dele?</p>
          <p class="font-display font-semibold text-lg">Renan Soares<span class="text-muted-foreground"> #22</span></p>
        </div>
      </div>
    `

    const ctx = createMockContext({
      document,
      waitForElement: vi.fn(async () => titleElement),
    })

    const quizType = await readModalQuizType(ctx)

    expect(quizType).toBe(QUIZ_TYPE.QUEM_E_QUEM)
  })

  it('infers wordle da liga from a three-part wordle hint when title is unknown', async () => {
    const titleElement = document.createElement('h2')
    titleElement.textContent = 'Minigame'

    document.body.innerHTML = `
      <div role="dialog">
        <div class="text-center space-y-1">
          <p class="text-xs text-muted-foreground">Pista</p>
          <p class="text-sm font-medium">Royal Identity · LW · 5 letras</p>
        </div>
      </div>
    `

    const ctx = createMockContext({
      document,
      waitForElement: vi.fn(async () => titleElement),
    })

    const quizType = await readModalQuizType(ctx)

    expect(quizType).toBe(QUIZ_TYPE.WORDLE_DA_LIGA)
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
