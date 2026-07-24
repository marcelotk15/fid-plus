import { describe, expect, it } from 'vitest'

import { CONTRACTS, PROFILES, SUPABASE, WEEKLY_OBJECTIVES } from '~/modules/shared/consts'

import {
  extractPlayerProfileId,
  extractProfileUserId,
  isWeeklyEarningsContractRequest,
  isWeeklyEarningsObjectivesRequest,
  isWeeklyEarningsProfileRequest,
  isWeeklyEarningsSponsorshipsRequest,
} from './weekly-earnings-fetch-bridge'

const USER_ID = '333c3d91-402f-4814-938f-0d185f2ddc28'
const PLAYER_PROFILE_ID = 'c5075e8e-e5cc-455d-a566-7b1cacb2341b'

describe('weekly-earnings-fetch-bridge', () => {
  it('matches profile request urls', () => {
    const url = `${SUPABASE.BASE_URL}${PROFILES.TABLE_PATH}?select=*&id=eq.${USER_ID}`

    expect(isWeeklyEarningsProfileRequest(url)).toBe(true)
    expect(extractProfileUserId(url)).toBe(USER_ID)
  })

  it('matches contract request urls', () => {
    const url = `${SUPABASE.BASE_URL}${CONTRACTS.TABLE_PATH}?player_profile_id=eq.${PLAYER_PROFILE_ID}`

    expect(isWeeklyEarningsContractRequest(url)).toBe(true)
    expect(extractPlayerProfileId(url)).toBe(PLAYER_PROFILE_ID)
  })

  it('matches sponsorships and objectives request urls', () => {
    const sponsorshipsUrl = `${SUPABASE.BASE_URL}/rest/v1/active_sponsorships?player_profile_id=eq.${PLAYER_PROFILE_ID}`
    const objectivesUrl = `${SUPABASE.BASE_URL}${SUPABASE.RPC_PATH_PREFIX}/${WEEKLY_OBJECTIVES.RPC}`

    expect(isWeeklyEarningsSponsorshipsRequest(sponsorshipsUrl)).toBe(true)
    expect(isWeeklyEarningsObjectivesRequest(objectivesUrl)).toBe(true)
  })
})
