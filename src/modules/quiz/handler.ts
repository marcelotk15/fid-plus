import type { RouteChangePayload } from '~/entrypoints/content'
import type { QuizType } from '~/modules/quiz/types'

import { logger } from '~/modules/logger'
import { isQuizRoute } from '~/modules/quiz/routes'
import { clickElement, findElementsByText } from '~/modules/shared/dom'
import { getTextContent } from '~/modules/shared/text'

export type { QuizType } from '~/modules/quiz/types'

export type QuizApiPayload<T = unknown> = {
  status: number
  body: T
}

export type QuizHandlerContext = {
  document: Document
  route: RouteChangePayload
  signal: AbortSignal
  waitForElement(selector: string, timeoutMs?: number): Promise<Element>
}

export interface QuizHandler<TData = unknown> {
  readonly type: QuizType
  matchesRoute(route: RouteChangePayload): boolean
  parsePayload(body: unknown): TData | null
  solve(data: TData, ctx: QuizHandlerContext): Promise<void>
}

/** Handlers that cache multiple API payloads before answering from the DOM. */
export interface CachedQuizHandler<TData = unknown> extends QuizHandler<TData> {
  storePayload(data: TData): void
  progress(ctx: QuizHandlerContext): Promise<void>
}

export function isCachedQuizHandler(handler: QuizHandler): handler is CachedQuizHandler {
  return 'storePayload' in handler && 'progress' in handler
}

export abstract class BaseQuizHandler<TData = unknown> implements QuizHandler<TData> {
  abstract readonly type: QuizType

  matchesRoute(route: RouteChangePayload): boolean {
    return isQuizRoute(route.pathname)
  }

  abstract parsePayload(body: unknown): TData | null

  abstract solve(data: TData, ctx: QuizHandlerContext): Promise<void>

  protected parseArrayPayload<T>(body: unknown, validate: (item: unknown) => item is T): T[] | null {
    if (!Array.isArray(body) || body.length === 0) return null

    const items: T[] = []

    for (const item of body) {
      if (!validate(item)) return null

      items.push(item)
    }

    return items
  }

  protected async clickOptionByText(
    ctx: QuizHandlerContext,
    optionsSelector: string,
    text: string,
  ): Promise<void> {
    await ctx.waitForElement(optionsSelector)

    const matches = findElementsByText(ctx.document, optionsSelector, text)

    if (matches.length === 0) {
      throw new Error(`Quiz option not found for text: ${text}`)
    }

    const [option] = matches

    logger.info('clicking quiz option', { text: getTextContent(option) })

    clickElement(option)
  }

  protected async clickButton(ctx: QuizHandlerContext, selector: string): Promise<void> {
    const button = await ctx.waitForElement(selector)

    logger.info('clicking quiz button', { selector })

    clickElement(button)
  }
}
