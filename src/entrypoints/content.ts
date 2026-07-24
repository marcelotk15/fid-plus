import type { RouteChangePayload } from '~/modules/shared/route-state'

import { EVENTS } from '~/constants'
import { installStorageChangeNotifier } from '~/modules/shared/storage-sync'

function emitRouteChangedEvent() {
  const detail: RouteChangePayload = {
    href: location.href,
    pathname: location.pathname,
    search: location.search,
  }

  globalThis.dispatchEvent(
    new CustomEvent<RouteChangePayload>(EVENTS.ROUTE_CHANGED, {
      detail,
    }),
  )
}

function watchRouteChanges() {
  let currentUrl = location.href

  const notify = () => {
    if (currentUrl === location.href) return

    currentUrl = location.href

    emitRouteChangedEvent()
  }

  const originalPushState = history.pushState
  const originalReplaceState = history.replaceState

  history.pushState = function (...args) {
    const result = originalPushState.apply(history, args)

    notify()

    return result
  }

  history.replaceState = function (...args) {
    const result = originalReplaceState.apply(history, args)

    notify()

    return result
  }

  globalThis.addEventListener('popstate', notify)
}

export default defineContentScript({
  matches: ['*://*.footballidentity.org/*'],
  runAt: 'document_start',
  world: 'MAIN',
  main() {
    installStorageChangeNotifier()
    watchRouteChanges()

    emitRouteChangedEvent()
  },
})
