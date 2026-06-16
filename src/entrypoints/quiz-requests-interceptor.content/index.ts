import type { RouteChangePayload } from '~/entrypoints/content'

import { EVENTS } from '~/constants'
import { handleRouteChange } from '~/modules/shared/api-interceptor'

export default defineContentScript({
  matches: ['*://*.footballidentity.org/*'],
  runAt: 'document_start',
  world: 'MAIN',

  main() {
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
