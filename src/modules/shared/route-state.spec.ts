import { afterEach, describe, expect, it } from 'vitest'

import { getActivePathname, getActiveRoute, handleRouteChange, resetRouteState } from './route-state'

const sampleRoute = {
  href: 'https://footballidentity.org/player/quiz',
  pathname: '/player/quiz',
  search: '',
}

describe('route-state', () => {
  afterEach(() => {
    resetRouteState()
  })

  it('stores the active route on handleRouteChange', () => {
    handleRouteChange(sampleRoute)

    expect(getActiveRoute()).toEqual(sampleRoute)
    expect(getActivePathname()).toBe('/player/quiz')
  })

  it('returns empty pathname before any route change', () => {
    expect(getActiveRoute()).toBeNull()
    expect(getActivePathname()).toBe('')
  })

  it('clears state on resetRouteState', () => {
    handleRouteChange(sampleRoute)

    resetRouteState()

    expect(getActiveRoute()).toBeNull()
    expect(getActivePathname()).toBe('')
  })
})
