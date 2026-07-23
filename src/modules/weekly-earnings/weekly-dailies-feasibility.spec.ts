import { describe, expect, it } from 'vitest'

import {
  getRemainingWeekDays,
  getWeekDayIndex,
  isDailyPerfectWeekAchievable,
  resolveDailyPerfectWeekStatus,
} from './weekly-dailies-feasibility'

const WEEK_START = '2026-06-29' // Monday

function dateOnWeekDay(weekDayIndex: number): Date {
  const date = new Date(`${WEEK_START}T12:00:00`)
  date.setDate(date.getDate() + weekDayIndex - 1)
  return date
}

describe('weekly-dailies-feasibility', () => {
  it('maps week day index from week start', () => {
    expect(getWeekDayIndex(WEEK_START, dateOnWeekDay(1))).toBe(1)
    expect(getWeekDayIndex(WEEK_START, dateOnWeekDay(5))).toBe(5)
    expect(getWeekDayIndex(WEEK_START, dateOnWeekDay(7))).toBe(7)
  })

  it('computes remaining week days including today', () => {
    expect(getRemainingWeekDays(1)).toBe(7)
    expect(getRemainingWeekDays(5)).toBe(3)
    expect(getRemainingWeekDays(7)).toBe(1)
  })

  it('marks 3/7 on day 5 as unreachable', () => {
    expect(
      isDailyPerfectWeekAchievable({
        currentCount: 3,
        targetCount: 7,
        weekStart: WEEK_START,
        now: dateOnWeekDay(5),
      }),
    ).toBe(false)
  })

  it('marks 4/7 on day 5 as achievable', () => {
    expect(
      isDailyPerfectWeekAchievable({
        currentCount: 4,
        targetCount: 7,
        weekStart: WEEK_START,
        now: dateOnWeekDay(5),
      }),
    ).toBe(true)
  })

  it('marks 0/7 on monday as achievable', () => {
    expect(
      isDailyPerfectWeekAchievable({
        currentCount: 0,
        targetCount: 7,
        weekStart: WEEK_START,
        now: dateOnWeekDay(1),
      }),
    ).toBe(true)
  })

  it('marks 6/7 on sunday as achievable', () => {
    expect(
      isDailyPerfectWeekAchievable({
        currentCount: 6,
        targetCount: 7,
        weekStart: WEEK_START,
        now: dateOnWeekDay(7),
      }),
    ).toBe(true)
  })

  it('returns completed when completedAt is set', () => {
    expect(
      resolveDailyPerfectWeekStatus({
        key: 'complete_dailies_perfect',
        currentCount: 3,
        targetCount: 7,
        completedAt: '2026-07-01T00:00:00Z',
        weekStart: WEEK_START,
        now: dateOnWeekDay(5),
      }),
    ).toBe('completed')
  })

  it('does not mark unreachable for past weeks', () => {
    expect(
      resolveDailyPerfectWeekStatus({
        key: 'complete_dailies_perfect',
        currentCount: 3,
        targetCount: 7,
        completedAt: null,
        weekStart: '2026-06-22',
        now: dateOnWeekDay(5),
      }),
    ).toBe('in_progress')
  })

  it('returns in_progress for non-daily objectives', () => {
    expect(
      resolveDailyPerfectWeekStatus({
        key: 'play_2_league_matches',
        currentCount: 0,
        targetCount: 2,
        completedAt: null,
        weekStart: WEEK_START,
        now: dateOnWeekDay(5),
      }),
    ).toBe('in_progress')
  })
})
