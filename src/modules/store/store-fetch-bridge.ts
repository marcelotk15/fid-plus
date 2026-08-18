import type { FetchInterceptRuleRunner } from '~/modules/shared/fetch-intercept-rule-runner'
import type { FetchInterceptor } from '~/modules/shared/fetch-interceptor'

import { MESSAGE_SOURCE, STORE_MESSAGE_TYPE } from '~/modules/shared/consts'

import { isPlayerProfilesSelectedRequest, parsePlayerProfile, type PlayerProfileSnapshot } from './player-profiles-api'
import { updateStoreProfile } from './store-balance-controller'

type BridgePayload = {
  pageUrl: string
  status: number
  body: unknown
}

type BridgeMessage = {
  source: string
  type: string
  payload: BridgePayload
}

export function parseStoreBridgeProfile(event: MessageEvent): PlayerProfileSnapshot | null {
  if (event.source !== globalThis.window) return null
  if (typeof event.data !== 'object' || event.data === null) return null

  const message = event.data as BridgeMessage

  if (message.source !== MESSAGE_SOURCE.STORE) return null
  if (message.type !== STORE_MESSAGE_TYPE.PLAYER_PROFILE) return null
  if (message.payload.status !== 200) return null

  return parsePlayerProfile(message.payload.body)
}

export function handleStoreBridgeMessage(event: MessageEvent): void {
  const profile = parseStoreBridgeProfile(event)

  if (!profile) return

  updateStoreProfile(profile)
}

export class StoreFetchInterceptRuleRunner implements FetchInterceptRuleRunner {
  register(interceptor: FetchInterceptor): void {
    interceptor.registerRule({
      id: 'store-player-profile',
      source: MESSAGE_SOURCE.STORE,
      matchUrl: isPlayerProfilesSelectedRequest,
      resolveType: () => STORE_MESSAGE_TYPE.PLAYER_PROFILE,
    })
  }
}
