import type { RouteChangePayload } from '~/entrypoints/content'

import { EVENTS } from '~/constants'
import { handleRouteChange } from '~/modules/quiz/quiz-fetch-bridge'
import { FetchInterceptor } from '~/modules/shared/fetch-interceptor'
import { fetchInterceptRuleRegistry } from '~/modules/shared/register-fetch-intercept-rules'

export default defineContentScript({
  matches: ['*://*.footballidentity.org/*'],
  runAt: 'document_start',
  world: 'MAIN',

  main() {
    const fetchInterceptor = new FetchInterceptor()

    fetchInterceptRuleRegistry.registerAll(fetchInterceptor)
    fetchInterceptor.setup()

    globalThis.addEventListener(EVENTS.ROUTE_CHANGED, (event) => {
      handleRouteChange((event as CustomEvent<RouteChangePayload>).detail)
    })

    handleRouteChange({
      href: location.href,
      pathname: location.pathname,
      search: location.search,
    })
  },
})
