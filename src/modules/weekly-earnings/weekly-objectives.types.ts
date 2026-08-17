import type { FetchError, FetchResult } from '~/modules/shared/fetch.types'

export type WeeklyObjectiveStatus = 'completed' | 'in_progress' | 'unreachable'

export type WeeklyObjective = {
  key: string
  rewardMoney: number
  targetCount: number
  currentCount: number
  completedAt: string | null
}

export type WeeklyObjectivesResponse = {
  objectives: WeeklyObjective[]
  weekStart: string
  completedCount: number
  milestone5Credited: boolean
  milestone10Credited: boolean
}

export type WeeklyObjectiveView = WeeklyObjective & {
  label: string
  isCompleted: boolean
  status: WeeklyObjectiveStatus
}

export type WeeklySalaryBonusView = {
  label: string
  value: string
  status: WeeklyObjectiveStatus
}

export type FetchWeeklyObjectivesError = FetchError

export type FetchWeeklyObjectivesResult = FetchResult<WeeklyObjectivesResponse | null>
