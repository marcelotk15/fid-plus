import { describe, expect, it } from 'vitest'

import type { StorageLike } from './storage.types'

import { SUPABASE } from './consts'
import { readSupabaseAccessToken } from './supabase-auth'

function createMemoryStorage(initial: Record<string, string> = {}): StorageLike {
  const store = new Map(Object.entries(initial))

  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value)
    },
  }
}

describe('supabase-auth', () => {
  it('returns access token when auth is valid', () => {
    const storage = createMemoryStorage({
      [SUPABASE.AUTH_STORAGE_KEY]: JSON.stringify({
        access_token: 'valid-token',
        token_type: 'bearer',
        expires_at: 4_000_000_000,
      }),
    })

    expect(readSupabaseAccessToken(storage, 1_700_000_000_000)).toBe('valid-token')
  })

  it('returns null when auth key is missing', () => {
    const storage = createMemoryStorage()

    expect(readSupabaseAccessToken(storage)).toBeNull()
  })

  it('returns null when JSON is invalid', () => {
    const storage = createMemoryStorage({
      [SUPABASE.AUTH_STORAGE_KEY]: '{invalid',
    })

    expect(readSupabaseAccessToken(storage)).toBeNull()
  })

  it('returns null when access token is empty', () => {
    const storage = createMemoryStorage({
      [SUPABASE.AUTH_STORAGE_KEY]: JSON.stringify({
        access_token: '',
        token_type: 'bearer',
      }),
    })

    expect(readSupabaseAccessToken(storage)).toBeNull()
  })

  it('returns null when token is expired', () => {
    const storage = createMemoryStorage({
      [SUPABASE.AUTH_STORAGE_KEY]: JSON.stringify({
        access_token: 'expired-token',
        token_type: 'bearer',
        expires_at: 1_700_000_000,
      }),
    })

    expect(readSupabaseAccessToken(storage, 1_700_000_100_000)).toBeNull()
  })

  it('returns token when expires_at is missing', () => {
    const storage = createMemoryStorage({
      [SUPABASE.AUTH_STORAGE_KEY]: JSON.stringify({
        access_token: 'no-expiry-token',
        token_type: 'bearer',
      }),
    })

    expect(readSupabaseAccessToken(storage)).toBe('no-expiry-token')
  })
})
