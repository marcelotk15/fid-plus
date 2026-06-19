import { createDailyPackSession } from '~/modules/daily-pack'
import { parseDailyPackBridgeMessage } from '~/modules/daily-pack/daily-pack-fetch-bridge'
import { resetDailyPackMenuHighlight } from '~/modules/daily-pack/daily-pack-menu-highlight'

export default defineContentScript({
  matches: ['*://*.footballidentity.org/*'],
  runAt: 'document_idle',

  main(ctx) {
    const dailyPack = createDailyPackSession()

    dailyPack.checkOncePerSession()

    ctx.addEventListener(globalThis, 'message', (event) => {
      const status = parseDailyPackBridgeMessage(event as MessageEvent)

      if (!status) return

      dailyPack.ingestStatusFromPage(status)
    })

    ctx.onInvalidated(() => {
      dailyPack.reset()
      resetDailyPackMenuHighlight()
    })
  },
})
