import type { PlayerProfileSnapshot } from './player-profiles-api'

import {
  ensureBalanceBelowHeading,
  findStoreHeading,
  removePurchaseHints,
  removeStoreBalanceHost,
  syncPurchaseHints,
  STORE_BALANCE_HOST_ID,
} from './store-balance-dom'

let lastProfile: PlayerProfileSnapshot | null = null
let mountedHost: HTMLElement | null = null
let documentObserver: MutationObserver | null = null
let syncRaf = 0

function syncMount(): void {
  const heading = findStoreHeading()

  if (heading && lastProfile) {
    const existingHost = mountedHost ?? document.getElementById(STORE_BALANCE_HOST_ID)
    mountedHost = ensureBalanceBelowHeading(heading, lastProfile, existingHost)
    syncPurchaseHints(lastProfile)
    return
  }

  removeStoreBalanceHost(mountedHost)
  removePurchaseHints()
  mountedHost = null
}

function scheduleSync(): void {
  if (syncRaf) return

  syncRaf = requestAnimationFrame(() => {
    syncRaf = 0
    syncMount()
  })
}

export function updateStoreProfile(profile: PlayerProfileSnapshot): void {
  lastProfile = profile
  syncMount()
}

export function initStoreBalance(): void {
  if (documentObserver) return

  documentObserver = new MutationObserver(scheduleSync)
  documentObserver.observe(document.documentElement, { childList: true, subtree: true })
  syncMount()
}

export function destroyStoreBalance(): void {
  if (syncRaf) {
    cancelAnimationFrame(syncRaf)
    syncRaf = 0
  }

  documentObserver?.disconnect()
  documentObserver = null
  removeStoreBalanceHost(mountedHost)
  removePurchaseHints()
  mountedHost = null
  lastProfile = null
}
