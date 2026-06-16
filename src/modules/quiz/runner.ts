import type { RouteChangePayload } from '~/entrypoints/content'
import type { CachedQuizHandler, QuizApiPayload, QuizHandler, QuizHandlerContext } from '~/modules/quiz/handler'
import type { QuizHandlerRegistry } from '~/modules/quiz/registry'
import type { ApiMessageType, QuizType } from '~/modules/quiz/types'

import { logger } from '~/modules/logger'
import { readModalQuizType } from '~/modules/quiz/flow'
import { isCachedQuizHandler } from '~/modules/quiz/handler'
import { isQuizRoute } from '~/modules/quiz/routes'
import { MESSAGE_SOURCE } from '~/modules/shared/consts'
import { waitForElement } from '~/modules/shared/dom'

type QuizContentMessage = {
  source: typeof MESSAGE_SOURCE.QUIZ_CONTENT
  type: string | null
  payload: QuizApiPayload
}

type PendingQuizSolve = {
  body: unknown
  apiType: ApiMessageType
}

export class QuizRunner {
  private abortController: AbortController | null = null
  private active = false
  private currentRoute: RouteChangePayload | null = null
  private solvedRoundKey: string | null = null
  private activeQuizType: QuizType | null = null
  private readonly solveQueue: PendingQuizSolve[] = []
  private processingQueue = false
  private cachedProgressInFlight = false

  constructor(private readonly registry: QuizHandlerRegistry) {}

  onRouteChange(route: RouteChangePayload): void {
    if (!isQuizRoute(route.pathname)) {
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

    this.enqueueQuizData(event.data.payload.body, event.data.type as ApiMessageType)
  }

  dispose(): void {
    this.resetState()
  }

  private resetState(): void {
    this.abortController?.abort()
    this.abortController = null
    this.active = false
    this.currentRoute = null
    this.solvedRoundKey = null
    this.activeQuizType = null
    this.solveQueue.length = 0
    this.processingQueue = false
    this.cachedProgressInFlight = false
  }

  private enqueueQuizData(body: unknown, apiType: ApiMessageType): void {
    if (!this.active || !this.currentRoute) return

    this.solveQueue.push({ body, apiType })
    void this.processSolveQueue()
  }

  private drainQueue(): PendingQuizSolve[] {
    return this.solveQueue.splice(0, this.solveQueue.length)
  }

  private async processSolveQueue(): Promise<void> {
    if (this.processingQueue || !this.active || !this.currentRoute) return

    this.processingQueue = true

    try {
      while (this.solveQueue.length > 0 && this.active && this.currentRoute) {
        const route = this.currentRoute
        const batch = this.drainQueue()
        const handlerContext = this.createHandlerContext(route)

        try {
          this.activeQuizType = await readModalQuizType(handlerContext)
        } catch (error) {
          logger.error('failed to detect quiz type from modal', {
            error: error instanceof Error ? error.message : String(error),
          })
          continue
        }

        logger.info('active quiz type', { activeQuizType: this.activeQuizType })

        const cachedHandlers = new Set<CachedQuizHandler>()

        for (const { body, apiType } of batch) {
          const handler = this.registry.resolve(apiType, route, this.activeQuizType)

          if (!handler) {
            logger.error('no handler resolved', { apiType, activeQuizType: this.activeQuizType })
            continue
          }

          if (isCachedQuizHandler(handler)) {
            const parsed = handler.parsePayload(body)

            if (!parsed) {
              logger.error('invalid quiz payload', { type: handler.type })
              continue
            }

            handler.storePayload(parsed)
            cachedHandlers.add(handler)
            continue
          }

          const roundKey = `${handler.type}:${apiType}:${route.href}:${JSON.stringify(body)}`

          await this.trySolve(handler, body, roundKey)
        }

        for (const handler of cachedHandlers) {
          await this.runCachedProgress(handler, handlerContext)
        }
      }
    } finally {
      this.processingQueue = false

      if (this.solveQueue.length > 0 && this.active && this.currentRoute) {
        void this.processSolveQueue()
      }
    }
  }

  private async runCachedProgress(handler: CachedQuizHandler, ctx: QuizHandlerContext): Promise<void> {
    if (!this.active || !this.currentRoute || this.cachedProgressInFlight) return

    this.cachedProgressInFlight = true

    try {
      logger.info('progressing cached quiz', { type: handler.type })

      await handler.progress(ctx)
    } catch (error) {
      logger.error('cached quiz progress failed', {
        type: handler.type,
        error: error instanceof Error ? error.message : String(error),
      })
    } finally {
      this.cachedProgressInFlight = false
    }
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
    if (!this.active || !this.currentRoute || this.solvedRoundKey === roundKey) return

    if (!handler.matchesRoute(this.currentRoute)) return

    const parsed = handler.parsePayload(data)

    if (!parsed) {
      logger.error('invalid quiz payload', { type: handler.type })
      return
    }

    try {
      logger.info('solving quiz', { type: handler.type, roundKey })

      await handler.solve(parsed, this.createHandlerContext(this.currentRoute))

      this.solvedRoundKey = roundKey
    } catch (error) {
      logger.error('quiz solve failed', {
        type: handler.type,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  private isQuizContentMessage(data: unknown): data is QuizContentMessage {
    if (typeof data !== 'object' || data === null) return false

    const message = data as QuizContentMessage

    return message.source === MESSAGE_SOURCE.QUIZ_CONTENT && message.payload !== undefined
  }
}
