import type { RouteChangePayload } from '~/entrypoints/content'

import { EVENTS } from '~/constants'
import { logger } from '~/modules/logger'
import { quizHandlerRegistry } from '~/modules/quiz/handlers'
import { QuizRunner } from '~/modules/quiz/runner'

export default defineContentScript({
  matches: ['*://*.footballidentity.org/*'],
  runAt: 'document_idle',

  main(ctx) {
    const runner = new QuizRunner(quizHandlerRegistry)

    ctx.addEventListener(globalThis, EVENTS.ROUTE_CHANGED, (event) => {
      runner.onRouteChange((event as CustomEvent<RouteChangePayload>).detail)
    })

    ctx.addEventListener(globalThis, 'message', (event) => {
      runner.onQuizData(event as MessageEvent)
    })

    ctx.onInvalidated(() => {
      runner.dispose()
    })

    logger.info('quiz automation loaded')

    runner.onRouteChange({
      href: location.href,
      pathname: location.pathname,
      search: location.search,
    })
  },
})
