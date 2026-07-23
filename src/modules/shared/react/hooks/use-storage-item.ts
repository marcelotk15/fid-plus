import { useSyncExternalStore } from 'react'

import type { StorageLike } from '~/modules/shared/storage.types'

import { subscribeStorageKey } from '~/modules/shared/storage-sync'

type UseStorageItemOptions = {
  storage?: StorageLike
}

export function useStorageItem(key: string, options: UseStorageItemOptions = {}): string | null {
  const storage = options.storage ?? globalThis.localStorage

  return useSyncExternalStore(
    (onStoreChange) => subscribeStorageKey(key, onStoreChange),
    () => storage.getItem(key),
    () => null,
  )
}
