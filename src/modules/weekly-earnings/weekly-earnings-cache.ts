import type { StorageLike } from '~/modules/shared/storage.types'

import { WEEKLY_EARNINGS } from '~/modules/shared/consts'

import type { PlayerContract } from './contracts.types'
import type { WeeklyEarningsCache, WeeklyEarningsCacheSlice } from './weekly-earnings-cache.types'
import type { WeeklyEarnings } from './weekly-earnings.types'
import type { WeeklyObjectivesResponse } from './weekly-objectives.types'

import { parseContractsBody } from './contracts-api'
import { parseActivePlayerProfileId } from './profiles-api'
import { parseActiveSponsorshipsBody } from './sponsorships-api'
import { getCurrentWeekStartKey } from './week-range'
import { createEmptyWeeklyEarningsCache } from './weekly-earnings-cache.types'
import { computeWeeklyTotals } from './weekly-earnings-totals'
import { readOrCreateWeeklyEarningsCache, writeWeeklyEarningsCache } from './weekly-earnings.storage'
import { toWeeklyObjectiveViews } from './weekly-objective-labels'
import { parseWeeklyObjectivesBody } from './weekly-objectives-api'
import { buildWeeklySalaryBonusView } from './weekly-salary-bonus'

const EMPTY_MILESTONES = {
  completedCount: 0,
  milestone5Credited: false,
  milestone10Credited: false,
} as const

const ALL_SLICES: WeeklyEarningsCacheSlice[] = ['profile', 'contract', 'sponsorships', 'objectives']

export function resolvePlayerProfileId(cache: WeeklyEarningsCache): string | null {
  return cache.profile?.activePlayerProfileId ?? cache.playerProfileId
}

export function isObjectivesCacheValid(objectives: WeeklyObjectivesResponse | null, now = new Date()): boolean {
  if (!objectives) return false

  return objectives.weekStart === getCurrentWeekStartKey(now)
}

export function isSponsorshipsCacheValid(
  cache: WeeklyEarningsCache,
  playerProfileId: string,
  now = new Date(),
): boolean {
  if (!cache.sponsorships) return false
  if (cache.sponsorships.playerProfileId !== playerProfileId) return false

  const fetchedAt = new Date(cache.sponsorships.fetchedAt).getTime()

  if (Number.isNaN(fetchedAt)) return false

  return now.getTime() - fetchedAt < WEEKLY_EARNINGS.SPONSORSHIPS_STALE_MS
}

export function getStaleSlices(
  cache: WeeklyEarningsCache | null,
  userId: string,
  now = new Date(),
): WeeklyEarningsCacheSlice[] {
  if (!cache || cache.userId !== userId) return [...ALL_SLICES]

  const stale: WeeklyEarningsCacheSlice[] = []
  const playerProfileId = resolvePlayerProfileId(cache)

  if (!cache.profile?.activePlayerProfileId) {
    stale.push('profile')
  }

  if (!playerProfileId) {
    const missing: WeeklyEarningsCacheSlice[] = ['profile', 'contract', 'sponsorships']
    return stale.length > 0 ? [...new Set([...stale, ...missing])] : missing
  }

  if (!cache.contract || cache.contract.playerProfileId !== playerProfileId) {
    stale.push('contract')
  }

  if (!isSponsorshipsCacheValid(cache, playerProfileId, now)) {
    stale.push('sponsorships')
  }

  if (!isObjectivesCacheValid(cache.objectives, now)) {
    stale.push('objectives')
  }

  return stale
}

export function buildWeeklyEarningsFromCache(cache: WeeklyEarningsCache, now = new Date()): WeeklyEarnings | null {
  if (!cache.contract) return null

  const salary = cache.contract.salary
  const sponsorship = cache.sponsorships?.weeklyTotal ?? 0
  const objectivesData = cache.objectives

  const objectives = objectivesData
    ? toWeeklyObjectiveViews(objectivesData.objectives, objectivesData.weekStart, now)
    : []
  const salaryBonus =
    objectivesData !== null
      ? buildWeeklySalaryBonusView({
          salary,
          objectives: objectivesData.objectives,
          weekStart: objectivesData.weekStart,
          now,
        })
      : null
  const milestones = objectivesData
    ? {
        completedCount: objectivesData.completedCount,
        milestone5Credited: objectivesData.milestone5Credited,
        milestone10Credited: objectivesData.milestone10Credited,
      }
    : EMPTY_MILESTONES

  const totals = computeWeeklyTotals({
    salary,
    sponsorship,
    objectives,
    milestones,
    includeObjectives: objectivesData !== null,
  })

  return {
    salary,
    sponsorship,
    weekStart: objectivesData?.weekStart ?? null,
    objectives,
    salaryBonus,
    milestones,
    totals,
  }
}

