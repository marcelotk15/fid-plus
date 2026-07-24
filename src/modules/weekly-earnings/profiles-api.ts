import { PROFILES, PROFILES_ENDPOINT } from '~/modules/shared/consts'
import { buildSupabaseHeaders } from '~/modules/shared/supabase-headers'

import type { FetchLike, FetchProfileError } from './contracts.types'

export type FetchProfileResult = {
  data: string | null
  error?: FetchProfileError
  status?: number
}

export function parseActivePlayerProfileId(value: unknown): string | null {
  if (typeof value !== 'object' || value === null) return null

  const row = value as Record<string, unknown>
  const activePlayerProfileId = row.active_player_profile_id

  if (activePlayerProfileId === null) return null
  if (typeof activePlayerProfileId !== 'string' || activePlayerProfileId.length === 0) return null

  return activePlayerProfileId
}

export function parseProfilesBody(value: unknown): string | null {
  if (!Array.isArray(value) || value.length === 0) return null
  return parseActivePlayerProfileId(value[0])
}

export function buildProfileUrl(userId: string): string {
  const url = new URL(PROFILES_ENDPOINT)

  url.searchParams.set('select', PROFILES.SELECT_FIELDS)
  url.searchParams.set('id', `eq.${userId}`)

  return url.toString()
}

export async function fetchActivePlayerProfileIdWithMeta(
  accessToken: string,
  userId: string,
  fetchImpl: FetchLike = globalThis.fetch.bind(globalThis),
): Promise<FetchProfileResult> {
  try {
    const response = await fetchImpl(buildProfileUrl(userId), {
      method: 'GET',
      headers: buildSupabaseHeaders(accessToken),
    })

    if (!response.ok) {
      return { data: null, error: 'http', status: response.status }
    }

    const body: unknown = await response.json()

    if (!Array.isArray(body) || body.length === 0) {
      return { data: null, error: 'profile_not_found', status: response.status }
    }

    const playerProfileId = parseActivePlayerProfileId(body[0])

    if (!playerProfileId) {
      return { data: null, error: 'no_player_profile', status: response.status }
    }

    return { data: playerProfileId, status: response.status }
  } catch {
    return { data: null, error: 'network' }
  }
}

export async function fetchActivePlayerProfileId(
  accessToken: string,
  userId: string,
  fetchImpl: FetchLike = globalThis.fetch.bind(globalThis),
): Promise<string | null> {
  const result = await fetchActivePlayerProfileIdWithMeta(accessToken, userId, fetchImpl)
  return result.data
}
