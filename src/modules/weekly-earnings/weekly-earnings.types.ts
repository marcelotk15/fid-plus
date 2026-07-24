import type { PlayerSalaryError } from './contracts.types'
import type { WeeklyMilestonesState } from './weekly-milestones'
import type { FetchWeeklyObjectivesError, WeeklyObjectiveView, WeeklySalaryBonusView } from './weekly-objectives.types'

export type WeeklyEarnings = {
  salary: number
  sponsorship: number
  weekStart: string | null
  objectives: WeeklyObjectiveView[]
  salaryBonus: WeeklySalaryBonusView | null
  milestones: WeeklyMilestonesState
  totals: { earned: number; potential: number }
  objectivesError?: FetchWeeklyObjectivesError
}

export type FetchWeeklyEarningsResult = {
  data: WeeklyEarnings | null
  error?: PlayerSalaryError
  status?: number
}
