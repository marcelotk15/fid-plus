import type { RouteChangePayload } from '~/entrypoints/content'
import type { QuizApiPayload, QuizHandler, QuizHandlerContext } from '~/modules/quiz/handler'
import type { QuizHandlerRegistry } from '~/modules/quiz/registry'
import type { ApiMessageType, QuizType } from '~/modules/quiz/types'

import { logger } from '~/modules/logger'
import { QUIZ_PATH_PREFIX } from '~/modules/quiz/constants'
import { readModalQuizType } from '~/modules/quiz/flow'
import { MESSAGE_SOURCE } from '~/modules/shared/consts'
import { waitForElement } from '~/modules/shared/dom'

type QuizContentMessage = {
  source: typeof MESSAGE_SOURCE.QUIZ_CONTENT
  type: string | null
  payload: QuizApiPayload
}

export class QuizRunner {
  private abortController: AbortController | null = null
  private active = false
  private currentRoute: RouteChangePayload | null = null
  private solving = false
  private solvedRoundKey: string | null = null
  private activeQuizType: QuizType | null = null

  constructor(private readonly registry: QuizHandlerRegistry) {}

  onRouteChange(route: RouteChangePayload): void {
    if (!this.isQuizRoute(route.pathname)) {
      if (this.active) {
        logger.info('leaving quiz route')
        this.resetState()
      }

      return
    }

    const routeChanged = this.currentRoute?.href !== route.href

    if (routeChanged) {
      this.solvedRoundKey = null
      this.activeQuizType = null
    }

    if (!this.active) {
      logger.info('entering quiz route', { pathname: route.pathname })
    }

    this.abortController?.abort()
    this.abortController = new AbortController()
    this.active = true
    this.currentRoute = route
  }

  /** Entry point for the plugin: after the user starts the minigame and the API responds. */
  onQuizData(event: MessageEvent): void {
    if (!this.active || !this.currentRoute) return
    if (event.source !== window) return
    if (!this.isQuizContentMessage(event.data)) return
    if (event.data.payload.status !== 200) return
    if (!event.data.type) return

    const route = this.currentRoute

    void this.resolveAndSolve(route, event.data.payload.body, event.data.type as ApiMessageType)
  }

  dispose(): void {
    this.resetState()
  }

  private resetState(): void {
    this.abortController?.abort()
    this.abortController = null
    this.active = false
    this.currentRoute = null
    this.solving = false
    this.solvedRoundKey = null
    this.activeQuizType = null
  }

  private createHandlerContext(route: RouteChangePayload): QuizHandlerContext {
    const signal = this.abortController?.signal ?? new AbortController().signal

    return {
      document,
      route,
      signal,
      waitForElement: (selector, timeoutMs) =>
        waitForElement(selector, {
          signal,
          timeout: timeoutMs,
        }),
    }
  }

  private async trySolve(handler: QuizHandler, data: unknown, roundKey: string): Promise<void> {
    if (!this.active || !this.currentRoute || this.solving || this.solvedRoundKey === roundKey) return

    if (!handler.matchesRoute(this.currentRoute)) return

    const parsed = handler.parsePayload(data)

    if (!parsed) {
      logger.error('invalid quiz payload', { type: handler.type })
      return
    }

    this.solving = true

    try {
      logger.info('solving quiz', { type: handler.type, roundKey })

      await handler.solve(parsed, this.createHandlerContext(this.currentRoute))

      this.solvedRoundKey = roundKey
    } catch (error) {
      logger.error('quiz solve failed', {
        type: handler.type,
        error: error instanceof Error ? error.message : String(error),
      })
    } finally {
      this.solving = false
    }
  }

  private async resolveAndSolve(route: RouteChangePayload, body: unknown, apiType: ApiMessageType): Promise<void> {
    const handlerContext = this.createHandlerContext(route)

    this.activeQuizType = await readModalQuizType(handlerContext)

    logger.info('active quiz type', { activeQuizType: this.activeQuizType })

    const handler = this.registry.resolve(apiType, route, this.activeQuizType)

    if (!handler) {
      logger.error('no handler resolved', { apiType, activeQuizType: this.activeQuizType })
      return
    }

    const roundKey = `${handler.type}:${apiType}:${route.href}:${JSON.stringify(body)}`

    await this.trySolve(handler, body, roundKey)
  }

  private isQuizRoute(pathname: string): boolean {
    return pathname.startsWith(QUIZ_PATH_PREFIX)
  }

  private isQuizContentMessage(data: unknown): data is QuizContentMessage {
    if (typeof data !== 'object' || data === null) return false

    const message = data as QuizContentMessage

    return message.source === MESSAGE_SOURCE.QUIZ_CONTENT && message.payload !== undefined
  }
}
