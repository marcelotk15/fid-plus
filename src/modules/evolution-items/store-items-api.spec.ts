import { describe, expect, it, vi } from 'vitest'

import { STORE_ITEMS, STORE_ITEMS_ENDPOINT } from '~/modules/shared/consts'

import {
  buildStoreItemsUrl,
  fetchStoreItems,
  fetchStoreItemsWithMeta,
  parseStoreItemBonus,
  parseStoreItemRow,
  parseStoreItemsBody,
  partitionStoreItems,
} from './store-items-api'

const EQUIPAVEL_ROW = {
  id: 'eq-1',
  name: 'Chuteira Veloz',
  price: 1200,
  bonuses: [
    { attr: 'drible', value: 4 },
    { attr: 'forca', value: -3 },
  ],
  category: 'v2_equipavel',
  sort_order: 1,
}

const ESTUDO_ROW = {
  id: 'st-1',
  name: 'Estudo de Agilidade',
  price: 800,
  bonuses: [{ attr: 'agilidade', value: 5 }],
  category: 'v2_estudo',
  sort_order: 2,
}

describe('store-items-api', () => {
  it('builds store items url with catalog, availability and category filters', () => {
    const url = new URL(buildStoreItemsUrl())

    expect(url.origin + url.pathname).toBe(STORE_ITEMS_ENDPOINT)
    expect(url.searchParams.get('select')).toBe(STORE_ITEMS.SELECT_FIELDS)
    expect(url.searchParams.get('catalog')).toBe(`eq.${STORE_ITEMS.CATALOG}`)
    expect(url.searchParams.get('is_available')).toBe('eq.true')
    expect(url.searchParams.get('category')).toBe(
      `in.(${STORE_ITEMS.CATEGORY_EQUIPAVEL},${STORE_ITEMS.CATEGORY_ESTUDO})`,
    )
    expect(url.searchParams.get('order')).toBe('sort_order.asc')
  })

  it('parses a bonus entry', () => {
    expect(parseStoreItemBonus({ attr: 'drible', value: 4 })).toEqual({ attr: 'drible', value: 4 })
    expect(parseStoreItemBonus({ attr: 'forca', value: -3 })).toEqual({ attr: 'forca', value: -3 })
    expect(parseStoreItemBonus({ attr: 'agilidade', value: 5, pct: true })).toEqual({
      attr: 'agilidade',
      value: 5,
      pct: true,
    })
    expect(parseStoreItemBonus({ attr: 'agilidade', value: 5, pct: false })).toEqual({
      attr: 'agilidade',
      value: 5,
    })
    expect(parseStoreItemBonus({ attr: 'drible', value: 0 })).toBeNull()
    expect(parseStoreItemBonus({ attr: '', value: 4 })).toBeNull()
  })

  it('parses a store item row and skips invalid bonuses', () => {
    expect(
      parseStoreItemRow({
        ...EQUIPAVEL_ROW,
        bonuses: [{ attr: 'drible', value: 4 }, { attr: 'x' }, null],
      }),
    ).toEqual({
      id: 'eq-1',
      name: 'Chuteira Veloz',
      price: 1200,
      bonuses: [{ attr: 'drible', value: 4 }],
      category: 'v2_equipavel',
      sortOrder: 1,
    })
  })

  it('returns null for rows with unknown category or missing name', () => {
    expect(parseStoreItemRow({ ...EQUIPAVEL_ROW, category: 'boots' })).toBeNull()
    expect(parseStoreItemRow({ ...EQUIPAVEL_ROW, name: '' })).toBeNull()
  })

  it('parses postgrest array and skips invalid rows', () => {
    expect(parseStoreItemsBody([EQUIPAVEL_ROW, { id: 'bad' }, ESTUDO_ROW])).toEqual([
      {
        id: 'eq-1',
        name: 'Chuteira Veloz',
        price: 1200,
        bonuses: [
          { attr: 'drible', value: 4 },
          { attr: 'forca', value: -3 },
        ],
        category: 'v2_equipavel',
        sortOrder: 1,
      },
      {
        id: 'st-1',
        name: 'Estudo de Agilidade',
        price: 800,
        bonuses: [{ attr: 'agilidade', value: 5 }],
        category: 'v2_estudo',
        sortOrder: 2,
      },
    ])
  })

  it('returns null when body is not an array', () => {
    expect(parseStoreItemsBody({ id: 'eq-1' })).toBeNull()
  })

  it('partitions items by category', () => {
    const items = parseStoreItemsBody([ESTUDO_ROW, EQUIPAVEL_ROW])
    expect(items).not.toBeNull()

    const partitioned = partitionStoreItems(items ?? [])

    expect(partitioned.equipavel.map((item) => item.id)).toEqual(['eq-1'])
    expect(partitioned.estudo.map((item) => item.id)).toEqual(['st-1'])
  })

  it('returns parsed items from fetch', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [EQUIPAVEL_ROW],
    })

    const result = await fetchStoreItems('token', fetchImpl)

    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('eq-1')
    expect(fetchImpl).toHaveBeenCalledWith(buildStoreItemsUrl(), expect.objectContaining({ method: 'GET' }))
  })

  it('returns http error metadata', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({}),
    })

    const result = await fetchStoreItemsWithMeta('token', fetchImpl)

    expect(result).toEqual({ data: [], error: 'http', status: 401 })
  })

  it('returns parse error when body is not an array', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ error: 'oops' }),
    })

    const result = await fetchStoreItemsWithMeta('token', fetchImpl)

    expect(result).toEqual({ data: [], error: 'parse', status: 200 })
  })

  it('returns network error metadata', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('network'))

    const result = await fetchStoreItemsWithMeta('token', fetchImpl)

    expect(result).toEqual({ data: [], error: 'network' })
  })
})
