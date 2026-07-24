import { describe, expect, it, vi } from 'vitest'

import { DAILY_PACK_ENDPOINT, SUPABASE } from '~/modules/shared/consts'

import {
  buildDailyPackHeaders,
  fetchDailyPackStatus,
  fetchDailyPackStatusWithMeta,
  parseDailyPackStatusBody,
} from './daily-pack-api'

describe('daily-pack-api', () => {
  it('builds expected headers', () => {
    const headers = buildDailyPackHeaders('test-token')

    expect(headers).toEqual({
      accept: '*/*',
      apikey: SUPABASE.PUBLIC_API_KEY,
      authorization: 'Bearer test-token',
      'content-profile': 'public',
      'content-type': 'application/json',
      'x-client-info': SUPABASE.CLIENT_INFO,
    })
  })

  it('parses available response with only claimed_today', () => {
    expect(parseDailyPackStatusBody({ claimed_today: false })).toEqual({ claimed_today: false })
  })

  it('parses claimed_today provided as string', () => {
    expect(parseDailyPackStatusBody({ claimed_today: 'false' })).toEqual({ claimed_today: false })
  })

  it('returns parsed response when daily pack is available', async () => {
    const body = { claimed_today: false }

    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => body,
    })

    const result = await fetchDailyPackStatus('token', fetchImpl)

    expect(result).toEqual(body)
    expect(fetchImpl).toHaveBeenCalledWith(DAILY_PACK_ENDPOINT, {
      method: 'POST',
      headers: buildDailyPackHeaders('token'),
      body: JSON.stringify({}),
    })
  })

  it('returns parsed response when daily pack was already claimed', async () => {
    const body = {
      reward_type: 'coins',
      reward_value: { amount: 55 },
      claimed_today: true,
      next_reset_at: '2026-06-18T23:53:57.733866+00:00',
    }

    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => body,
    })

    const result = await fetchDailyPackStatus('token', fetchImpl)

    expect(result).toEqual(body)
  })

  it('returns http error metadata', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({}),
    })

    const result = await fetchDailyPackStatusWithMeta('token', fetchImpl)

    expect(result).toEqual({ data: null, error: 'http', status: 401 })
  })

  it('returns parse error metadata', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ invalid: true }),
    })

    const result = await fetchDailyPackStatusWithMeta('token', fetchImpl)

    expect(result).toEqual({ data: null, error: 'parse', status: 200 })
  })

  it('returns null on network error', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('network'))

    const result = await fetchDailyPackStatusWithMeta('token', fetchImpl)

    expect(result).toEqual({ data: null, error: 'network' })
  })
})
