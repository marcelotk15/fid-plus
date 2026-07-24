import { describe, expect, it, vi } from 'vitest'

import { fetchWeeklyEarningsWithMeta } from './weekly-earnings-api'
import {
  mergeContractSlice,
  mergeObjectivesSlice,
  mergeProfileSlice,
  mergeSponsorshipsSlice,
} from './weekly-earnings-cache'
import { createEmptyWeeklyEarningsCache } from './weekly-earnings-cache.types'
import { parseWeeklyObjectivesBody } from './weekly-objectives-api'
import { SAMPLE_WEEKLY_OBJECTIVES_PAYLOAD } from './weekly-objectives.fixture'

const USER_ID = '333c3d91-402f-4814-938f-0d185f2ddc28'
const PLAYER_PROFILE_ID = 'c5075e8e-e5cc-455d-a566-7b1cacb2341b'
const NOW = new Date('2026-07-03T03:48:21.938Z')

function createMemoryStorage() {
  const values = new Map<string, string>()

  return {
    getItem(key: string) {
      return values.get(key) ?? null
    },
    setItem(key: string, value: string) {
      values.set(key, value)
    },
  }
}

function createFullCache() {
  const objectives = parseWeeklyObjectivesBody(SAMPLE_WEEKLY_OBJECTIVES_PAYLOAD)

  if (!objectives) throw new Error('invalid objectives fixture')

  let cache = createEmptyWeeklyEarningsCache(USER_ID, NOW)
  cache = mergeProfileSlice(cache, PLAYER_PROFILE_ID)
  cache = mergeContractSlice(cache, {
    id: 'contract-1',
    playerProfileId: PLAYER_PROFILE_ID,
    salary: 2500,
    createdAt: '2026-07-01T00:00:00.000Z',
  })
  cache = mergeSponsorshipsSlice(cache, PLAYER_PROFILE_ID, 250, NOW)
  cache = mergeObjectivesSlice(cache, objectives)

  return cache
}

describe('weekly-earnings-api', () => {
  it('returns cached earnings without fetching when cache is fresh', async () => {
    const fetchImpl = vi.fn()
    const cache = createFullCache()

    const result = await fetchWeeklyEarningsWithMeta('token', USER_ID, {
      fetchImpl,
      now: NOW,
      storage: createMemoryStorage(),
      cache,
      slices: [],
    })

    expect(fetchImpl).not.toHaveBeenCalled()
    expect(result.data?.salary).toBe(2500)
    expect(result.data?.totals.earned).toBe(5450)
  })

  it('fetches only stale slices from partial cache', async () => {
    const objectives = parseWeeklyObjectivesBody(SAMPLE_WEEKLY_OBJECTIVES_PAYLOAD)

    if (!objectives) throw new Error('invalid objectives fixture')

    let cache = createEmptyWeeklyEarningsCache(USER_ID, NOW)
    cache = mergeObjectivesSlice(cache, objectives)

    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ id: USER_ID, active_player_profile_id: PLAYER_PROFILE_ID }],
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [
          {
            id: 'contract-1',
            player_profile_id: PLAYER_PROFILE_ID,
            created_at: '2026-07-01T00:00:00.000Z',
            salary: 2500,
          },
        ],
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [
          {
            id: 'sponsor-1',
            player_profile_id: PLAYER_PROFILE_ID,
            weekly_value: 250,
            status: 'active',
          },
        ],
      })

    const result = await fetchWeeklyEarningsWithMeta('token', USER_ID, {
      fetchImpl,
      now: NOW,
      storage: createMemoryStorage(),
      cache,
      slices: ['profile', 'contract', 'sponsorships'],
    })

    expect(fetchImpl).toHaveBeenCalledTimes(3)
    expect(result.data?.salary).toBe(2500)
    expect(result.data?.sponsorship).toBe(250)
    expect(result.data?.objectives).toHaveLength(10)
  })

  it('fetches profile, contract, sponsorship and objectives when cache is empty', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ id: USER_ID, active_player_profile_id: PLAYER_PROFILE_ID }],
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [
          {
            id: 'contract-1',
            player_profile_id: PLAYER_PROFILE_ID,
            created_at: '2026-07-01T00:00:00.000Z',
            salary: 2500,
          },
        ],
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [
          {
            id: 'sponsor-1',
            player_profile_id: PLAYER_PROFILE_ID,
            weekly_value: 250,
            status: 'active',
          },
        ],
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => SAMPLE_WEEKLY_OBJECTIVES_PAYLOAD,
      })

    const result = await fetchWeeklyEarningsWithMeta('token', USER_ID, {
      fetchImpl,
      now: NOW,
      storage: createMemoryStorage(),
    })

    expect(result.data?.salary).toBe(2500)
    expect(fetchImpl).toHaveBeenCalledTimes(4)
  })

  it('returns profile error without fetching contract when profile is missing', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [],
    })

    const result = await fetchWeeklyEarningsWithMeta('token', USER_ID, {
      fetchImpl,
      now: NOW,
      storage: createMemoryStorage(),
    })

    expect(result).toEqual({ data: null, error: 'profile_not_found', status: 200 })
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it('returns fixed earnings with objectives error when objectives fetch fails', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ id: USER_ID, active_player_profile_id: PLAYER_PROFILE_ID }],
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [
          {
            id: 'contract-1',
            player_profile_id: PLAYER_PROFILE_ID,
            created_at: '2026-07-01T00:00:00.000Z',
            salary: 2500,
          },
        ],
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [
          {
            id: 'sponsor-1',
            player_profile_id: PLAYER_PROFILE_ID,
            weekly_value: 250,
            status: 'active',
          },
        ],
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      })

    const result = await fetchWeeklyEarningsWithMeta('token', USER_ID, {
      fetchImpl,
      now: NOW,
      storage: createMemoryStorage(),
    })

    expect(result.data?.salary).toBe(2500)
    expect(result.data?.sponsorship).toBe(250)
    expect(result.data?.objectivesError).toBe('http')
    expect(result.data?.totals.earned).toBe(2750)
  })
})
