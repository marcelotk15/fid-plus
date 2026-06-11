import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockContext } from '~tests/mocks/handler-context'

import { QUIZ_TYPE } from './constants'
import { BaseQuizHandler } from './handler'

type TestItem = { id: string }

class TestHandler extends BaseQuizHandler<TestItem[]> {
  readonly type = QUIZ_TYPE.QUEM_E_QUEM

  parsePayload(body: unknown): TestItem[] | null {
    return this.parseArrayPayload(body, (item): item is TestItem => {
      return typeof item === 'object' && item !== null && 'id' in item && typeof item.id === 'string'
    })
  }

  async solve(): Promise<void> {}

  exposeParseArrayPayload(body: unknown) {
    return this.parseArrayPayload(body, (item): item is TestItem => {
      return typeof item === 'object' && item !== null && 'id' in item && typeof item.id === 'string'
    })
  }

  async testClickOption(ctx: ReturnType<typeof createMockContext>, selector: string, text: string) {
    await this.clickOptionByText(ctx, selector, text)
  }

  async testClickButton(ctx: ReturnType<typeof createMockContext>, selector: string) {
    await this.clickButton(ctx, selector)
  }
}

describe('BaseQuizHandler', () => {
  const handler = new TestHandler()

  beforeEach(() => {
    vi.spyOn(console, 'info').mockImplementation(() => {})
  })

  describe('matchesRoute', () => {
    it('returns true for quiz routes', () => {
      expect(handler.matchesRoute({ href: '', pathname: '/player/quiz/foo', search: '' })).toBe(true)
    })

    it('returns false outside quiz routes', () => {
      expect(handler.matchesRoute({ href: '', pathname: '/player/home', search: '' })).toBe(false)
    })
  })

  describe('parseArrayPayload', () => {
    it('returns a valid array', () => {
      expect(handler.exposeParseArrayPayload([{ id: '1' }, { id: '2' }])).toEqual([{ id: '1' }, { id: '2' }])
    })

    it('returns null for non-array input', () => {
      expect(handler.exposeParseArrayPayload({ id: '1' })).toBeNull()
    })

    it('returns null for empty array', () => {
      expect(handler.exposeParseArrayPayload([])).toBeNull()
    })

    it('returns null when any item is invalid', () => {
      expect(handler.exposeParseArrayPayload([{ id: '1' }, { name: 'x' }])).toBeNull()
    })
  })

  describe('clickOptionByText', () => {
    it('clicks the option matching the text', async () => {
      const option = document.createElement('button')
      option.className = 'option'
      option.textContent = 'Flamengo'
      document.body.append(option)

      const ctx = createMockContext({ document })

      await handler.testClickOption(ctx, '.option', 'flamengo')

      expect(ctx.waitForElement).toHaveBeenCalledWith('.option')
    })

    it('throws when the option is not found', async () => {
      const ctx = createMockContext({ document })

      await expect(handler.testClickOption(ctx, '.option', 'missing')).rejects.toThrow(
        'Quiz option not found for text: missing',
      )
    })
  })

  describe('clickButton', () => {
    it('clicks the button found by selector', async () => {
      const button = document.createElement('button')
      button.id = 'submit'
      const clickSpy = vi.spyOn(button, 'click')

      const ctx = createMockContext({
        waitForElement: vi.fn(async () => button),
      })

      await handler.testClickButton(ctx, '#submit')

      expect(clickSpy).toHaveBeenCalledOnce()
    })
  })
})
