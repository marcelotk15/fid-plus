import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { isPlayerProfileRoute } from '~/modules/player/routes'
import { isQuizRoute } from '~/modules/quiz/routes'
import {
  handleRouteChange,
  isPlayerAttributesRequest,
  isQuizRequest,
  isTargetRequest,
  preparePlayerAttributesFetch,
  resetApiInterceptorState,
} from '~/modules/shared/api-interceptor'
import { MESSAGE_TYPE, SUPABASE } from '~/modules/shared/consts'

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

describe('preparePlayerAttributesFetch', () => {
  const PLAYER_ATTRS_URL = `${SUPABASE.BASE_URL}${SUPABASE.PLAYER_ATTRIBUTES_PATH}?select=*&player_profile_id=eq.${PLAYER_ID}`
  const ANON_KEY = 'test-anon-key'
  const USER_JWT = 'user-jwt-token'

  it('removes Authorization from init.headers object', () => {
    const [, init] = preparePlayerAttributesFetch(PLAYER_ATTRS_URL, {
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${USER_JWT}`,
        accept: 'application/json',
      },
    })

    const headers = new Headers(init?.headers)

    expect(headers.get('apikey')).toBe(ANON_KEY)
    expect(headers.get('accept')).toBe('application/json')
    expect(headers.get('authorization')).toBeNull()
  })

  it('removes Authorization from Headers instance', () => {
    const requestHeaders = new Headers({
      apikey: ANON_KEY,
      Authorization: `Bearer ${USER_JWT}`,
    })

    const [, init] = preparePlayerAttributesFetch(PLAYER_ATTRS_URL, {
      headers: requestHeaders,
    })

    const headers = new Headers(init?.headers)

    expect(headers.get('apikey')).toBe(ANON_KEY)
    expect(headers.get('authorization')).toBeNull()
  })

  it('removes Authorization from Request input', () => {
    const request = new Request(PLAYER_ATTRS_URL, {
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${USER_JWT}`,
        'content-type': 'application/json',
      },
    })

    const [fetchInput] = preparePlayerAttributesFetch(request)

    expect(fetchInput).toBeInstanceOf(Request)

    const headers = (fetchInput as Request).headers

    expect(headers.get('apikey')).toBe(ANON_KEY)
    expect(headers.get('content-type')).toBe('application/json')
    expect(headers.get('authorization')).toBeNull()
  })

  it('merges init headers over Request headers when both are present', () => {
    const request = new Request(PLAYER_ATTRS_URL, {
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${USER_JWT}`,
      },
    })

    const [fetchInput] = preparePlayerAttributesFetch(request, {
      headers: {
        accept: 'application/json',
      },
    })

    const headers = (fetchInput as Request).headers

    expect(headers.get('apikey')).toBe(ANON_KEY)
    expect(headers.get('accept')).toBe('application/json')
    expect(headers.get('authorization')).toBeNull()
  })
})

describe('setupFetchInterceptor player_attributes', () => {
  const PLAYER_ATTRS_URL = `${SUPABASE.BASE_URL}${SUPABASE.PLAYER_ATTRIBUTES_PATH}?select=*&player_profile_id=eq.${PLAYER_ID}`
  const ANON_KEY = 'test-anon-key'
  const USER_JWT = 'user-jwt-token'

  afterEach(() => {
    resetApiInterceptorState()
  })

  it('calls fetch without authorization for player_attributes requests', async () => {
    resetApiInterceptorState()

    const mockFetch = vi.fn(async () => new Response('[]', { status: 200 }))
    globalThis.fetch = mockFetch

    handleRouteChange({
      href: `https://footballidentity.org/player/${PLAYER_ID}`,
      pathname: `/player/${PLAYER_ID}`,
      search: '',
    })

    await globalThis.fetch(PLAYER_ATTRS_URL, {
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${USER_JWT}`,
      },
    })

    expect(mockFetch).toHaveBeenCalledOnce()

    const [, init] = mockFetch.mock.calls[0] as unknown as [string, RequestInit]
    const headers = new Headers(init.headers)

    expect(headers.get('apikey')).toBe(ANON_KEY)
    expect(headers.get('authorization')).toBeNull()
  })
})
