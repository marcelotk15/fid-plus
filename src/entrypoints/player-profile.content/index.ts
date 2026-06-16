import type { RouteChangePayload } from '~/entrypoints/content'

import { EVENTS } from '~/constants'
import { logger } from '~/modules/logger'
import { PlayerProfileRunner } from '~/modules/player/runner'

export default defineContentScript({
  matches: ['*://*.footballidentity.org/*'],
  runAt: 'document_idle',

  main(ctx) {
    const runner = new PlayerProfileRunner()

    ctx.addEventListener(globalThis, EVENTS.ROUTE_CHANGED, (event) => {
      runner.onRouteChange((event as CustomEvent<RouteChangePayload>).detail)
    })

    ctx.addEventListener(globalThis, 'message', (event) => {
      runner.onPlayerAttributes(event as MessageEvent)
    })

    ctx.onInvalidated(() => {
      runner.dispose()
    })

    logger.info('player profile loaded')

    runner.onRouteChange({
      href: location.href,
      pathname: location.pathname,
      search: location.search,
    })
  },
})
