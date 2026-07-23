import { useMemo } from 'react'

import type { SupabaseSession, SupabaseUser } from '~/modules/shared/supabase-auth.types'

import { SUPABASE } from '~/modules/shared/consts'
import { readSupabaseSessionFromRaw } from '~/modules/shared/supabase-auth'

import { useStorageItem } from './use-storage-item'

export type AuthUserState = {
  user: SupabaseUser | null
  accessToken: string | null
  session: SupabaseSession | null
  isLoggedIn: boolean
}

export function useAuthUser(): AuthUserState {
  const raw = useStorageItem(SUPABASE.AUTH_STORAGE_KEY)

  return useMemo(() => {
    const session = readSupabaseSessionFromRaw(raw)

    return {
      user: session?.user ?? null,
      accessToken: session?.accessToken ?? null,
      session,
      isLoggedIn: session !== null,
    }
  }, [raw])
}