export function mergeProfileSlice(cache: WeeklyEarningsCache, activePlayerProfileId: string): WeeklyEarningsCache {
  const playerChanged = cache.playerProfileId !== null && cache.playerProfileId !== activePlayerProfileId

  return {
    ...cache,
    playerProfileId: activePlayerProfileId,
    profile: { activePlayerProfileId },
    contract: playerChanged ? null : cache.contract,
    sponsorships: playerChanged ? null : cache.sponsorships,
  }
}

export function mergeContractSlice(cache: WeeklyEarningsCache, contract: PlayerContract): WeeklyEarningsCache {
  return {
    ...cache,
    playerProfileId: contract.playerProfileId,
    contract: {
      salary: contract.salary,
      contractId: contract.id,
      createdAt: contract.createdAt,
      playerProfileId: contract.playerProfileId,
    },
  }
}

export function mergeSponsorshipsSlice(
  cache: WeeklyEarningsCache,
  playerProfileId: string,
  weeklyTotal: number,
  now = new Date(),
): WeeklyEarningsCache {
  return {
    ...cache,
    playerProfileId,
    sponsorships: {
      weeklyTotal,
      fetchedAt: now.toISOString(),
      playerProfileId,
    },
  }
}

export function mergeObjectivesSlice(
  cache: WeeklyEarningsCache,
  objectives: WeeklyObjectivesResponse,
): WeeklyEarningsCache {
  return {
    ...cache,
    objectives,
  }
}

export type WeeklyEarningsIngestPayload =
  | { type: 'profile'; userId: string; body: unknown }
  | { type: 'contract'; userId: string; playerProfileId: string; body: unknown }
  | { type: 'sponsorships'; userId: string; playerProfileId: string; body: unknown }
  | { type: 'objectives'; userId: string; body: unknown }

export function ingestWeeklyEarningsFromPage(
  storage: StorageLike,
  payload: WeeklyEarningsIngestPayload,
  now = new Date(),
): WeeklyEarningsCache | null {
  const cache = readOrCreateWeeklyEarningsCache(storage, payload.userId, now)

  switch (payload.type) {
    case 'profile': {
      if (!Array.isArray(payload.body) || payload.body.length === 0) return null

      const activePlayerProfileId = parseActivePlayerProfileId(payload.body[0])

      if (!activePlayerProfileId) return null

      return writeWeeklyEarningsCache(storage, mergeProfileSlice(cache, activePlayerProfileId), now)
    }
    case 'contract': {
      const contract = parseContractsBody(payload.body)

      if (!contract || contract.playerProfileId !== payload.playerProfileId) return null

      const withProfile =
        cache.profile?.activePlayerProfileId === payload.playerProfileId
          ? cache
          : mergeProfileSlice(cache, payload.playerProfileId)

      return writeWeeklyEarningsCache(storage, mergeContractSlice(withProfile, contract), now)
    }
    case 'sponsorships': {
      const weeklyTotal = parseActiveSponsorshipsBody(payload.body)

      return writeWeeklyEarningsCache(
        storage,
        mergeSponsorshipsSlice(cache, payload.playerProfileId, weeklyTotal, now),
        now,
      )
    }
    case 'objectives': {
      const objectives = parseWeeklyObjectivesBody(payload.body)

      if (!objectives) return null

      return writeWeeklyEarningsCache(storage, mergeObjectivesSlice(cache, objectives), now)
    }
  }
}

export function createWeeklyEarningsCache(userId: string, now = new Date()): WeeklyEarningsCache {
  return createEmptyWeeklyEarningsCache(userId, now)
}
