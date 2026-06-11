import type { RouteChangePayload } from '~/entrypoints/content'
import type { QuizHandler } from '~/modules/quiz/handler'
import type { ApiMessageType, QuizType } from '~/modules/quiz/types'

import { QUIZ_API_MAP } from '~/modules/quiz/constants'

export class QuizHandlerRegistry {
  private readonly byQuizType = new Map<QuizType, QuizHandler>()
  private readonly byApiType = new Map<ApiMessageType, QuizHandler[]>()

  constructor(handlers: QuizHandler[]) {
    for (const handler of handlers) {
      this.byQuizType.set(handler.type, handler)

      const apiType = QUIZ_API_MAP[handler.type]

      if (!apiType) continue

      const candidates = this.byApiType.get(apiType) ?? []

      candidates.push(handler)
      this.byApiType.set(apiType, candidates)
    }
  }

  getByQuizType(type: QuizType): QuizHandler | undefined {
    return this.byQuizType.get(type)
  }

  getByApiType(apiType: ApiMessageType): QuizHandler[] {
    return this.byApiType.get(apiType) ?? []
  }

  resolve(apiType: ApiMessageType, route: RouteChangePayload, activeQuizType?: QuizType | null): QuizHandler | null {
    if (activeQuizType) {
      const handler = this.getByQuizType(activeQuizType)

      if (handler && this.matchesApiType(activeQuizType, apiType)) {
        return handler
      }
    }

    const candidates = this.getByApiType(apiType)

    if (candidates.length === 0) return null

    if (activeQuizType) {
      const byQuizType = candidates.find((handler) => handler.type === activeQuizType)

      if (byQuizType) return byQuizType
    }

    return candidates.find((handler) => handler.matchesRoute(route)) ?? candidates[0]
  }

  private matchesApiType(quizType: QuizType, apiType: ApiMessageType): boolean {
    const mappedApi = QUIZ_API_MAP[quizType]

    return mappedApi === null || mappedApi === apiType
  }
}
