import { describe, expect, it } from 'vitest'

import { formatMoney } from './format-currency'
import {
  buildWeeklySalaryBonusView,
  FREE_AGENT_SALARY_BONUS_VALUE,
  WEEKLY_SALARY_BONUS_LABEL,
} from './weekly-salary-bonus'

const WEEK_START = '2026-06-29'

function dateOnWeekDay(weekDayIndex: number): Date {
  const date = new Date(`${WEEK_START}T12:00:00`)
  date.setDate(date.getDate() + weekDayIndex - 1)
  return date
}

const perfectObjective = {
  key: 'complete_dailies_perfect',
  rewardMoney: 1000,
  targetCount: 7,
  currentCount: 5,
  completedAt: null,
} as const

describe('weekly-salary-bonus', () => {
  it('returns null when perfect objective is missing', () => {
    expect(
      buildWeeklySalaryBonusView({
        salary: 2500,
        objectives: [],
        weekStart: WEEK_START,
      }),
    ).toBeNull()
  })

  it('uses salary value when contract salary is available', () => {
    const view = buildWeeklySalaryBonusView({
      salary: 2500,
      objectives: [perfectObjective],
      weekStart: WEEK_START,
      now: dateOnWeekDay(3),
    })

    expect(view).toEqual({
      label: WEEKLY_SALARY_BONUS_LABEL,
      value: formatMoney(2500),
      status: 'in_progress',
    })
  })

  it('uses free agent fallback when salary is zero', () => {
    const view = buildWeeklySalaryBonusView({
      salary: 0,
      objectives: [perfectObjective],
      weekStart: WEEK_START,
      now: dateOnWeekDay(3),
    })

    expect(view?.value).toBe(FREE_AGENT_SALARY_BONUS_VALUE)
  })

  it('mirrors unreachable status from perfect objective progress', () => {
    const view = buildWeeklySalaryBonusView({
      salary: 2500,
      objectives: [{ ...perfectObjective, currentCount: 3 }],
      weekStart: WEEK_START,
      now: dateOnWeekDay(5),
    })

    expect(view?.status).toBe('unreachable')
  })

  it('mirrors completed status when perfect objective is done', () => {
    const view = buildWeeklySalaryBonusView({
      salary: 2500,
      objectives: [{ ...perfectObjective, currentCount: 7, completedAt: '2026-07-05T00:00:00Z' }],
      weekStart: WEEK_START,
      now: dateOnWeekDay(7),
    })

    expect(view?.status).toBe('completed')
  })
})
