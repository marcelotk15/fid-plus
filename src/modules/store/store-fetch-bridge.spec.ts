import { afterEach, describe, expect, it, vi } from 'vitest'

import { MESSAGE_SOURCE, PLAYER_PROFILES, STORE_MESSAGE_TYPE, SUPABASE } from '~/modules/shared/consts'
import { FetchInterceptor } from '~/modules/shared/fetch-interceptor'

import { destroyStoreBalance } from './store-balance-controller'
import { formatStoreBalance, STORE_BALANCE_HOST_ID, STORE_VALUE_ATTR } from './store-balance-dom'
import { handleStoreBridgeMessage, parseStoreBridgeProfile, StoreFetchInterceptRuleRunner } from './store-fetch-bridge'

function createMessageEvent(data: unknown, source: unknown = globalThis.window): MessageEvent {
  return { source, data } as MessageEvent
}

function storeMessage(body: unknown, status = 200) {
  return {
    source: MESSAGE_SOURCE.STORE,
    type: STORE_MESSAGE_TYPE.PLAYER_PROFILE,
    payload: {
      pageUrl: 'https://footballidentity.org/store',
      status,
      body,
    },
  }
}

function createStoreHeading(): HTMLElement {
  const wrap = document.createElement('div')
  const heading = document.createElement('h1')
  heading.textContent = 'Loja'
  wrap.append(heading)
  document.body.append(wrap)

  return heading
}

describe('parseStoreBridgeProfile', () => {
  it('reads the profile snapshot from a valid store player-profile message', () => {
    const event = createMessageEvent(storeMessage([{ money: 1500, full_name: 'Marcelo', primary_position: 'LM' }]))

    expect(parseStoreBridgeProfile(event)).toEqual({
      money: 1500,
      fullName: 'Marcelo',
      primaryPosition: 'ME',
    })
  })

  it('ignores messages from another source', () => {
    const event = createMessageEvent({
      ...storeMessage([{ money: 1500 }]),
      source: MESSAGE_SOURCE.WEEKLY_EARNINGS,
    })

    expect(parseStoreBridgeProfile(event)).toBeNull()
  })

  it('ignores non-200 responses', () => {
    const event = createMessageEvent(storeMessage([{ money: 1500 }], 500))

    expect(parseStoreBridgeProfile(event)).toBeNull()
  })

  it('ignores events from another window', () => {
    const event = createMessageEvent(storeMessage([{ money: 1500 }]), null)

    expect(parseStoreBridgeProfile(event)).toBeNull()
  })
})

describe('handleStoreBridgeMessage', () => {
  afterEach(() => {
    destroyStoreBalance()
    document.body.innerHTML = ''
  })

  it('renders the profile and balance below the Loja heading', () => {
    const heading = createStoreHeading()

    handleStoreBridgeMessage(
      createMessageEvent(storeMessage([{ money: 1500, full_name: 'Marcelo', primary_position: 'LM' }])),
    )

    const host = document.getElementById(STORE_BALANCE_HOST_ID)

    expect(host).not.toBeNull()
    expect(host?.querySelector(`[${STORE_VALUE_ATTR}]`)?.textContent).toBe(formatStoreBalance(1500))
    expect(host?.querySelector('[data-fid-plus-store-profile]')).toBeNull()
    expect(heading.nextElementSibling).toBe(host)
  })

  it('does not render a placeholder when the payload is invalid', () => {
    createStoreHeading()

    handleStoreBridgeMessage(createMessageEvent(storeMessage([])))

    expect(document.getElementById(STORE_BALANCE_HOST_ID)).toBeNull()
  })
})

describe('StoreFetchInterceptRuleRunner', () => {
  it('registers a rule that matches the store player-profile request', () => {
    const interceptor = new FetchInterceptor()
    const registerSpy = vi.spyOn(interceptor, 'registerRule')

    new StoreFetchInterceptRuleRunner().register(interceptor)

    const rule = registerSpy.mock.calls[0]?.[0]
    const url = `${SUPABASE.BASE_URL}${PLAYER_PROFILES.TABLE_PATH}?select=*&id=eq.8466db2d-4cbe-4c3f-a3a6-8c6824a7a565`

    expect(rule?.id).toBe('store-player-profile')
    expect(rule?.source).toBe(MESSAGE_SOURCE.STORE)
    expect(rule?.resolveType?.('')).toBe(STORE_MESSAGE_TYPE.PLAYER_PROFILE)
    expect(rule?.matchUrl(url)).toBe(true)
  })
})
