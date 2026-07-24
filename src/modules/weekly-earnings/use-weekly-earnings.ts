import { useEffect, useMemo, useRef, useState } from 'react'

import { weeklyEarningsCacheKey } from '~/modules/shared/consts'
import { useAuthUser, useStorageItem } from '~/modules/shared/react/hooks'

import type { PlayerSalaryError } from './contracts.types'
import type { WeeklyEarnings } from './weekly-earnings.types'

import { fetchWeeklyEarningsWithMeta } from './weekly-earnings-api'
import { buildWeeklyEarningsFromCache, getStaleSlices } from './weekly-earnings-cache'
import { parseWeeklyEarningsCache } from './weekly-earnings.storage'

export type WeeklyEarningsState = {
  earnings: WeeklyEarnings | null
  loading: boolean
  error: PlayerSalaryError | null
}

export function useWeeklyEarnings(): WeeklyEarningsState {
  const { isLoggedIn, accessToken, user } = useAuthUser()
  const cacheKey = user?.id ? weeklyEarningsCacheKey(user.id) : null
  const rawCache = useStorageItem(cacheKey ?? '__weekly-earnings-cache-disabled__')
  const cache = useMemo(() => {
    if (!user?.id || !cacheKey) return null

    return parseWeeklyEarningsCache(rawCache)
  }, [cacheKey, rawCache, user?.id])

  const [earnings, setEarnings] = useState<WeeklyEarnings | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<PlayerSalaryError | null>(null)
  const fetchIdRef = useRef(0)

  useEffect(() => {
    if (!isLoggedIn) {
      setEarnings(null)
      setLoading(false)
      setError(null)
      return
    }

    if (!accessToken || !user?.id) {
      setEarnings(null)
      setLoading(false)
      setError('no_token')
      return
    }

    const cachedEarnings = cache ? buildWeeklyEarningsFromCache(cache) : null
    const staleSlices = getStaleSlices(cache, user.id)
    const hasCacheToShow = cachedEarnings !== null
    const fetchId = ++fetchIdRef.current

    if (hasCacheToShow) {
      setEarnings(cachedEarnings)
      setError(null)
      setLoading(false)
    } else {
      setLoading(true)
      setError(null)
    }

    if (staleSlices.length === 0) {
      return
    }

    if (!hasCacheToShow) {
      setLoading(true)
    }

    void fetchWeeklyEarningsWithMeta(accessToken, user.id, { cache, slices: staleSlices }).then((result) => {
      if (fetchId !== fetchIdRef.current) return

      if (result.data) {
        setEarnings(result.data)
        setError(null)
      } else if (!hasCacheToShow) {
        setEarnings(null)
        setError(result.error ?? 'parse')
      }

      setLoading(false)
    })

    return () => {
      fetchIdRef.current += 1
    }
  }, [accessToken, cache, isLoggedIn, user?.id])

  return { earnings, loading, error }
}
