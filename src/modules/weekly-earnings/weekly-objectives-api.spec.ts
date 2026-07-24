import { describe, expect, it, vi } from 'vitest'

import { WEEKLY_OBJECTIVES_ENDPOINT } from '~/modules/shared/consts'
import { buildSupabaseHeaders } from '~/modules/shared/supabase-headers'

import { fetchWeeklyObjectivesWithMeta, parseWeeklyObjectivesBody } from './weekly-objectives-api'
import { SAMPLE_WEEKLY_OBJECTIVES_PAYLOAD } from './weekly-objectives.fixture'

describe('weekly-objectives-api', () => {
  it('parses sample weekly objectives payload', () => {
    const result = parseWeeklyObjectivesBody(SAMPLE_WEEKLY_OBJECTIVES_PAYLOAD)

    expect(result).toEqual({
      objectives: [
        {
          key: 'perfect_minigame_score_week',
          rewardMoney: 1000,
          targetCount: 1,
          currentCount: 1,
          completedAt: '2026-06-29T03:22:19.93785+00:00',
        },
        {
          key: 'vote_2_mvps',
          rewardMoney: 500,
          targetCount: 2,
          currentCount: 2,
          completedAt: '2026-06-29T23:51:56.051206+00:00',
        },
        {
          key: 'watch_2_replays',
          rewardMoney: 500,
          targetCount: 2,
          currentCount: 2,
          completedAt: '2026-06-29T23:52:47.579606+00:00',
        },
        {
          key: 'play_15_minigames_week',
          rewardMoney: 700,
          targetCount: 15,
          currentCount: 15,
          completedAt: '2026-07-03T03:44:11.908131+00:00',
        },
        {
          key: 'complete_dailies_perfect',
          rewardMoney: 1000,
          targetCount: 7,
          currentCount: 5,
          completedAt: null,
        },
        {
          key: 'play_2_league_matches',
          rewardMoney: 500,
          targetCount: 2,
          currentCount: 1,
          completedAt: null,
        },
        {
          key: 'play_2_pickup_matches',
          rewardMoney: 500,
          targetCount: 2,
          currentCount: 1,
          completedAt: null,
        },
        {
          key: 'team_training_week',
          rewardMoney: 500,
          targetCount: 1,
          currentCount: 0,
          completedAt: null,
        },
        {
          key: 'train_14_attributes',
          rewardMoney: 500,
          targetCount: 14,
          currentCount: 13,
          completedAt: null,
        },
        {
          key: 'use_daily_shop_3x',
          rewardMoney: 500,
          targetCount: 3,
          currentCount: 0,
          completedAt: null,
        },
      ],
      weekStart: '2026-06-29',
      completedCount: 4,
      milestone5Credited: false,
      milestone10Credited: false,
    })
  })

  it('returns parsed response from fetch', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => SAMPLE_WEEKLY_OBJECTIVES_PAYLOAD,
    })

    const result = await fetchWeeklyObjectivesWithMeta('token', fetchImpl)

    expect(result.data?.completedCount).toBe(4)
    expect(result.data?.objectives).toHaveLength(10)
    expect(fetchImpl).toHaveBeenCalledWith(WEEKLY_OBJECTIVES_ENDPOINT, {
      method: 'POST',
      headers: buildSupabaseHeaders('token'),
      body: JSON.stringify({}),
    })
  })

  it('returns http error metadata', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({}),
    })

    const result = await fetchWeeklyObjectivesWithMeta('token', fetchImpl)

    expect(result).toEqual({ data: null, error: 'http', status: 401 })
  })

  it('returns parse error metadata', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ invalid: true }),
    })

    const result = await fetchWeeklyObjectivesWithMeta('token', fetchImpl)

    expect(result).toEqual({ data: null, error: 'parse', status: 200 })
  })
})
