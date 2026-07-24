export type SupabaseUser = {
  id: string
  email?: string
  user_metadata?: Record<string, unknown>
}

export type SupabaseStoredAuth = {
  access_token: string
  token_type: 'bearer'
  expires_at?: number
  user?: SupabaseUser
}

export type SupabaseSession = {
  accessToken: string
  user: SupabaseUser
  expiresAt?: number
}
