import { handleWeeklyEarningsBridgeMessage } from '~/modules/weekly-earnings/weekly-earnings-fetch-bridge'

export default defineContentScript({
  matches: ['*://*.footballidentity.org/*'],
  runAt: 'document_idle',

  main(ctx) {
    ctx.addEventListener(globalThis, 'message', (event) => {
      handleWeeklyEarningsBridgeMessage(event as MessageEvent)
    })
  },
})
