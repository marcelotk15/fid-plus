import { PLAYER_PROFILES, SUPABASE } from '~/modules/shared/consts'
import { getPositionLabel } from '~/modules/shared/position-labels'

export type PlayerProfileSnapshot = {
  money: number
  fullName: string | null
  primaryPosition: string | null
}

function parseSupabaseUrl(url: string): URL {
  return new URL(url, SUPABASE.BASE_URL)
}

function isSupabaseRequest(url: string): boolean {
  try {
    return parseSupabaseUrl(url).origin === new URL(SUPABASE.BASE_URL).origin
  } catch {
    return false
  }
}

export function isPlayerProfilesSelectedRequest(url: string): boolean {
  if (!isSupabaseRequest(url)) return false

  const parsed = parseSupabaseUrl(url)

  if (!parsed.pathname.includes(PLAYER_PROFILES.TABLE_PATH)) return false
  if (parsed.searchParams.get('select') !== '*') return false

  const id = parsed.searchParams.get('id')

  return Boolean(id?.startsWith('eq.'))
}

function parseOptionalString(value: unknown): string | null {
  if (typeof value !== 'string') return null

  const trimmed = value.trim()

  return trimmed.length > 0 ? trimmed : null
}

export function parsePlayerProfile(body: unknown): PlayerProfileSnapshot | null {
  if (!Array.isArray(body) || body.length === 0) return null

  const row = body[0]

  if (typeof row !== 'object' || row === null) return null

  const fields = row as Record<string, unknown>
  const money = fields.money

  if (typeof money !== 'number' || !Number.isFinite(money)) return null

  const fullName = parseOptionalString(fields.full_name)
  const rawPosition = parseOptionalString(fields.primary_position)

  return {
    money,
    fullName,
    primaryPosition: rawPosition ? getPositionLabel(rawPosition) : null,
  }
}
