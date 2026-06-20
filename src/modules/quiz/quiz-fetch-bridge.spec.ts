import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  handleRouteChange,
  isQuizRequest,
  isTargetRequest,
  QuizFetchInterceptRuleRunner,
  resetQuizFetchBridgeState,
} from '~/modules/quiz/quiz-fetch-bridge'
import { isQuizRoute } from '~/modules/quiz/routes'
import { MESSAGE_TYPE, SUPABASE } from '~/modules/shared/consts'
import { FetchInterceptor } from '~/modules/shared/fetch-interceptor'

function isAllowedRoute(pathname: string): boolean {
  return isQuizRoute(pathname)
}

describe('quiz-fetch-bridge route matching', () => {
  beforeEach(() => {
    resetQuizFetchBridgeState()
  })

  afterEach(() => {
    resetQuizFetchBridgeState()
  })

  it('allows quiz routes', () => {
    expect(isAllowedRoute('/player/quiz')).toBe(true)
    expect(isAllowedRoute('/player/quiz/foo')).toBe(true)
    expect(isAllowedRoute('/player/home')).toBe(false)
  })
})

describe('quiz-fetch-bridge request matching', () => {
  let interceptor: FetchInterceptor

  beforeEach(() => {
    resetQuizFetchBridgeState()
    interceptor = new FetchInterceptor()
    new QuizFetchInterceptRuleRunner().register(interceptor)
  })

  afterEach(() => {
    resetQuizFetchBridgeState()
    interceptor.reset()
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
