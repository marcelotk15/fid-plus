import type { FetchLike } from '~/modules/shared/fetch.types'

import { WEEKLY_OBJECTIVES_ENDPOINT } from '~/modules/shared/consts'
import { buildSupabaseHeaders } from '~/modules/shared/supabase-headers'

import type { FetchWeeklyObjectivesResult, WeeklyObjective, WeeklyObjectivesResponse } from './weekly-objectives.types'

function parseObjective(value: unknown): WeeklyObjective | null {
  if (typeof value !== 'object' || value === null) return null

  const row = value as Record<string, unknown>

  if (
    typeof row.objective_key !== 'string' ||
    typeof row.reward_money !== 'number' ||
    typeof row.target_count !== 'number' ||
    typeof row.current_count !== 'number'
  ) {
    return null
  }

  const completedAt = row.completed_at

  return {
    key: row.objective_key,
    rewardMoney: row.reward_money,
    targetCount: row.target_count,
    currentCount: row.current_count,
    completedAt: completedAt === null || typeof completedAt === 'string' ? completedAt : null,
  }
}

export function parseWeeklyObjectivesBody(value: unknown): WeeklyObjectivesResponse | null {
  if (typeof value !== 'object' || value === null) return null

  const response = value as Record<string, unknown>

  if (!Array.isArray(response.objectives)) return null
  if (typeof response.week_start !== 'string') return null
  if (typeof response.completed_count !== 'number') return null
  if (typeof response.milestone_5_credited !== 'boolean') return null
  if (typeof response.milestone_10_credited !== 'boolean') return null

  const objectives = response.objectives
    .map(parseObjective)
    .filter((objective): objective is WeeklyObjective => objective !== null)

  if (objectives.length !== response.objectives.length) return null

  return {
    objectives,
    weekStart: response.week_start,
    completedCount: response.completed_count,
    milestone5Credited: response.milestone_5_credited,
    milestone10Credited: response.milestone_10_credited,
  }
}

export async function fetchWeeklyObjectivesWithMeta(
  accessToken: string,
  fetchImpl: FetchLike = globalThis.fetch.bind(globalThis),
): Promise<FetchWeeklyObjectivesResult> {
  try {
    const response = await fetchImpl(WEEKLY_OBJECTIVES_ENDPOINT, {
      method: 'POST',
      headers: buildSupabaseHeaders(accessToken),
      body: JSON.stringify({}),
    })

    if (!response.ok) {
      return { data: null, error: 'http', status: response.status }
    }

    const body: unknown = await response.json()
    const data = parseWeeklyObjectivesBody(body)

    if (!data) {
      return { data: null, error: 'parse', status: response.status }
    }

    return { data, status: response.status }
  } catch {
    return { data: null, error: 'network' }
  }
}

export async function fetchWeeklyObjectives(
  accessToken: string,
  fetchImpl: FetchLike = globalThis.fetch.bind(globalThis),
): Promise<WeeklyObjectivesResponse | null> {
  const result = await fetchWeeklyObjectivesWithMeta(accessToken, fetchImpl)
  return result.data
}
