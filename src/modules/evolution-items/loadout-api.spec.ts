import { describe, expect, it, vi } from 'vitest'

import { LOADOUT_ENDPOINT } from '~/modules/shared/consts'
import { buildSupabaseHeaders } from '~/modules/shared/supabase-headers'

import { fetchLoadoutWithMeta, fetchPlayerLoadoutWithMeta, parseLoadoutBody, parseLoadoutSlotItem } from './loadout-api'

const PLAYER_PROFILE_ID = 'c5075e8e-e5cc-455d-a566-7b1cacb2341b'
const USER_ID = '333c3d91-402f-4814-938f-0d185f2ddc28'

const EQUIPAVEL_SLOT = {
  item_id: 'eq-1',
  name_pt: 'Chuteira Veloz',
  price: 1200,
  bonuses: [
    { attr: 'drible', value: 4 },
    { attr: 'forca', value: -3 },
  ],
  category: 'v2_equipavel',
}

const ESTUDO_SLOT = {
  item_id: 'st-1',
  name_pt: 'Estudo de Agilidade',
  price: 800,
  bonuses: [{ attr: 'agilidade', value: 5, pct: true }],
  category: 'v2_estudo',
}

const LOADOUT_BODY = {
  slots: {
    estudo: ESTUDO_SLOT,
    auxiliar: { item_id: 'aux-1', category: 'v2_auxiliar' },
    equipavel: EQUIPAVEL_SLOT,
    planejamento: { item_id: 'plan-1', category: 'v2_planejamento' },
  },
  inventory: [],
}

describe('loadout-api', () => {
  it('parses a loadout slot using item_id and name_pt', () => {
    expect(parseLoadoutSlotItem(EQUIPAVEL_SLOT)).toEqual({
      id: 'eq-1',
      name: 'Chuteira Veloz',
      price: 1200,
      bonuses: [
        { attr: 'drible', value: 4 },
        { attr: 'forca', value: -3 },
      ],
      category: 'v2_equipavel',
      sortOrder: -1,
    })
  })

  it('returns null for slots with unknown category or missing item_id', () => {
    expect(parseLoadoutSlotItem({ ...EQUIPAVEL_SLOT, category: 'v2_auxiliar' })).toBeNull()
    expect(parseLoadoutSlotItem({ ...EQUIPAVEL_SLOT, item_id: '' })).toBeNull()
    expect(parseLoadoutSlotItem(null)).toBeNull()
  })

  it('parses only equipavel and estudo slots', () => {
    expect(parseLoadoutBody(LOADOUT_BODY)).toEqual({
      equipavel: {
        id: 'eq-1',
        name: 'Chuteira Veloz',
        price: 1200,
        bonuses: [
          { attr: 'drible', value: 4 },
          { attr: 'forca', value: -3 },
        ],
        category: 'v2_equipavel',
        sortOrder: -1,
      },
      estudo: {
        id: 'st-1',
        name: 'Estudo de Agilidade',
        price: 800,
        bonuses: [{ attr: 'agilidade', value: 5, pct: true }],
        category: 'v2_estudo',
        sortOrder: -1,
      },
    })
  })

  it('treats missing or null slots as empty loadout entries', () => {
    expect(parseLoadoutBody({ slots: { equipavel: null } })).toEqual({
      equipavel: null,
      estudo: null,
    })
    expect(parseLoadoutBody({ slots: {} })).toEqual({
      equipavel: null,
      estudo: null,
    })
  })

  it('ignores a slot whose category does not match the slot key', () => {
    expect(
      parseLoadoutBody({
        slots: {
          equipavel: ESTUDO_SLOT,
          estudo: EQUIPAVEL_SLOT,
        },
      }),
    ).toEqual({
      equipavel: null,
      estudo: null,
    })
  })

  it('returns null when slots is missing', () => {
    expect(parseLoadoutBody({ inventory: [] })).toBeNull()
    expect(parseLoadoutBody(null)).toBeNull()
  })

  it('parses a loadout body wrapped in an array', () => {
    expect(parseLoadoutBody([LOADOUT_BODY])?.equipavel?.id).toBe('eq-1')
  })

  it('falls back to name when name_pt is missing', () => {
    expect(
      parseLoadoutSlotItem({
        item_id: 'eq-1',
        name: 'Chuteira Veloz',
        price: 1200,
        bonuses: [],
        category: 'v2_equipavel',
      })?.name,
    ).toBe('Chuteira Veloz')
  })

  it('posts p_player_profile_id and returns parsed slots', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => LOADOUT_BODY,
    })

    const result = await fetchLoadoutWithMeta('token', PLAYER_PROFILE_ID, fetchImpl)

    expect(result.data?.equipavel?.id).toBe('eq-1')
    expect(result.data?.estudo?.id).toBe('st-1')
    expect(fetchImpl).toHaveBeenCalledWith(LOADOUT_ENDPOINT, {
      method: 'POST',
      headers: buildSupabaseHeaders('token'),
      body: JSON.stringify({ p_player_profile_id: PLAYER_PROFILE_ID }),
    })
  })

  it('returns http error metadata', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({}),
    })

    const result = await fetchLoadoutWithMeta('token', PLAYER_PROFILE_ID, fetchImpl)

    expect(result).toEqual({ data: null, error: 'http', status: 401 })
  })

  it('returns parse error when body has no slots', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ inventory: [] }),
    })

    const result = await fetchLoadoutWithMeta('token', PLAYER_PROFILE_ID, fetchImpl)

    expect(result).toEqual({ data: null, error: 'parse', status: 200 })
  })

  it('returns network error metadata', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('network'))

    const result = await fetchLoadoutWithMeta('token', PLAYER_PROFILE_ID, fetchImpl)

    expect(result).toEqual({ data: null, error: 'network' })
  })

  it('resolves the player profile id before fetching the loadout', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ id: USER_ID, active_player_profile_id: PLAYER_PROFILE_ID }],
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => LOADOUT_BODY,
      })

    const result = await fetchPlayerLoadoutWithMeta('token', USER_ID, fetchImpl)

    expect(result.data?.equipavel?.id).toBe('eq-1')
    expect(fetchImpl).toHaveBeenCalledTimes(2)
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      LOADOUT_ENDPOINT,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ p_player_profile_id: PLAYER_PROFILE_ID }),
      }),
    )
  })

  it('returns parse error when the player has no active profile', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [{ id: USER_ID, active_player_profile_id: null }],
    })

    const result = await fetchPlayerLoadoutWithMeta('token', USER_ID, fetchImpl)

    expect(result).toEqual({ data: null, error: 'parse', status: 200 })
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })
})
