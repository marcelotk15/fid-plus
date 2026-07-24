import type { WeeklyMilestonesState } from './weekly-milestones'
import type { WeeklyObjectiveView } from './weekly-objectives.types'

import { WEEKLY_MILESTONE_REWARDS, WEEKLY_MILESTONE_TARGETS } from './weekly-milestones'

export type WeeklyTotals = {
  earned: number
  potential: number
}

export type ComputeWeeklyTotalsInput = {
  salary: number
  sponsorship: number
  objectives: WeeklyObjectiveView[]
  milestones: WeeklyMilestonesState
  includeObjectives: boolean
}

export function getMaxPossibleCompletedCount(objectives: WeeklyObjectiveView[]): number {
  return objectives.filter((objective) => objective.status !== 'unreachable').length
}

function getMilestonePotential(
  targetCount: number,
  credited: boolean,
  maxPossibleCompletedCount: number,
  reward: number,
): number {
  if (credited) return 0

  return maxPossibleCompletedCount >= targetCount ? reward : 0
}

export function computeWeeklyTotals(input: ComputeWeeklyTotalsInput): WeeklyTotals {
  const fixed = input.salary + input.sponsorship

  if (!input.includeObjectives) {
    return { earned: fixed, potential: fixed }
  }

  const objectivesPotential = input.objectives.reduce(
    (sum, objective) => (objective.status === 'unreachable' ? sum : sum + objective.rewardMoney),
    0,
  )
  const objectivesEarned = input.objectives.reduce(
    (sum, objective) => (objective.completedAt !== null ? sum + objective.rewardMoney : sum),
    0,
  )

  const maxPossibleCompletedCount = getMaxPossibleCompletedCount(input.objectives)
  const milestonesPotential =
    getMilestonePotential(
      WEEKLY_MILESTONE_TARGETS.milestone5,
      input.milestones.milestone5Credited,
      maxPossibleCompletedCount,
      WEEKLY_MILESTONE_REWARDS.milestone5,
    ) +
    getMilestonePotential(
      WEEKLY_MILESTONE_TARGETS.milestone10,
      input.milestones.milestone10Credited,
      maxPossibleCompletedCount,
      WEEKLY_MILESTONE_REWARDS.milestone10,
    )
  const milestonesEarned =
    (input.milestones.milestone5Credited ? WEEKLY_MILESTONE_REWARDS.milestone5 : 0) +
    (input.milestones.milestone10Credited ? WEEKLY_MILESTONE_REWARDS.milestone10 : 0)

  return {
    earned: fixed + objectivesEarned + milestonesEarned,
    potential: fixed + objectivesPotential + milestonesPotential,
  }
}
