import { beforeEach, describe, expect, it, vi } from 'vitest'

import { EVENTS } from '~/constants'

import { installStorageChangeNotifier, subscribeStorageKey } from './storage-sync'

describe('storage-sync', () => {
  beforeEach(() => {
    localStorage.clear()
    installStorageChangeNotifier()
  })

  it('notifies subscribers when localStorage changes in the same document', () => {
    installStorageChangeNotifier()

    const listener = vi.fn()
    const unsubscribe = subscribeStorageKey('test-key', listener)

    localStorage.setItem('test-key', 'value')

    expect(listener).toHaveBeenCalledTimes(1)

    unsubscribe()
  })

  it('ignores changes to unrelated keys', () => {
    installStorageChangeNotifier()

    const listener = vi.fn()
    const unsubscribe = subscribeStorageKey('auth-key', listener)

    localStorage.setItem('other-key', 'value')

    expect(listener).not.toHaveBeenCalled()

    unsubscribe()
  })

  it('notifies when localStorage is cleared', () => {
    installStorageChangeNotifier()

    localStorage.setItem('test-key', 'value')

    const listener = vi.fn()
    const unsubscribe = subscribeStorageKey('test-key', listener)

    localStorage.clear()

    expect(listener).toHaveBeenCalledTimes(1)

    unsubscribe()
  })

  it('notifies subscribers on custom storage events from other contexts', () => {
    installStorageChangeNotifier()

    const listener = vi.fn()
    const unsubscribe = subscribeStorageKey('test-key', listener)

    globalThis.dispatchEvent(
      new CustomEvent(EVENTS.STORAGE_CHANGED, {
        detail: { key: 'test-key' },
      }),
    )

    expect(listener).toHaveBeenCalledTimes(1)

    unsubscribe()
  })
})
