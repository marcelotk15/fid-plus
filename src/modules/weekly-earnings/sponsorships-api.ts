import { ACTIVE_SPONSORSHIPS_ENDPOINT } from '~/modules/shared/consts'
import { buildSupabaseHeaders } from '~/modules/shared/supabase-headers'

import type { FetchLike } from './contracts.types'

export type FetchSponsorshipResult = {
  data: number
  error?: 'http' | 'parse' | 'network'
  status?: number
}

function parseWeeklyValue(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null
  return value
}

export function parseActiveSponsorshipsBody(value: unknown): number {
  if (!Array.isArray(value)) return 0

  return value.reduce((total, item) => {
    if (typeof item !== 'object' || item === null) return total

    const weeklyValue = parseWeeklyValue((item as Record<string, unknown>).weekly_value)
    return weeklyValue === null ? total : total + weeklyValue
  }, 0)
}

export function buildActiveSponsorshipsUrl(playerProfileId: string, now = new Date()): string {
  const url = new URL(ACTIVE_SPONSORSHIPS_ENDPOINT)

  url.searchParams.set('select', '*')
  url.searchParams.set('player_profile_id', `eq.${playerProfileId}`)
  url.searchParams.set('status', 'eq.active')
  url.searchParams.set('expires_at', `gt.${now.toISOString()}`)

  return url.toString()
}

export async function fetchActiveSponsorshipWeeklyTotalWithMeta(
  accessToken: string,
  playerProfileId: string,
  fetchImpl: FetchLike = globalThis.fetch.bind(globalThis),
  now = new Date(),
): Promise<FetchSponsorshipResult> {
  try {
    const response = await fetchImpl(buildActiveSponsorshipsUrl(playerProfileId, now), {
      method: 'GET',
      headers: buildSupabaseHeaders(accessToken),
    })

    if (!response.ok) {
      return { data: 0, error: 'http', status: response.status }
    }

    const body: unknown = await response.json()

    if (!Array.isArray(body)) {
      return { data: 0, error: 'parse', status: response.status }
    }

    return { data: parseActiveSponsorshipsBody(body), status: response.status }
  } catch {
    return { data: 0, error: 'network' }
  }
}

export async function fetchActiveSponsorshipWeeklyTotal(
  accessToken: string,
  playerProfileId: string,
  fetchImpl: FetchLike = globalThis.fetch.bind(globalThis),
  now = new Date(),
): Promise<number> {
  const result = await fetchActiveSponsorshipWeeklyTotalWithMeta(accessToken, playerProfileId, fetchImpl, now)
  return result.data
}
