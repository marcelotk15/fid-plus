import type { StorageLike } from './storage.types'
import type { SupabaseSession, SupabaseStoredAuth, SupabaseUser } from './supabase-auth.types'

import { SUPABASE } from './consts'

function isValidUser(value: unknown): value is SupabaseUser {
  if (typeof value !== 'object' || value === null) return false

  return typeof (value as SupabaseUser).id === 'string' && (value as SupabaseUser).id.length > 0
}

function isValidAuthPayload(value: unknown): value is SupabaseStoredAuth {
  if (typeof value !== 'object' || value === null) return false

  const auth = value as SupabaseStoredAuth

  return typeof auth.access_token === 'string' && auth.access_token.length > 0
}

function isTokenExpired(expiresAt: number, nowMs: number): boolean {
  return nowMs / 1000 >= expiresAt
}

function parseStoredAuth(raw: string | null): SupabaseStoredAuth | null {
  if (!raw) return null

  try {
    const parsed: unknown = JSON.parse(raw)

    if (!isValidAuthPayload(parsed)) return null

    return parsed
  } catch {
    return null
  }
}

function isAuthExpired(auth: SupabaseStoredAuth, nowMs: number): boolean {
  return typeof auth.expires_at === 'number' && isTokenExpired(auth.expires_at, nowMs)
}

export function readSupabaseAccessToken(storage: StorageLike, nowMs = Date.now()): string | null {
  const auth = parseStoredAuth(storage.getItem(SUPABASE.AUTH_STORAGE_KEY))

  if (!auth || isAuthExpired(auth, nowMs)) return null

  return auth.access_token
}

export function readSupabaseSessionFromRaw(raw: string | null, nowMs = Date.now()): SupabaseSession | null {
  const auth = parseStoredAuth(raw)

  if (!auth || isAuthExpired(auth, nowMs)) return null
  if (!isValidUser(auth.user)) return null

  return {
    accessToken: auth.access_token,
    user: auth.user,
    expiresAt: auth.expires_at,
  }
}

export function readSupabaseSession(storage: StorageLike, nowMs = Date.now()): SupabaseSession | null {
  return readSupabaseSessionFromRaw(storage.getItem(SUPABASE.AUTH_STORAGE_KEY), nowMs)
}
