import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  handleRouteChange,
  isPlayerAttributesRequest,
  isQuizRequest,
  isTargetRequest,
  resetApiInterceptorState,
} from '~/modules/shared/api-interceptor'
import { MESSAGE_TYPE, SUPABASE } from '~/modules/shared/consts'
import { isQuizRoute } from '~/modules/quiz/routes'
import { isPlayerProfileRoute } from '~/modules/player/routes'

const PLAYER_ID = 'c5075e8e-e5cc-455d-a566-7b1cacb2341b'

function isAllowedRoute(pathname: string): boolean {
  return isQuizRoute(pathname) || isPlayerProfileRoute(pathname)
}

describe('api-interceptor route matching', () => {
  beforeEach(() => {
    resetApiInterceptorState()
  })

  afterEach(() => {
    resetApiInterceptorState()
  })

  it('allows quiz and player profile routes', () => {
    expect(isAllowedRoute('/player/quiz')).toBe(true)
    expect(isAllowedRoute('/player/quiz/foo')).toBe(true)
    expect(isAllowedRoute(`/player/${PLAYER_ID}`)).toBe(true)
    expect(isAllowedRoute('/player/home')).toBe(false)
  })
})

describe('api-interceptor request matching', () => {
  beforeEach(() => {
    resetApiInterceptorState()
    handleRouteChange({
      href: `https://footballidentity.org/player/${PLAYER_ID}`,
      pathname: `/player/${PLAYER_ID}`,
      search: '',
    })
  })

  afterEach(() => {
    resetApiInterceptorState()
  })

  it('matches player_attributes for active profile id', () => {
    const url = `${SUPABASE.BASE_URL}${SUPABASE.PLAYER_ATTRIBUTES_PATH}?select=*&player_profile_id=eq.${PLAYER_ID}`

    expect(isPlayerAttributesRequest(url)).toBe(true)
    expect(isTargetRequest(url, `/player/${PLAYER_ID}`)).toBe(true)
  })

  it('rejects player_attributes with different profile id', () => {
    const url = `${SUPABASE.BASE_URL}${SUPABASE.PLAYER_ATTRIBUTES_PATH}?select=*&player_profile_id=eq.other-id`

    expect(isPlayerAttributesRequest(url)).toBe(false)
  })

  it('matches quiz rpc requests on quiz route', () => {
    handleRouteChange({
      href: 'https://footballidentity.org/player/quiz',
      pathname: '/player/quiz',
      search: '',
    })

    const url = `${SUPABASE.BASE_URL}${SUPABASE.RPC_PATH_PREFIX}/${MESSAGE_TYPE.GET_SQUAD_HUMANS_FOR_MINIGAME}`

    expect(isQuizRequest(url)).toBe(true)
    expect(isTargetRequest(url, '/player/quiz')).toBe(true)
  })
})
