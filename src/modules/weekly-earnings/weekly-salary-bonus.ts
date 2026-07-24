import type { WeeklyObjective, WeeklySalaryBonusView } from './weekly-objectives.types'

import { formatMoney } from './format-currency'
import { resolveDailyPerfectWeekStatus } from './weekly-dailies-feasibility'

export const WEEKLY_SALARY_BONUS_LABEL = '+1 salário semanal (7 dias perfeitos)' as const
export const FREE_AGENT_SALARY_BONUS_VALUE = '🪙 1.000' as const
export const COMPLETE_DAILIES_PERFECT_KEY = 'complete_dailies_perfect' as const

export function buildWeeklySalaryBonusView(params: {
  salary: number
  objectives: WeeklyObjective[]
  weekStart: string
  now?: Date
}): WeeklySalaryBonusView | null {
  const perfectObjective = params.objectives.find((objective) => objective.key === COMPLETE_DAILIES_PERFECT_KEY)

  if (!perfectObjective) return null

  const status = resolveDailyPerfectWeekStatus({
    key: perfectObjective.key,
    currentCount: perfectObjective.currentCount,
    targetCount: perfectObjective.targetCount,
    completedAt: perfectObjective.completedAt,
    weekStart: params.weekStart,
    now: params.now,
  })

  const value = params.salary > 0 ? formatMoney(params.salary) : FREE_AGENT_SALARY_BONUS_VALUE

  return {
    label: WEEKLY_SALARY_BONUS_LABEL,
    value,
    status,
  }
}
