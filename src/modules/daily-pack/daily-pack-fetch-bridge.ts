import type { FetchInterceptRuleRunner } from '~/modules/shared/fetch-intercept-rule-runner'
import type { FetchInterceptor } from '~/modules/shared/fetch-interceptor'

import { DAILY_PACK, MESSAGE_SOURCE, SUPABASE } from '~/modules/shared/consts'

import type { DailyPackStatusResponse } from './daily-pack.types'

import { parseDailyPackStatusBody } from './daily-pack-api'

const DAILY_PACK_RULE_ID = 'daily-pack'

function isDailyPackStatusRequest(url: string): boolean {
  try {
    const parsed = new URL(url, SUPABASE.BASE_URL)

    return (
      parsed.origin === new URL(SUPABASE.BASE_URL).origin &&
      parsed.pathname.includes(`${SUPABASE.RPC_PATH_PREFIX}/${DAILY_PACK.RPC}`)
    )
  } catch {
    return false
  }
}

export class DailyPackFetchInterceptRuleRunner implements FetchInterceptRuleRunner {
  register(interceptor: FetchInterceptor): void {
    interceptor.registerRule({
      id: DAILY_PACK_RULE_ID,
      source: MESSAGE_SOURCE.DAILY_PACK,
      matchUrl: isDailyPackStatusRequest,
      resolveType: () => DAILY_PACK.RPC,
    })
  }
}

export function parseDailyPackBridgeMessage(event: MessageEvent): DailyPackStatusResponse | null {
  if (event.source !== globalThis.window) return null
  if (event.data?.source !== MESSAGE_SOURCE.DAILY_PACK) return null
  if (event.data?.type !== DAILY_PACK.RPC) return null
  if (event.data?.payload?.status !== 200) return null

  return parseDailyPackStatusBody(event.data.payload.body)
}
