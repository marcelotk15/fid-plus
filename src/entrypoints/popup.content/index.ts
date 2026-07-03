import '~/assets/tailwind.css'
import { RUNTIME_MESSAGE } from '~/constants'
import { destroyPopup, initPopupUi, togglePopup } from '~/modules/popup/popup-controller'

export default defineContentScript({
  matches: ['*://*.footballidentity.org/*'],
  runAt: 'document_idle',
  cssInjectionMode: 'ui',

  async main(ctx) {
    await initPopupUi(ctx)

    browser.runtime.onMessage.addListener((message) => {
      if (message.type === RUNTIME_MESSAGE.TOGGLE_POPUP) {
        togglePopup()
      }
    })

    ctx.onInvalidated(() => {
      destroyPopup()
    })
  },
})
