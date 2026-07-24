import type { StorageLike } from '~/modules/shared/storage.types'

type NotClaimedToday = {
  claimed_today: false
}

type ClaimedToday = {
  claimed_today: true
  reward_type: string
  reward_value: Record<string, unknown>
  next_reset_at: string
}

export type DailyPackStatusResponse = NotClaimedToday | ClaimedToday

export type DailyPackCache = {
  nextResetAt: string
  claimedToday: boolean
}

export type FetchLike = typeof fetch

export type DailyPackDeps = {
  storage?: StorageLike
  fetch?: FetchLike
  notify?: () => void
  highlightMenu?: (available: boolean) => void
}
