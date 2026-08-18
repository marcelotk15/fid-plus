import { useEffect, useRef, useState } from 'react'

import { useAuthUser } from '~/modules/shared/react/hooks'

import type { PlayerLoadout } from './store-items.types'

import { fetchPlayerLoadoutWithMeta } from './loadout-api'

export type PlayerLoadoutState = {
  loadout: PlayerLoadout | null
  loading: boolean
}

export function usePlayerLoadout(): PlayerLoadoutState {
  const { isLoggedIn, accessToken, user } = useAuthUser()
  const [loadout, setLoadout] = useState<PlayerLoadout | null>(null)
  const [loading, setLoading] = useState(() => Boolean(isLoggedIn && accessToken && user?.id))
  const fetchIdRef = useRef(0)

  useEffect(() => {
    if (!isLoggedIn) {
      setLoadout(null)
      setLoading(false)
      return
    }

    if (!accessToken || !user?.id) {
      setLoadout(null)
      setLoading(false)
      return
    }

    const fetchId = ++fetchIdRef.current

    setLoading(true)

    void fetchPlayerLoadoutWithMeta(accessToken, user.id).then((result) => {
      if (fetchId !== fetchIdRef.current) return

      setLoading(false)
      setLoadout(result.data ?? null)
    })
  }, [accessToken, isLoggedIn, user?.id])

  return { loadout, loading }
}
