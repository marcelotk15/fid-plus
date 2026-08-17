import type { FetchLike } from '~/modules/shared/fetch.types'
import type { StorageLike } from '~/modules/shared/storage.types'

import type { PlayerSalaryError } from './contracts.types'
import type { WeeklyEarningsCache, WeeklyEarningsCacheSlice } from './weekly-earnings-cache.types'
import type { FetchWeeklyEarningsResult, WeeklyEarnings } from './weekly-earnings.types'

import { fetchLatestContractWithMeta } from './contracts-api'
import { fetchActivePlayerProfileIdWithMeta } from './profiles-api'
import { fetchActiveSponsorshipWeeklyTotalWithMeta } from './sponsorships-api'
import {
  buildWeeklyEarningsFromCache,
  getStaleSlices,
  mergeContractSlice,
  mergeObjectivesSlice,
  mergeProfileSlice,
  mergeSponsorshipsSlice,
  resolvePlayerProfileId,
} from './weekly-earnings-cache'
import {
  readOrCreateWeeklyEarningsCache,
  readWeeklyEarningsCache,
  writeWeeklyEarningsCache,
} from './weekly-earnings.storage'
import { fetchWeeklyObjectivesWithMeta } from './weekly-objectives-api'

export type { FetchWeeklyEarningsResult, WeeklyEarnings } from './weekly-earnings.types'

export type FetchWeeklyEarningsOptions = {
  fetchImpl?: FetchLike
  now?: Date
  storage?: StorageLike
  cache?: WeeklyEarningsCache | null
  slices?: WeeklyEarningsCacheSlice[]
}

function buildResultFromCache(
  cache: WeeklyEarningsCache,
  objectivesError?: WeeklyEarnings['objectivesError'],
): FetchWeeklyEarningsResult | null {
  const earnings = buildWeeklyEarningsFromCache(cache)

  if (!earnings) return null

  return {
    data: {
      ...earnings,
      objectivesError,
    },
  }
}

export async function fetchWeeklyEarningsWithMeta(
  accessToken: string,
  userId: string,
  options: FetchWeeklyEarningsOptions = {},
): Promise<FetchWeeklyEarningsResult> {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis)
  const now = options.now ?? new Date()
  const storage = options.storage ?? globalThis.localStorage
  const existingCache = options.cache ?? readWeeklyEarningsCache(storage, userId)
  const slicesToFetch = options.slices ?? getStaleSlices(existingCache, userId, now)

  if (slicesToFetch.length === 0 && existingCache) {
    const cached = buildResultFromCache(existingCache)

    if (cached) return cached
  }

  let cache = existingCache ?? readOrCreateWeeklyEarningsCache(storage, userId, now)
  let playerProfileId = resolvePlayerProfileId(cache)
  let contractError: PlayerSalaryError | undefined
  let objectivesError: WeeklyEarnings['objectivesError']
  let status: number | undefined

  if (slicesToFetch.includes('profile')) {
    const profileResult = await fetchActivePlayerProfileIdWithMeta(accessToken, userId, fetchImpl)

    status = profileResult.status

    if (!profileResult.data) {
      const cached = buildResultFromCache(cache)

      if (cached) return cached

      return {
        data: null,
        error: profileResult.error ?? 'parse',
        status: profileResult.status,
      }
    }

    cache = writeWeeklyEarningsCache(storage, mergeProfileSlice(cache, profileResult.data), now)
    playerProfileId = profileResult.data
  }

  if (!playerProfileId) {
    const cached = buildResultFromCache(cache)

    if (cached) return cached

    return { data: null, error: 'no_player_profile', status }
  }

  const fetches: Promise<void>[] = []

  if (slicesToFetch.includes('contract')) {
    fetches.push(
      fetchLatestContractWithMeta(accessToken, playerProfileId, fetchImpl).then((contractResult) => {
        status = contractResult.status

        if (contractResult.data) {
          cache = mergeContractSlice(cache, contractResult.data)
          return
        }

        contractError = contractResult.error ?? 'parse'
      }),
    )
  }

  if (slicesToFetch.includes('sponsorships')) {
    fetches.push(
      fetchActiveSponsorshipWeeklyTotalWithMeta(accessToken, playerProfileId, fetchImpl, now).then(
        (sponsorshipResult) => {
          status = sponsorshipResult.status

          cache = mergeSponsorshipsSlice(cache, playerProfileId!, sponsorshipResult.data, now)
        },
      ),
    )
  }

  if (slicesToFetch.includes('objectives')) {
    fetches.push(
      fetchWeeklyObjectivesWithMeta(accessToken, fetchImpl).then((objectivesResult) => {
        status = objectivesResult.status

        if (objectivesResult.data) {
          cache = mergeObjectivesSlice(cache, objectivesResult.data)
          return
        }

        objectivesError = objectivesResult.error
      }),
    )
  }

  await Promise.all(fetches)

  cache = writeWeeklyEarningsCache(storage, cache, now)

  if (!cache.contract) {
    const hadContractInCache = existingCache?.contract !== null && existingCache?.contract !== undefined

    if (!hadContractInCache || slicesToFetch.includes('contract')) {
      return {
        data: null,
        error: contractError ?? 'not_found',
        status,
      }
    }
  }

  const result = buildResultFromCache(cache, objectivesError)

  if (!result) {
    return {
      data: null,
      error: contractError ?? 'not_found',
      status,
    }
  }

  return { ...result, status }
}

/** @deprecated Use fetchWeeklyEarningsWithMeta */
export async function fetchWeeklyFixedEarningsWithMeta(
  accessToken: string,
  userId: string,
  options: FetchWeeklyEarningsOptions = {},
): Promise<FetchWeeklyEarningsResult> {
  return fetchWeeklyEarningsWithMeta(accessToken, userId, options)
}
