import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { isQuizRoute } from '~/modules/quiz/routes'
import {
  handleRouteChange,
  isQuizRequest,
  isTargetRequest,
  resetApiInterceptorState,
} from '~/modules/shared/api-interceptor'
import { MESSAGE_TYPE, SUPABASE } from '~/modules/shared/consts'

function isAllowedRoute(pathname: string): boolean {
  return isQuizRoute(pathname)
}

describe('api-interceptor route matching', () => {
  beforeEach(() => {
    resetApiInterceptorState()
  })

  afterEach(() => {
    resetApiInterceptorState()
  })

  it('allows quiz routes', () => {
    expect(isAllowedRoute('/player/quiz')).toBe(true)
    expect(isAllowedRoute('/player/quiz/foo')).toBe(true)
    expect(isAllowedRoute('/player/home')).toBe(false)
  })
})

describe('api-interceptor request matching', () => {
  beforeEach(() => {
    resetApiInterceptorState()
  })

  afterEach(() => {
    resetApiInterceptorState()
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
