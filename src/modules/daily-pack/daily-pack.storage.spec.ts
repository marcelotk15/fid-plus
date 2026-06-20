import { describe, expect, it } from 'vitest'

import type { StorageLike } from '~/modules/shared/storage.types'

import { DAILY_PACK } from '~/modules/shared/consts'

import { isDailyPackCacheValid, readDailyPackCache, saveDailyPackCache } from './daily-pack.storage'

function createMemoryStorage(initial: Record<string, string> = {}): StorageLike {
  const store = new Map(Object.entries(initial))

  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value)
    },
  }
}

describe('daily-pack.storage', () => {
  it('returns null when cache is missing', () => {
    const storage = createMemoryStorage()

    expect(readDailyPackCache(storage)).toBeNull()
  })

  it('reads cache from JSON object', () => {
    const storage = createMemoryStorage({
      [DAILY_PACK.CACHE_STORAGE_KEY]: JSON.stringify({ nextResetAt: '2026-06-18T23:53:57.733Z' }),
    })

    expect(readDailyPackCache(storage)).toEqual({
      nextResetAt: '2026-06-18T23:53:57.733Z',
      claimedToday: true,
    })
  })

  it('treats corrupted cache as miss', () => {
    const storage = createMemoryStorage({
      [DAILY_PACK.CACHE_STORAGE_KEY]: 'not-json',
    })

    expect(readDailyPackCache(storage)).toBeNull()
  })

  it('treats invalid date as miss', () => {
    const storage = createMemoryStorage({
      [DAILY_PACK.CACHE_STORAGE_KEY]: JSON.stringify({ nextResetAt: 'invalid-date' }),
    })

    expect(readDailyPackCache(storage)).toBeNull()
  })

  it('saves cache as JSON object', () => {
    const storage = createMemoryStorage()

    saveDailyPackCache(storage, '2026-06-18T23:53:57.733Z', false)

    expect(storage.getItem(DAILY_PACK.CACHE_STORAGE_KEY)).toBe(
      JSON.stringify({ nextResetAt: '2026-06-18T23:53:57.733Z', claimedToday: false }),
    )
  })

  it('considers future reset as valid cache', () => {
    const cache = { nextResetAt: '2099-01-01T00:00:00.000Z', claimedToday: true }
    const now = new Date('2026-06-18T12:00:00.000Z')

    expect(isDailyPackCacheValid(cache, now)).toBe(true)
  })

  it('considers expired reset as invalid cache', () => {
    const cache = { nextResetAt: '2026-01-01T00:00:00.000Z', claimedToday: true }
    const now = new Date('2026-06-18T12:00:00.000Z')

    expect(isDailyPackCacheValid(cache, now)).toBe(false)
  })

  it('considers reset at exact now as invalid cache', () => {
    const now = new Date('2026-06-18T12:00:00.000Z')
    const cache = { nextResetAt: now.toISOString(), claimedToday: true }

    expect(isDailyPackCacheValid(cache, now)).toBe(false)
  })
})
