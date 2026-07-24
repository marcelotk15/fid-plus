import { RUNTIME_MESSAGE } from '~/constants'

export default defineBackground(() => {
  browser.action.onClicked.addListener(async (tab) => {
    if (!tab.id) return

    try {
      await browser.tabs.sendMessage(tab.id, {
        type: RUNTIME_MESSAGE.TOGGLE_POPUP,
      })
    } catch {
      // Aba sem content script (fora do FID) — ignorar silenciosamente
    }
  })
})
