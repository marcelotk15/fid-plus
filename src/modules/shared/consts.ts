export const APP_NAME = 'FID Plus'

/** URLs e paths do backend Supabase. */
export const SUPABASE = {
  BASE_URL: 'https://vbpgsdotwsfsiutydpad.supabase.co',
  RPC_PATH_PREFIX: '/rest/v1/rpc',
  AUTH_STORAGE_KEY: 'sb-vbpgsdotwsfsiutydpad-auth-token',
  PUBLIC_API_KEY: 'sb_publishable_JmOwSLwTLCOyid5Ecg6-3A_TUuTK-gu',
  CLIENT_INFO: 'supabase-js-web/2.99.2',
} as const

export const DAILY_PACK = {
  RPC: 'get_daily_pack_status',
  CACHE_STORAGE_KEY: 'fid-plus:daily-pack:next-reset-at',
} as const

export const DAILY_PACK_ENDPOINT = `${SUPABASE.BASE_URL}${SUPABASE.RPC_PATH_PREFIX}/${DAILY_PACK.RPC}` as const

export const CONTRACTS = {
  TABLE_PATH: '/rest/v1/contracts',
} as const

export const CONTRACTS_ENDPOINT = `${SUPABASE.BASE_URL}${CONTRACTS.TABLE_PATH}` as const

export const PROFILES = {
  TABLE_PATH: '/rest/v1/profiles',
  SELECT_FIELDS:
    'id,username,role_selected,created_at,updated_at,avatar_url,avatar_char_ref,bio,active_player_profile_id,active_manager_profile_id,active_journalist_profile_id,is_admin,tutorials_seen,country_code,country_code_locked,preferred_language,player_last_reset_at,banned_until,ban_reason',
} as const

export const PROFILES_ENDPOINT = `${SUPABASE.BASE_URL}${PROFILES.TABLE_PATH}` as const

export const PLAYER_PROFILES = {
  TABLE_PATH: '/rest/v1/player_profiles',
} as const

export const PLAYER_PROFILES_ENDPOINT = `${SUPABASE.BASE_URL}${PLAYER_PROFILES.TABLE_PATH}` as const

export const ACTIVE_SPONSORSHIPS = {
  TABLE_PATH: '/rest/v1/active_sponsorships',
} as const

export const ACTIVE_SPONSORSHIPS_ENDPOINT = `${SUPABASE.BASE_URL}${ACTIVE_SPONSORSHIPS.TABLE_PATH}` as const

export const STORE_ITEMS = {
  TABLE_PATH: '/rest/v1/store_items',
  SELECT_FIELDS: 'id,name,price,bonuses,category,sort_order',
  CATALOG: 'v2',
  CATEGORY_EQUIPAVEL: 'v2_equipavel',
  CATEGORY_ESTUDO: 'v2_estudo',
} as const

export const STORE_ITEMS_ENDPOINT = `${SUPABASE.BASE_URL}${STORE_ITEMS.TABLE_PATH}` as const

export const WEEKLY_OBJECTIVES = {
  RPC: 'get_my_weekly_objectives',
} as const

export const WEEKLY_OBJECTIVES_ENDPOINT =
  `${SUPABASE.BASE_URL}${SUPABASE.RPC_PATH_PREFIX}/${WEEKLY_OBJECTIVES.RPC}` as const

export const WEEKLY_EARNINGS = {
  CACHE_KEY_PREFIX: 'fid-plus:weekly-earnings',
  SPONSORSHIPS_STALE_MS: 60 * 60 * 1000,
} as const

export function weeklyEarningsCacheKey(userId: string): string {
  return `${WEEKLY_EARNINGS.CACHE_KEY_PREFIX}:${userId}`
}

/** Identificadores da comunicação entre content scripts da extensão. */
export const MESSAGE_SOURCE = {
  DAILY_PACK: 'fid-plus:daily-pack',
  WEEKLY_EARNINGS: 'fid-plus:weekly-earnings',
  STORE: 'fid-plus:store',
} as const

export const STORE_MESSAGE_TYPE = {
  PLAYER_PROFILE: 'store:player-profile',
} as const

export const WEEKLY_EARNINGS_MESSAGE_TYPE = {
  PROFILE: 'weekly-earnings:profile',
  CONTRACT: 'weekly-earnings:contract',
  SPONSORSHIPS: 'weekly-earnings:sponsorships',
  OBJECTIVES: 'weekly-earnings:objectives',
} as const
