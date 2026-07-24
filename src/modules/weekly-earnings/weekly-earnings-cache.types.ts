import type { WeeklyObjectivesResponse } from './weekly-objectives.types'

export type WeeklyEarningsCacheSlice = 'profile' | 'contract' | 'sponsorships' | 'objectives'

export type WeeklyEarningsCache = {
  userId: string
  playerProfileId: string | null
  updatedAt: string
  profile: { activePlayerProfileId: string } | null
  contract: {
    salary: number
    contractId: string
    createdAt: string
    playerProfileId: string
  } | null
  sponsorships: {
    weeklyTotal: number
    fetchedAt: string
    playerProfileId: string
  } | null
  objectives: WeeklyObjectivesResponse | null
}

export function createEmptyWeeklyEarningsCache(userId: string, now = new Date()): WeeklyEarningsCache {
  return {
    userId,
    playerProfileId: null,
    updatedAt: now.toISOString(),
    profile: null,
    contract: null,
    sponsorships: null,
    objectives: null,
  }
}
