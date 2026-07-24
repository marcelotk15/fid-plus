export const WEEKLY_MILESTONE_REWARDS = {
  milestone5: 2_000,
  milestone10: 5_000,
} as const

export const WEEKLY_MILESTONE_TARGETS = {
  milestone5: 5,
  // API field is milestone_10_credited, but the reward unlocks at 9 objectives.
  milestone10: 9,
} as const

export type WeeklyMilestonesState = {
  completedCount: number
  milestone5Credited: boolean
  milestone10Credited: boolean
}

export type WeeklyMilestoneView = {
  key: 'milestone5' | 'milestone10'
  label: string
  rewardMoney: number
  targetCount: number
  isCompleted: boolean
}

export function buildWeeklyMilestoneViews(milestones: WeeklyMilestonesState): WeeklyMilestoneView[] {
  return [
    {
      key: 'milestone5',
      label: '5 objetivos semanais',
      rewardMoney: WEEKLY_MILESTONE_REWARDS.milestone5,
      targetCount: WEEKLY_MILESTONE_TARGETS.milestone5,
      isCompleted: milestones.milestone5Credited,
    },
    {
      key: 'milestone10',
      label: '9 objetivos semanais',
      rewardMoney: WEEKLY_MILESTONE_REWARDS.milestone10,
      targetCount: WEEKLY_MILESTONE_TARGETS.milestone10,
      isCompleted: milestones.milestone10Credited,
    },
  ]
}
