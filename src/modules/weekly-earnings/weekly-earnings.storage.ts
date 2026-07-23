import type { StorageLike } from '~/modules/shared/storage.types'

import { weeklyEarningsCacheKey } from '~/modules/shared/consts'

import type { WeeklyEarningsCache } from './weekly-earnings-cache.types'

import { createEmptyWeeklyEarningsCache } from './weekly-earnings-cache.types'

function isWeeklyEarningsCache(value: unknown): value is WeeklyEarningsCache {
  if (typeof value !== 'object' || value === null) return false

  const cache = value as Record<string, unknown>

  return typeof cache.userId === 'string' && typeof cache.updatedAt === 'string'
}

export function parseWeeklyEarningsCache(raw: string | null): WeeklyEarningsCache | null {
  if (!raw) return null

  try {
    const parsed: unknown = JSON.parse(raw)

    if (!isWeeklyEarningsCache(parsed)) return null

    return parsed
  } catch {
    return null
  }
}

export function readWeeklyEarningsCache(storage: StorageLike, userId: string): WeeklyEarningsCache | null {
  return parseWeeklyEarningsCache(storage.getItem(weeklyEarningsCacheKey(userId)))
}

export function writeWeeklyEarningsCache(
  storage: StorageLike,
  cache: WeeklyEarningsCache,
  now = new Date(),
): WeeklyEarningsCache {
  const nextCache: WeeklyEarningsCache = {
    ...cache,
    updatedAt: now.toISOString(),
  }

  storage.setItem(weeklyEarningsCacheKey(cache.userId), JSON.stringify(nextCache))

  return nextCache
}

export function readOrCreateWeeklyEarningsCache(
  storage: StorageLike,
  userId: string,
  now = new Date(),
): WeeklyEarningsCache {
  return readWeeklyEarningsCache(storage, userId) ?? createEmptyWeeklyEarningsCache(userId, now)
}
