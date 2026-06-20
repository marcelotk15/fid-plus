import { describe, expect, it } from 'vitest'

import { DAILY_PACK, MESSAGE_SOURCE } from '~/modules/shared/consts'

import { parseDailyPackBridgeMessage } from './daily-pack-fetch-bridge'

describe('daily-pack-fetch-bridge', () => {
  it('parses bridge message from page fetch', () => {
    const event = new MessageEvent('message', {
      data: {
        source: MESSAGE_SOURCE.DAILY_PACK,
        type: DAILY_PACK.RPC,
        payload: {
          status: 200,
          body: { claimed_today: false },
        },
      },
    })

    Object.defineProperty(event, 'source', { value: globalThis.window })

    expect(parseDailyPackBridgeMessage(event)).toEqual({ claimed_today: false })
  })
})
