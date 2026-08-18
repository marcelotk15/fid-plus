import { destroyStoreBalance, initStoreBalance } from '~/modules/store/store-balance-controller'
import { handleStoreBridgeMessage } from '~/modules/store/store-fetch-bridge'

export default defineContentScript({
  matches: ['*://*.footballidentity.org/*'],
  runAt: 'document_idle',

  main(ctx) {
    initStoreBalance()

    ctx.addEventListener(globalThis, 'message', (event) => {
      handleStoreBridgeMessage(event as MessageEvent)
    })

    ctx.onInvalidated(() => {
      destroyStoreBalance()
    })
  },
})
