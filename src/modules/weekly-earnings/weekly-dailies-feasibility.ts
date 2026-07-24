import type { WeeklyObjectiveStatus } from './weekly-objectives.types'

import { getCurrentWeekStartKey } from './week-range'

export const DAILY_PERFECT_WEEK_OBJECTIVE_KEYS = ['complete_dailies_perfect'] as const

export type { WeeklyObjectiveStatus }

const DAY_MS = 86_400_000

export function getWeekDayIndex(weekStart: string, date = new Date()): number {
  const start = new Date(`${weekStart}T00:00:00`)
  const today = new Date(date)
  start.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)

  const diffDays = Math.round((today.getTime() - start.getTime()) / DAY_MS)

  return Math.min(7, Math.max(1, diffDays + 1))
}

export function getRemainingWeekDays(weekDayIndex: number): number {
  return 7 - weekDayIndex + 1
}

export function isDailyPerfectWeekAchievable(params: {
  currentCount: number
  targetCount: number
  weekStart: string
  now?: Date
}): boolean {
  const { currentCount, targetCount, weekStart, now = new Date() } = params

  if (currentCount >= targetCount) return true

  const weekDayIndex = getWeekDayIndex(weekStart, now)
  const remainingDays = getRemainingWeekDays(weekDayIndex)
  const needed = targetCount - currentCount

  return needed <= remainingDays
}

export function resolveDailyPerfectWeekStatus(params: {
  key: string
  currentCount: number
  targetCount: number
  completedAt: string | null
  weekStart: string
  now?: Date
}): WeeklyObjectiveStatus {
  if (params.completedAt !== null) return 'completed'

  const isDailyPerfectObjective = DAILY_PERFECT_WEEK_OBJECTIVE_KEYS.includes(
    params.key as (typeof DAILY_PERFECT_WEEK_OBJECTIVE_KEYS)[number],
  )

  if (!isDailyPerfectObjective) return 'in_progress'

  const now = params.now ?? new Date()

  if (params.weekStart !== getCurrentWeekStartKey(now)) return 'in_progress'

  return isDailyPerfectWeekAchievable({
    currentCount: params.currentCount,
    targetCount: params.targetCount,
    weekStart: params.weekStart,
    now,
  })
    ? 'in_progress'
    : 'unreachable'
}
