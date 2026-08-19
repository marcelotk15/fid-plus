import { useEffect, useRef, useState } from 'react'

import type { FetchError } from '~/modules/shared/fetch.types'

import { useAuthUser } from '~/modules/shared/react/hooks'

import type { StoreItem } from './store-items.types'

import { fetchStoreItemsWithMeta } from './store-items-api'

export type StoreItemsState = {
  items: StoreItem[]
  loading: boolean
  error: FetchError | 'no_token' | null
}

export function useStoreItems(): StoreItemsState {
  const { isLoggedIn, accessToken } = useAuthUser()
  const [items, setItems] = useState<StoreItem[]>([])
  const [loading, setLoading] = useState(() => Boolean(isLoggedIn && accessToken))
  const [error, setError] = useState<FetchError | 'no_token' | null>(null)
  const fetchIdRef = useRef(0)

  useEffect(() => {
    if (!isLoggedIn) {
      setItems([])
      setLoading(false)
      setError(null)
      return
    }

    if (!accessToken) {
      setItems([])
      setLoading(false)
      setError('no_token')
      return
    }

    const fetchId = ++fetchIdRef.current

    setLoading(true)
    setError(null)

    void fetchStoreItemsWithMeta(accessToken).then((result) => {
      if (fetchId !== fetchIdRef.current) return

      setLoading(false)
      setItems(result.data)
      setError(result.error ?? null)
    })
  }, [accessToken, isLoggedIn])

  return { items, loading, error }
}
