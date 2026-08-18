import { describe, expect, it } from 'vitest'

import { PLAYER_PROFILES, PROFILES, SUPABASE } from '~/modules/shared/consts'

import { isPlayerProfilesSelectedRequest, parsePlayerProfile } from './player-profiles-api'

const PLAYER_PROFILE_ID = '8466db2d-4cbe-4c3f-a3a6-8c6824a7a565'
const USER_ID = '333c3d91-402f-4814-938f-0d185f2ddc28'

describe('isPlayerProfilesMoneyRequest', () => {
  it('matches player_profiles urls with select=* and id=eq', () => {
    const url = `${SUPABASE.BASE_URL}${PLAYER_PROFILES.TABLE_PATH}?select=*&id=eq.${PLAYER_PROFILE_ID}&user_id=eq.${USER_ID}`

    expect(isPlayerProfilesSelectedRequest(url)).toBe(true)
  })

  it('rejects player_profiles urls without id', () => {
    const url = `${SUPABASE.BASE_URL}${PLAYER_PROFILES.TABLE_PATH}?select=*&user_id=eq.${USER_ID}`

    expect(isPlayerProfilesSelectedRequest(url)).toBe(false)
  })

  it('rejects player_profiles urls with a partial select', () => {
    const url = `${SUPABASE.BASE_URL}${PLAYER_PROFILES.TABLE_PATH}?select=id,money&id=eq.${PLAYER_PROFILE_ID}`

    expect(isPlayerProfilesSelectedRequest(url)).toBe(false)
  })

  it('rejects the account profiles table', () => {
    const url = `${SUPABASE.BASE_URL}${PROFILES.TABLE_PATH}?select=*&id=eq.${USER_ID}`

    expect(isPlayerProfilesSelectedRequest(url)).toBe(false)
  })

  it('rejects non-supabase urls', () => {
    const url = `https://example.com${PLAYER_PROFILES.TABLE_PATH}?select=*&id=eq.${PLAYER_PROFILE_ID}`

    expect(isPlayerProfilesSelectedRequest(url)).toBe(false)
  })
})

describe('parsePlayerProfile', () => {
  it('reads money, name and mapped position from the first array item', () => {
    expect(
      parsePlayerProfile([
        {
          money: 1500,
          full_name: 'Marcelo',
          primary_position: 'LM',
        },
      ]),
    ).toEqual({
      money: 1500,
      fullName: 'Marcelo',
      primaryPosition: 'ME',
    })
  })

  it('accepts a zero balance and null name/position', () => {
    expect(parsePlayerProfile([{ money: 0 }])).toEqual({
      money: 0,
      fullName: null,
      primaryPosition: null,
    })
  })

  it('treats blank name and position as null', () => {
    expect(
      parsePlayerProfile([
        {
          money: 1000,
          full_name: '  ',
          primary_position: '',
        },
      ]),
    ).toEqual({
      money: 1000,
      fullName: null,
      primaryPosition: null,
    })
  })

  it('returns null for an empty array', () => {
    expect(parsePlayerProfile([])).toBeNull()
  })

  it('returns null when money is missing or invalid', () => {
    expect(parsePlayerProfile([{}])).toBeNull()
    expect(parsePlayerProfile([{ money: '1500' }])).toBeNull()
    expect(parsePlayerProfile([{ money: Number.NaN }])).toBeNull()
    expect(parsePlayerProfile({ money: 1500 })).toBeNull()
  })
})
