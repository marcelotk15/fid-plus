import type { StorageLike } from './storage.types'
import type { SupabaseStoredAuth } from './supabase-auth.types'

import { SUPABASE } from './consts'

function isValidAuthPayload(value: unknown): value is SupabaseStoredAuth {
  if (typeof value !== 'object' || value === null) return false

  const auth = value as SupabaseStoredAuth

  return typeof auth.access_token === 'string' && auth.access_token.length > 0
}

function isTokenExpired(expiresAt: number, nowMs: number): boolean {
  return nowMs / 1000 >= expiresAt
}

export function readSupabaseAccessToken(storage: StorageLike, nowMs = Date.now()): string | null {
  const raw = storage.getItem(SUPABASE.AUTH_STORAGE_KEY)

  if (!raw) return null

  try {
    const parsed: unknown = JSON.parse(raw)

    if (!isValidAuthPayload(parsed)) return null

    if (typeof parsed.expires_at === 'number' && isTokenExpired(parsed.expires_at, nowMs)) {
      return null
    }

    return parsed.access_token
  } catch {
    return null
  }
}
