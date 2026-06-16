import { describe, expect, it } from 'vitest'

import { isQuizRoute } from '~/modules/quiz/routes'

const PLAYER_ID = 'c5075e8e-e5cc-455d-a566-7b1cacb2341b'

describe('isQuizRoute', () => {
  it('returns true for quiz routes', () => {
    expect(isQuizRoute('/player/quiz')).toBe(true)
    expect(isQuizRoute('/player/quiz/foo')).toBe(true)
  })

  it('returns false outside quiz routes', () => {
    expect(isQuizRoute(`/player/${PLAYER_ID}`)).toBe(false)
    expect(isQuizRoute('/player/home')).toBe(false)
    expect(isQuizRoute('/')).toBe(false)
  })
})
