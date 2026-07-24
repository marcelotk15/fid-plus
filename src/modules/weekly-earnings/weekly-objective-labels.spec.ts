import { describe, expect, it } from 'vitest'

import { toWeeklyObjectiveViews } from './weekly-objective-labels'
import { parseWeeklyObjectivesBody } from './weekly-objectives-api'
import { SAMPLE_WEEKLY_OBJECTIVES_PAYLOAD } from './weekly-objectives.fixture'

const WEEK_START = '2026-06-29'

function dateOnWeekDay(weekDayIndex: number): Date {
  const date = new Date(`${WEEK_START}T12:00:00`)
  date.setDate(date.getDate() + weekDayIndex - 1)
  return date
}

describe('weekly-objective-labels', () => {
  it('marks complete_dailies_perfect as unreachable on day 5 with 3/7', () => {
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

    const views = toWeeklyObjectiveViews(parsed.objectives, parsed.weekStart, dateOnWeekDay(5))
    const perfectObjective = views.find((objective) => objective.key === 'complete_dailies_perfect')

    expect(perfectObjective?.status).toBe('unreachable')
    expect(perfectObjective?.isCompleted).toBe(false)
  })

  it('keeps complete_dailies_perfect in progress on day 5 with 4/7', () => {
    const parsed = parseWeeklyObjectivesBody({
      ...SAMPLE_WEEKLY_OBJECTIVES_PAYLOAD,
      objectives: SAMPLE_WEEKLY_OBJECTIVES_PAYLOAD.objectives.map((objective) =>
        objective.objective_key === 'complete_dailies_perfect'
          ? { ...objective, current_count: 4, target_count: 7, completed_at: null }
          : objective,
      ),
    })

    expect(parsed).not.toBeNull()
    if (!parsed) return

    const views = toWeeklyObjectiveViews(parsed.objectives, parsed.weekStart, dateOnWeekDay(5))
    const perfectObjective = views.find((objective) => objective.key === 'complete_dailies_perfect')

    expect(perfectObjective?.status).toBe('in_progress')
  })

  it('marks other objectives as in progress regardless of day', () => {
    const parsed = parseWeeklyObjectivesBody(SAMPLE_WEEKLY_OBJECTIVES_PAYLOAD)

    expect(parsed).not.toBeNull()
    if (!parsed) return

    const views = toWeeklyObjectiveViews(parsed.objectives, parsed.weekStart, dateOnWeekDay(5))
    const leagueObjective = views.find((objective) => objective.key === 'play_2_league_matches')

    expect(leagueObjective?.status).toBe('in_progress')
  })
})
