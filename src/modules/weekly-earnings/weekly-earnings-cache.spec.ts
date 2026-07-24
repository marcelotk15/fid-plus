import { describe, expect, it } from 'vitest'

import { formatMoney } from './format-currency'
import { getCurrentWeekStartKey } from './week-range'
import {
  buildWeeklyEarningsFromCache,
  getStaleSlices,
  ingestWeeklyEarningsFromPage,
  mergeProfileSlice,
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

describe('weekly-earnings-cache', () => {
  it('marks objectives stale when week changes', () => {
    const objectives = parseWeeklyObjectivesBody(SAMPLE_WEEKLY_OBJECTIVES_PAYLOAD)

    expect(objectives).not.toBeNull()
    if (!objectives) return

    const cache = {
      ...createEmptyWeeklyEarningsCache(USER_ID, NOW),
      profile: { activePlayerProfileId: PLAYER_PROFILE_ID },
      playerProfileId: PLAYER_PROFILE_ID,
      contract: {
        salary: 2500,
        contractId: 'contract-1',
        createdAt: '2026-07-01T00:00:00.000Z',
        playerProfileId: PLAYER_PROFILE_ID,
      },
      sponsorships: {
        weeklyTotal: 250,
        fetchedAt: NOW.toISOString(),
        playerProfileId: PLAYER_PROFILE_ID,
      },
      objectives,
    }

    expect(getStaleSlices(cache, USER_ID, NOW)).toEqual([])
    expect(getStaleSlices(cache, USER_ID, new Date('2026-07-07T00:00:00.000Z'))).toContain('objectives')
  })

  it('builds weekly earnings from cache document', () => {
    const objectives = parseWeeklyObjectivesBody(SAMPLE_WEEKLY_OBJECTIVES_PAYLOAD)

    expect(objectives).not.toBeNull()
    if (!objectives) return

    const earnings = buildWeeklyEarningsFromCache(
      {
        ...createEmptyWeeklyEarningsCache(USER_ID, NOW),
        profile: { activePlayerProfileId: PLAYER_PROFILE_ID },
        playerProfileId: PLAYER_PROFILE_ID,
        contract: {
          salary: 2500,
          contractId: 'contract-1',
          createdAt: '2026-07-01T00:00:00.000Z',
          playerProfileId: PLAYER_PROFILE_ID,
        },
        sponsorships: {
          weeklyTotal: 250,
          fetchedAt: NOW.toISOString(),
          playerProfileId: PLAYER_PROFILE_ID,
        },
        objectives,
      },
      NOW,
    )

    expect(earnings?.salary).toBe(2500)
    expect(earnings?.sponsorship).toBe(250)
    expect(earnings?.objectives).toHaveLength(10)
    expect(earnings?.salaryBonus?.value).toBe(formatMoney(2500))
    expect(earnings?.salaryBonus?.status).toBe('in_progress')
    expect(earnings?.totals.earned).toBe(5450)
  })

  it('clears contract and sponsorships when player profile changes', () => {
    const cache = {
      ...createEmptyWeeklyEarningsCache(USER_ID, NOW),
      playerProfileId: 'old-player',
      profile: { activePlayerProfileId: 'old-player' },
      contract: {
        salary: 2500,
        contractId: 'contract-1',
        createdAt: '2026-07-01T00:00:00.000Z',
        playerProfileId: 'old-player',
      },
      sponsorships: {
        weeklyTotal: 250,
        fetchedAt: NOW.toISOString(),
        playerProfileId: 'old-player',
      },
    }

    const merged = mergeProfileSlice(cache, PLAYER_PROFILE_ID)

    expect(merged.profile).toEqual({ activePlayerProfileId: PLAYER_PROFILE_ID })
    expect(merged.contract).toBeNull()
    expect(merged.sponsorships).toBeNull()
  })

  it('ingests objectives intercept payload into storage', () => {
    const storage = createMemoryStorage()

    ingestWeeklyEarningsFromPage(
      storage,
      {
        type: 'objectives',
        userId: USER_ID,
        body: SAMPLE_WEEKLY_OBJECTIVES_PAYLOAD,
      },
      NOW,
    )

    const cache = JSON.parse(storage.getItem(`fid-plus:weekly-earnings:${USER_ID}`) ?? '{}')

    expect(cache.objectives.weekStart).toBe(getCurrentWeekStartKey(NOW))
    expect(cache.objectives.completedCount).toBe(4)
  })
})
