import { describe, expect, it, vi } from 'vitest'

import { PROFILES, PROFILES_ENDPOINT } from '~/modules/shared/consts'

import {
  buildProfileUrl,
  fetchActivePlayerProfileId,
  fetchActivePlayerProfileIdWithMeta,
  parseActivePlayerProfileId,
  parseProfilesBody,
} from './profiles-api'

const USER_ID = '333c3d91-402f-4814-938f-0d185f2ddc28'
const PLAYER_PROFILE_ID = 'c5075e8e-e5cc-455d-a566-7b1cacb2341b'

describe('profiles-api', () => {
  it('builds profile url with expected query params', () => {
    const url = new URL(buildProfileUrl(USER_ID))

    expect(url.origin + url.pathname).toBe(PROFILES_ENDPOINT)
    expect(url.searchParams.get('select')).toBe(PROFILES.SELECT_FIELDS)
    expect(url.searchParams.get('id')).toBe(`eq.${USER_ID}`)
  })

  it('parses active_player_profile_id from profile row', () => {
    expect(
      parseActivePlayerProfileId({
        id: USER_ID,
        active_player_profile_id: PLAYER_PROFILE_ID,
      }),
    ).toBe(PLAYER_PROFILE_ID)
  })

  it('returns null when active_player_profile_id is missing', () => {
    expect(parseActivePlayerProfileId({ id: USER_ID })).toBeNull()
    expect(parseActivePlayerProfileId({ id: USER_ID, active_player_profile_id: null })).toBeNull()
  })

  it('parses first profile from postgrest array body', () => {
    expect(
      parseProfilesBody([
        {
          id: USER_ID,
          active_player_profile_id: PLAYER_PROFILE_ID,
        },
      ]),
    ).toBe(PLAYER_PROFILE_ID)
  })

  it('returns parsed active player profile id from fetch', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [{ id: USER_ID, active_player_profile_id: PLAYER_PROFILE_ID }],
    })

    const result = await fetchActivePlayerProfileId('token', USER_ID, fetchImpl)

    expect(result).toBe(PLAYER_PROFILE_ID)
    expect(fetchImpl).toHaveBeenCalledWith(buildProfileUrl(USER_ID), expect.objectContaining({ method: 'GET' }))
  })

  it('returns profile_not_found for empty array', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [],
    })

    const result = await fetchActivePlayerProfileIdWithMeta('token', USER_ID, fetchImpl)

    expect(result).toEqual({ data: null, error: 'profile_not_found', status: 200 })
  })

  it('returns no_player_profile when active_player_profile_id is null', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [{ id: USER_ID, active_player_profile_id: null }],
    })

    const result = await fetchActivePlayerProfileIdWithMeta('token', USER_ID, fetchImpl)

    expect(result).toEqual({ data: null, error: 'no_player_profile', status: 200 })
  })

  it('returns http error metadata', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({}),
    })

    const result = await fetchActivePlayerProfileIdWithMeta('token', USER_ID, fetchImpl)

    expect(result).toEqual({ data: null, error: 'http', status: 401 })
  })

  it('returns network error metadata', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('network'))

    const result = await fetchActivePlayerProfileIdWithMeta('token', USER_ID, fetchImpl)

    expect(result).toEqual({ data: null, error: 'network' })
  })
})
