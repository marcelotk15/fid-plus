import type { FetchLike, FetchResult } from '~/modules/shared/fetch.types'

import { LOADOUT_ENDPOINT, STORE_ITEMS } from '~/modules/shared/consts'
import { buildSupabaseHeaders } from '~/modules/shared/supabase-headers'
import { fetchActivePlayerProfileIdWithMeta } from '~/modules/weekly-earnings/profiles-api'

import type { PlayerLoadout, StoreItem, StoreItemCategory } from './store-items.types'

import { parseStoreItemRow } from './store-items-api'

export type FetchLoadoutResult = FetchResult<PlayerLoadout | null>

function parseLoadoutName(row: Record<string, unknown>): string | null {
  for (const key of ['name_pt', 'name', 'name_en', 'name_es']) {
    const value = row[key]
    if (typeof value === 'string' && value.trim().length > 0) return value
  }

  return null
}

function parseLoadoutPrice(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) return value

  if (typeof value === 'string' && value.length > 0) {
    const parsed = Number(value)
    if (Number.isFinite(parsed) && parsed >= 0) return parsed
  }

  return null
}

export function parseLoadoutSlotItem(value: unknown): StoreItem | null {
  if (typeof value !== 'object' || value === null) return null

  const row = value as Record<string, unknown>
  const name = parseLoadoutName(row)
  const price = parseLoadoutPrice(row.price)

  if (!name || price === null) return null

  return parseStoreItemRow({
    id: row.item_id,
    name,
    price,
    bonuses: row.bonuses,
    category: row.category,
    sort_order: -1,
  })
}

function parseLoadoutSlot(value: unknown, expectedCategory: StoreItemCategory): StoreItem | null {
  if (value == null) return null

  const item = parseLoadoutSlotItem(value)

  if (!item) return null
  if (item.category !== expectedCategory) return null

  return item
}

function unwrapLoadoutPayload(value: unknown): unknown {
  return Array.isArray(value) ? value[0] : value
}

export function parseLoadoutBody(value: unknown): PlayerLoadout | null {
  const body = unwrapLoadoutPayload(value)

  if (typeof body !== 'object' || body === null) return null

  const payload = body as Record<string, unknown>
  const slots = payload.slots

  if (typeof slots !== 'object' || slots === null) return null

  const slotMap = slots as Record<string, unknown>

  return {
    equipavel: parseLoadoutSlot(slotMap.equipavel, STORE_ITEMS.CATEGORY_EQUIPAVEL),
    estudo: parseLoadoutSlot(slotMap.estudo, STORE_ITEMS.CATEGORY_ESTUDO),
  }
}

export async function fetchLoadoutWithMeta(
  accessToken: string,
  playerProfileId: string,
  fetchImpl: FetchLike = globalThis.fetch.bind(globalThis),
): Promise<FetchLoadoutResult> {
  try {
    const response = await fetchImpl(LOADOUT_ENDPOINT, {
      method: 'POST',
      headers: buildSupabaseHeaders(accessToken),
      body: JSON.stringify({ p_player_profile_id: playerProfileId }),
    })

    if (!response.ok) {
      return { data: null, error: 'http', status: response.status }
    }

    const body: unknown = await response.json()
    const data = parseLoadoutBody(body)

    if (!data) {
      return { data: null, error: 'parse', status: response.status }
    }

    return { data, status: response.status }
  } catch {
    return { data: null, error: 'network' }
  }
}

export async function fetchPlayerLoadoutWithMeta(
  accessToken: string,
  userId: string,
  fetchImpl: FetchLike = globalThis.fetch.bind(globalThis),
): Promise<FetchLoadoutResult> {
  const profileResult = await fetchActivePlayerProfileIdWithMeta(accessToken, userId, fetchImpl)

  if (!profileResult.data) {
    const error = profileResult.error === 'http' || profileResult.error === 'network' ? profileResult.error : 'parse'

    return { data: null, error, status: profileResult.status }
  }

  return fetchLoadoutWithMeta(accessToken, profileResult.data, fetchImpl)
}
