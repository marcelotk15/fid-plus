import { describe, expect, it } from 'vitest'

import { getPlayerProfileId, isPlayerProfileRoute } from '~/modules/player/routes'

const PLAYER_ID = 'c5075e8e-e5cc-455d-a566-7b1cacb2341b'

describe('getPlayerProfileId', () => {
  it('returns uuid from player profile route', () => {
    expect(getPlayerProfileId(`/player/${PLAYER_ID}`)).toBe(PLAYER_ID)
  })

  it('returns null for quiz route', () => {
    expect(getPlayerProfileId('/player/quiz')).toBeNull()
  })

  it('returns null for player home route', () => {
    expect(getPlayerProfileId('/player/home')).toBeNull()
  })

  it('returns null for nested paths', () => {
    expect(getPlayerProfileId(`/player/${PLAYER_ID}/stats`)).toBeNull()
  })
})

describe('isPlayerProfileRoute', () => {
  it('returns true for player profile route', () => {
    expect(isPlayerProfileRoute(`/player/${PLAYER_ID}`)).toBe(true)
  })

  it('returns false outside player profile route', () => {
    expect(isPlayerProfileRoute('/player/quiz')).toBe(false)
    expect(isPlayerProfileRoute('/player/home')).toBe(false)
    expect(isPlayerProfileRoute('/')).toBe(false)
  })
})
