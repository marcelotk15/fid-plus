import { EVENTS } from '~/constants'

export type StorageChangePayload = {
  key: string | null
}

const PATCHED = Symbol.for('fid-plus.storage-change-notifier')

function emitStorageChanged(key: string | null): void {
  globalThis.dispatchEvent(
    new CustomEvent<StorageChangePayload>(EVENTS.STORAGE_CHANGED, {
      detail: { key },
    }),
  )
}

function definePatchedMethod(
  storage: Storage,
  method: 'setItem' | 'removeItem' | 'clear',
  invokeNative: (...args: never[]) => void,
  getChangedKey: (...args: never[]) => string | null,
): void {
  Object.defineProperty(storage, method, {
    value(...args: never[]) {
      invokeNative(...args)
      emitStorageChanged(getChangedKey(...args))
    },
    writable: true,
    configurable: true,
  })
}

function patchStorageTarget(storage: Storage): void {
  if (Reflect.get(storage, PATCHED) === true) return

  definePatchedMethod(storage, 'setItem', storage.setItem.bind(storage) as (...args: never[]) => void, (key) => key)
  definePatchedMethod(
    storage,
    'removeItem',
    storage.removeItem.bind(storage) as (...args: never[]) => void,
    (key) => key,
  )
  definePatchedMethod(storage, 'clear', storage.clear.bind(storage) as (...args: never[]) => void, () => null)

  Reflect.set(storage, PATCHED, true)
}

export function installStorageChangeNotifier(): void {
  if (typeof globalThis.localStorage !== 'undefined') {
    patchStorageTarget(globalThis.localStorage)
  }

  if (Reflect.get(Storage.prototype, PATCHED) === true) return

  const nativeSetItem = Storage.prototype.setItem
  const nativeRemoveItem = Storage.prototype.removeItem
  const nativeClear = Storage.prototype.clear

  Storage.prototype.setItem = function setItem(key: string, value: string) {
    nativeSetItem.call(this, key, value)

    if (this === globalThis.localStorage) {
      emitStorageChanged(key)
    }
  }

  Storage.prototype.removeItem = function removeItem(key: string) {
    nativeRemoveItem.call(this, key)

    if (this === globalThis.localStorage) {
      emitStorageChanged(key)
    }
  }

  Storage.prototype.clear = function clear() {
    nativeClear.call(this)

    if (this === globalThis.localStorage) {
      emitStorageChanged(null)
    }
  }

  Reflect.set(Storage.prototype, PATCHED, true)
}

export function subscribeStorageKey(key: string, listener: () => void): () => void {
  installStorageChangeNotifier()

  const onNativeStorage = (event: StorageEvent) => {
    if (event.storageArea !== globalThis.localStorage) return
    if (event.key === null || event.key === key) listener()
  }

  const onCustomStorage = (event: Event) => {
    const detail = (event as CustomEvent<StorageChangePayload>).detail

    if (detail.key === null || detail.key === key) listener()
  }

  globalThis.addEventListener('storage', onNativeStorage)
  globalThis.addEventListener(EVENTS.STORAGE_CHANGED, onCustomStorage)

  return () => {
    globalThis.removeEventListener('storage', onNativeStorage)
    globalThis.removeEventListener(EVENTS.STORAGE_CHANGED, onCustomStorage)
  }
}
