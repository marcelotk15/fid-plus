import { describe, expect, it, vi } from 'vitest'

import { ACTIVE_SPONSORSHIPS_ENDPOINT } from '~/modules/shared/consts'

import {
  buildActiveSponsorshipsUrl,
  fetchActiveSponsorshipWeeklyTotal,
  parseActiveSponsorshipsBody,
} from './sponsorships-api'

const PLAYER_PROFILE_ID = 'c5075e8e-e5cc-455d-a566-7b1cacb2341b'
const NOW = new Date('2026-07-03T03:48:21.938Z')

describe('sponsorships-api', () => {
  it('builds active sponsorships url with expected query params', () => {
    const url = new URL(buildActiveSponsorshipsUrl(PLAYER_PROFILE_ID, NOW))

    expect(url.origin + url.pathname).toBe(ACTIVE_SPONSORSHIPS_ENDPOINT)
    expect(url.searchParams.get('select')).toBe('*')
    expect(url.searchParams.get('player_profile_id')).toBe(`eq.${PLAYER_PROFILE_ID}`)
    expect(url.searchParams.get('status')).toBe('eq.active')
    expect(url.searchParams.get('expires_at')).toBe(`gt.${NOW.toISOString()}`)
  })

  it('sums weekly_value from active sponsorships', () => {
    expect(
      parseActiveSponsorshipsBody([
        {
          id: 'sponsor-1',
          weekly_value: 250,
          status: 'active',
        },
        {
          id: 'sponsor-2',
          weekly_value: 100,
          status: 'active',
        },
      ]),
    ).toBe(350)
  })

  it('returns zero for empty sponsorship list', () => {
    expect(parseActiveSponsorshipsBody([])).toBe(0)
  })

  it('returns parsed weekly total from fetch', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [
        {
          id: '8d53ac00-7fb4-44ac-9faf-49ff815c9d38',
          player_profile_id: PLAYER_PROFILE_ID,
          weekly_value: 250,
          status: 'active',
          expires_at: '2026-07-05T18:44:41.893017+00:00',
        },
      ],
    })

    const result = await fetchActiveSponsorshipWeeklyTotal('token', PLAYER_PROFILE_ID, fetchImpl, NOW)

    expect(result).toBe(250)
    expect(fetchImpl).toHaveBeenCalledWith(
      buildActiveSponsorshipsUrl(PLAYER_PROFILE_ID, NOW),
      expect.objectContaining({ method: 'GET' }),
    )
  })
})
