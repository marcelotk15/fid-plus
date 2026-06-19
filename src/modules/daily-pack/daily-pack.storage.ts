import type { StorageLike } from '~/modules/shared/storage.types'

import { DAILY_PACK } from '~/modules/shared/consts'

import type { DailyPackCache } from './daily-pack.types'

function parseCacheValue(raw: string): DailyPackCache | null {
  try {
    const parsed: unknown = JSON.parse(raw)

    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'nextResetAt' in parsed &&
      typeof (parsed as DailyPackCache).nextResetAt === 'string'
    ) {
      const nextResetAt = (parsed as DailyPackCache).nextResetAt
      const date = new Date(nextResetAt)

      if (Number.isNaN(date.getTime())) return null

      const claimedToday =
        'claimedToday' in parsed && typeof (parsed as DailyPackCache).claimedToday === 'boolean'
          ? (parsed as DailyPackCache).claimedToday
          : true

      return { nextResetAt, claimedToday }
    }

    if (typeof parsed === 'string') {
      const date = new Date(parsed)

      if (Number.isNaN(date.getTime())) return null

      return { nextResetAt: parsed, claimedToday: true }
    }
  } catch {
    return null
  }

  return null
}

export function readDailyPackCache(storage: StorageLike): DailyPackCache | null {
  const raw = storage.getItem(DAILY_PACK.CACHE_STORAGE_KEY)

  if (!raw) return null

  return parseCacheValue(raw)
}

export function saveDailyPackCache(
  storage: StorageLike,
  nextResetAt: string,
  claimedToday: boolean,
): void {
  const date = new Date(nextResetAt)

  if (Number.isNaN(date.getTime())) return

  storage.setItem(
    DAILY_PACK.CACHE_STORAGE_KEY,
    JSON.stringify({ nextResetAt, claimedToday }),
  )
}

export function isDailyPackCacheValid(cache: DailyPackCache, now = new Date()): boolean {
  const resetAt = new Date(cache.nextResetAt)

  if (Number.isNaN(resetAt.getTime())) return false

  return now.getTime() < resetAt.getTime()
}
