import { describe, expect, it } from 'vitest'

import { computeWeeklyTotals, getMaxPossibleCompletedCount } from './weekly-earnings-totals'
import { toWeeklyObjectiveViews } from './weekly-objective-labels'
import { parseWeeklyObjectivesBody } from './weekly-objectives-api'
import { SAMPLE_WEEKLY_OBJECTIVES_PAYLOAD } from './weekly-objectives.fixture'

const WEEK_START = '2026-06-29'

function dateOnWeekDay(weekDayIndex: number): Date {
  const date = new Date(`${WEEK_START}T12:00:00`)
  date.setDate(date.getDate() + weekDayIndex - 1)
  return date
}

describe('weekly-earnings-totals', () => {
  it('computes earned and potential totals from sample objectives', () => {
    const parsed = parseWeeklyObjectivesBody(SAMPLE_WEEKLY_OBJECTIVES_PAYLOAD)

    expect(parsed).not.toBeNull()
    if (!parsed) return

    const objectives = toWeeklyObjectiveViews(parsed.objectives, parsed.weekStart, dateOnWeekDay(4))

    const totals = computeWeeklyTotals({
      salary: 2500,
      sponsorship: 250,
      objectives,
      milestones: {
        completedCount: parsed.completedCount,
        milestone5Credited: parsed.milestone5Credited,
        milestone10Credited: parsed.milestone10Credited,
      },
      includeObjectives: true,
    })

    // earned: 2750 fixed + 2700 completed objectives (1000+500+500+700)
    expect(totals.earned).toBe(5450)
    // potential: 2750 + 6200 objectives + 7000 milestones
    expect(totals.potential).toBe(15_950)
  })

  it('includes credited milestones in earned total', () => {
    const parsed = parseWeeklyObjectivesBody({
      ...SAMPLE_WEEKLY_OBJECTIVES_PAYLOAD,
      milestone_5_credited: true,
      milestone_10_credited: false,
    })

    expect(parsed).not.toBeNull()
    if (!parsed) return

    const objectives = toWeeklyObjectiveViews(parsed.objectives, parsed.weekStart, dateOnWeekDay(4))

    const totals = computeWeeklyTotals({
      salary: 2500,
      sponsorship: 250,
      objectives,
      milestones: {
        completedCount: parsed.completedCount,
        milestone5Credited: parsed.milestone5Credited,
        milestone10Credited: parsed.milestone10Credited,
      },
      includeObjectives: true,
    })

    expect(totals.earned).toBe(5450 + 2000)
    expect(totals.potential).toBe(13_950)
  })

  it('returns only fixed totals when objectives are unavailable', () => {
    const totals = computeWeeklyTotals({
      salary: 2500,
      sponsorship: 250,
      objectives: [],
      milestones: {
        completedCount: 0,
        milestone5Credited: false,
        milestone10Credited: false,
      },
      includeObjectives: false,
    })

    expect(totals).toEqual({ earned: 2750, potential: 2750 })
  })

  it('excludes unreachable objectives from potential', () => {
    const parsed = parseWeeklyObjectivesBody({
      ...SAMPLE_WEEKLY_OBJECTIVES_PAYLOAD,
      objectives: SAMPLE_WEEKLY_OBJECTIVES_PAYLOAD.objectives.map((objective) =>
        objective.objective_key === 'complete_dailies_perfect'
          ? { ...objective, current_count: 3, target_count: 7, completed_at: null }
          : objective,
      ),
    })

    expect(parsed).not.toBeNull()
    if (!parsed) return

    const objectives = toWeeklyObjectiveViews(parsed.objectives, parsed.weekStart, dateOnWeekDay(5))
    const perfectObjective = objectives.find((objective) => objective.key === 'complete_dailies_perfect')

    expect(perfectObjective?.status).toBe('unreachable')

    const totals = computeWeeklyTotals({
      salary: 2500,
      sponsorship: 250,
      objectives,
      milestones: {
        completedCount: parsed.completedCount,
        milestone5Credited: parsed.milestone5Credited,
        milestone10Credited: parsed.milestone10Credited,
      },
      includeObjectives: true,
    })

    expect(totals.potential).toBe(15_950 - 1000)
    expect(totals.earned).toBe(5450)
  })

  it('excludes unreachable milestones from potential', () => {
    const objectives = toWeeklyObjectiveViews(
      parseWeeklyObjectivesBody(SAMPLE_WEEKLY_OBJECTIVES_PAYLOAD)!.objectives,
      WEEK_START,
      dateOnWeekDay(4),
    ).map((objective, index) =>
      index >= 8 ? { ...objective, status: 'unreachable' as const, isCompleted: false } : objective,
    )

    expect(getMaxPossibleCompletedCount(objectives)).toBe(8)

    const totals = computeWeeklyTotals({
      salary: 2500,
      sponsorship: 250,
      objectives,
      milestones: {
        completedCount: 4,
        milestone5Credited: false,
        milestone10Credited: false,
      },
      includeObjectives: true,
    })

    const objectivesPotential = objectives.reduce(
      (sum, objective) => (objective.status === 'unreachable' ? sum : sum + objective.rewardMoney),
      0,
    )

    expect(totals.potential).toBe(2750 + objectivesPotential + 2000)
  })
})
