import { DAILY_PACK_ENDPOINT, SUPABASE } from '~/modules/shared/consts'

import type { DailyPackStatusResponse, FetchLike } from './daily-pack.types'

export type FetchDailyPackError = 'http' | 'parse' | 'network'

export type FetchDailyPackResult = {
  data: DailyPackStatusResponse | null
  error?: FetchDailyPackError
  status?: number
}

export function parseDailyPackStatusBody(value: unknown): DailyPackStatusResponse | null {
  if (typeof value !== 'object' || value === null) return null

  const response = value as Record<string, unknown>
  const claimedToday = parseClaimedToday(response.claimed_today)

  if (claimedToday === null) return null

  if (!claimedToday) {
    return { claimed_today: false }
  }

  if (
    typeof response.reward_type !== 'string' ||
    typeof response.next_reset_at !== 'string' ||
    typeof response.reward_value !== 'object' ||
    response.reward_value === null ||
    typeof (response.reward_value as { amount?: unknown }).amount !== 'number'
  ) {
    return null
  }

  return {
    claimed_today: true,
    reward_type: response.reward_type,
    reward_value: response.reward_value as Record<string, unknown>,
    next_reset_at: response.next_reset_at,
  }
}

function parseClaimedToday(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value
  if (value === 'true') return true
  if (value === 'false') return false
  return null
}

export function buildDailyPackHeaders(accessToken: string): HeadersInit {
  return {
    accept: '*/*',
    apikey: SUPABASE.PUBLIC_API_KEY,
    authorization: `Bearer ${accessToken}`,
    'content-profile': 'public',
    'content-type': 'application/json',
    'x-client-info': SUPABASE.CLIENT_INFO,
  }
}

export async function fetchDailyPackStatusWithMeta(
  accessToken: string,
  fetchImpl: FetchLike = globalThis.fetch.bind(globalThis),
): Promise<FetchDailyPackResult> {
  try {
    const response = await fetchImpl(DAILY_PACK_ENDPOINT, {
      method: 'POST',
      headers: buildDailyPackHeaders(accessToken),
      body: JSON.stringify({}),
    })

    if (!response.ok) {
      return { data: null, error: 'http', status: response.status }
    }

    const body: unknown = await response.json()
    const data = parseDailyPackStatusBody(body)

    if (!data) {
      return { data: null, error: 'parse', status: response.status }
    }

    return { data, status: response.status }
  } catch {
    return { data: null, error: 'network' }
  }
}

export async function fetchDailyPackStatus(
  accessToken: string,
  fetchImpl: FetchLike = globalThis.fetch.bind(globalThis),
): Promise<DailyPackStatusResponse | null> {
  const result = await fetchDailyPackStatusWithMeta(accessToken, fetchImpl)
  return result.data
}
