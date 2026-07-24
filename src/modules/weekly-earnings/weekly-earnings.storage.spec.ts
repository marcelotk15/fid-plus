import { describe, expect, it } from 'vitest'

import { weeklyEarningsCacheKey } from '~/modules/shared/consts'

import { createEmptyWeeklyEarningsCache } from './weekly-earnings-cache.types'
import {
  parseWeeklyEarningsCache,
  readOrCreateWeeklyEarningsCache,
  readWeeklyEarningsCache,
  writeWeeklyEarningsCache,
} from './weekly-earnings.storage'

const USER_ID = '333c3d91-402f-4814-938f-0d185f2ddc28'

describe('weekly-earnings.storage', () => {
  it('reads and writes cache by user id key', () => {
    const storage = {
      values: new Map<string, string>(),
      getItem(key: string) {
        return this.values.get(key) ?? null
      },
      setItem(key: string, value: string) {
        this.values.set(key, value)
      },
    }

    const cache = createEmptyWeeklyEarningsCache(USER_ID)
    cache.profile = { activePlayerProfileId: 'player-1' }

    writeWeeklyEarningsCache(storage, cache)

    expect(storage.values.get(weeklyEarningsCacheKey(USER_ID))).toBeTruthy()
    expect(readWeeklyEarningsCache(storage, USER_ID)?.profile).toEqual({ activePlayerProfileId: 'player-1' })
  })

  it('returns null for invalid cache json', () => {
    expect(parseWeeklyEarningsCache('{invalid')).toBeNull()
    expect(parseWeeklyEarningsCache(JSON.stringify({ foo: 'bar' }))).toBeNull()
  })

  it('creates empty cache when missing', () => {
    const storage = {
      values: new Map<string, string>(),
      getItem() {
        return null
      },
      setItem() {},
    }

    const cache = readOrCreateWeeklyEarningsCache(storage, USER_ID)

    expect(cache.userId).toBe(USER_ID)
    expect(cache.profile).toBeNull()
  })
})
