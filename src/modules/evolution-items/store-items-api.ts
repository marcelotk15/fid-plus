import type { FetchLike, FetchResult } from '~/modules/shared/fetch.types'

import { STORE_ITEMS, STORE_ITEMS_ENDPOINT } from '~/modules/shared/consts'
import { buildSupabaseHeaders } from '~/modules/shared/supabase-headers'

import type { StoreItem, StoreItemBonus, StoreItemCategory } from './store-items.types'

const STORE_ITEM_CATEGORIES = new Set<StoreItemCategory>([STORE_ITEMS.CATEGORY_EQUIPAVEL, STORE_ITEMS.CATEGORY_ESTUDO])

export function parseStoreItemBonus(value: unknown): StoreItemBonus | null {
  if (typeof value !== 'object' || value === null) return null

  const row = value as Record<string, unknown>

  if (typeof row.attr !== 'string' || row.attr.length === 0) return null
  if (typeof row.value !== 'number' || !Number.isFinite(row.value) || row.value === 0) return null

  return {
    attr: row.attr,
    value: row.value,
    ...(row.pct === true ? { pct: true } : {}),
  }
}

function parseBonuses(value: unknown): StoreItemBonus[] {
  if (!Array.isArray(value)) return []

  const bonuses: StoreItemBonus[] = []

  for (const entry of value) {
    const bonus = parseStoreItemBonus(entry)
    if (bonus) bonuses.push(bonus)
  }

  return bonuses
}

function parseCategory(value: unknown): StoreItemCategory | null {
  if (typeof value !== 'string') return null
  if (!STORE_ITEM_CATEGORIES.has(value as StoreItemCategory)) return null
  return value as StoreItemCategory
}

export function parseStoreItemRow(value: unknown): StoreItem | null {
  if (typeof value !== 'object' || value === null) return null

  const row = value as Record<string, unknown>
  const category = parseCategory(row.category)

  if (typeof row.id !== 'string' || row.id.length === 0) return null
  if (typeof row.name !== 'string' || row.name.length === 0) return null
  if (typeof row.price !== 'number' || !Number.isFinite(row.price) || row.price < 0) return null
  if (!category) return null

  const sortOrder = typeof row.sort_order === 'number' && Number.isFinite(row.sort_order) ? row.sort_order : 0

  return {
    id: row.id,
    name: row.name,
    price: row.price,
    bonuses: parseBonuses(row.bonuses),
    category,
    sortOrder,
  }
}

export function parseStoreItemsBody(value: unknown): StoreItem[] | null {
  if (!Array.isArray(value)) return null

  const items: StoreItem[] = []

  for (const entry of value) {
    const item = parseStoreItemRow(entry)
    if (item) items.push(item)
  }

  return items
}

export function buildStoreItemsUrl(): string {
  const url = new URL(STORE_ITEMS_ENDPOINT)

  url.searchParams.set('select', STORE_ITEMS.SELECT_FIELDS)
  url.searchParams.set('catalog', `eq.${STORE_ITEMS.CATALOG}`)
  url.searchParams.set('is_available', 'eq.true')
  url.searchParams.set('category', `in.(${STORE_ITEMS.CATEGORY_EQUIPAVEL},${STORE_ITEMS.CATEGORY_ESTUDO})`)
  url.searchParams.set('order', 'sort_order.asc')

  return url.toString()
}

export function partitionStoreItems(items: StoreItem[]): {
  equipavel: StoreItem[]
  estudo: StoreItem[]
} {
  const equipavel: StoreItem[] = []
  const estudo: StoreItem[] = []

  for (const item of items) {
    if (item.category === STORE_ITEMS.CATEGORY_EQUIPAVEL) {
      equipavel.push(item)
    } else {
      estudo.push(item)
    }
  }

  return { equipavel, estudo }
}

export async function fetchStoreItemsWithMeta(
  accessToken: string,
  fetchImpl: FetchLike = globalThis.fetch.bind(globalThis),
): Promise<FetchResult<StoreItem[]>> {
  try {
    const response = await fetchImpl(buildStoreItemsUrl(), {
      method: 'GET',
      headers: buildSupabaseHeaders(accessToken),
    })

    if (!response.ok) {
      return { data: [], error: 'http', status: response.status }
    }

    const body: unknown = await response.json()
    const data = parseStoreItemsBody(body)

    if (!data) {
      return { data: [], error: 'parse', status: response.status }
    }

    return { data, status: response.status }
  } catch {
    return { data: [], error: 'network' }
  }
}

export async function fetchStoreItems(
  accessToken: string,
  fetchImpl: FetchLike = globalThis.fetch.bind(globalThis),
): Promise<StoreItem[]> {
  const result = await fetchStoreItemsWithMeta(accessToken, fetchImpl)
  return result.data
}
