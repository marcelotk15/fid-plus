import { SUPABASE } from '~/modules/shared/consts'

export function buildSupabaseHeaders(accessToken: string): HeadersInit {
  return {
    accept: '*/*',
    apikey: SUPABASE.PUBLIC_API_KEY,
    authorization: `Bearer ${accessToken}`,
    'content-profile': 'public',
    'content-type': 'application/json',
    'x-client-info': SUPABASE.CLIENT_INFO,
  }
}
