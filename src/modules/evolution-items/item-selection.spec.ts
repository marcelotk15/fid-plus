import { describe, expect, it } from 'vitest'

import type { PlayerLoadout, StoreItem } from './store-items.types'

import {
  EMPTY_SELECTION,
  filterItemsByName,
  hasSelection,
  matchLoadoutToStoreIds,
  mergeBonuses,
  mergeLoadoutItems,
  pinActiveItem,
  resolveSelectedItems,
  selectSlot,
  simulationBonuses,
  toggleItem,
  type AttrBonusDelta,
  type SelectedItems,
} from './item-selection'

function delta(flat: number, pct = 0): AttrBonusDelta {
  return { flat, pct }
}

const EQUIPAVEL: StoreItem = {
  id: 'eq-1',
  name: 'Chuteira Veloz',
  price: 1200,
  bonuses: [
    { attr: 'drible', value: 4 },
    { attr: 'forca', value: -3 },
  ],
  category: 'v2_equipavel',
  sortOrder: 1,
}

const ESTUDO: StoreItem = {
  id: 'st-1',
  name: 'Estudo de Agilidade',
  price: 800,
  bonuses: [
    { attr: 'agilidade', value: 5 },
    { attr: 'forca', value: -1 },
  ],
  category: 'v2_estudo',
  sortOrder: 2,
}

const EQUIPAVEL_ALT: StoreItem = {
  id: 'eq-2',
  name: 'Chuteira Pesada',
  price: 900,
  bonuses: [{ attr: 'forca', value: 3 }],
  category: 'v2_equipavel',
  sortOrder: 3,
}

const ESTUDO_PCT: StoreItem = {
  id: 'st-pct',
  name: 'Estudo Percentual',
  price: 800,
  bonuses: [{ attr: 'agilidade', value: 5, pct: true }],
  category: 'v2_estudo',
  sortOrder: 4,
}

const ESTUDO_PCT_ALT: StoreItem = {
  id: 'st-pct-2',
  name: 'Estudo Percentual Forte',
  price: 900,
  bonuses: [{ attr: 'agilidade', value: 7, pct: true }],
  category: 'v2_estudo',
  sortOrder: 5,
}

const LOADOUT: PlayerLoadout = {
  equipavel: EQUIPAVEL,
  estudo: ESTUDO,
}

describe('hasSelection', () => {
  it('detects any selected slot', () => {
    expect(hasSelection(EMPTY_SELECTION)).toBe(false)
    expect(hasSelection({ equipavel: 'eq-1', estudo: null })).toBe(true)
  })
})

describe('toggleItem', () => {
  it('selects when nothing is selected', () => {
    expect(toggleItem(null, 'eq-1')).toBe('eq-1')
  })

  it('removes when clicking the active item', () => {
    expect(toggleItem('eq-1', 'eq-1')).toBeNull()
  })

  it('replaces when clicking another item', () => {
    expect(toggleItem('eq-1', 'eq-2')).toBe('eq-2')
  })
})

describe('selectSlot', () => {
  it('toggles only the clicked slot', () => {
    const withEquipavel = selectSlot(EMPTY_SELECTION, 'equipavel', 'eq-1')
    expect(withEquipavel).toEqual({ equipavel: 'eq-1', estudo: null })

    const withBoth = selectSlot(withEquipavel, 'estudo', 'st-1')
    expect(withBoth).toEqual({ equipavel: 'eq-1', estudo: 'st-1' })

    const replacedEquipavel = selectSlot(withBoth, 'equipavel', 'eq-2')
    expect(replacedEquipavel).toEqual({ equipavel: 'eq-2', estudo: 'st-1' })

    const clearedEstudo = selectSlot(replacedEquipavel, 'estudo', 'st-1')
    expect(clearedEstudo).toEqual({ equipavel: 'eq-2', estudo: null })
  })
})

describe('mergeBonuses', () => {
  it('sums overlapping attrs from both item types', () => {
    expect(mergeBonuses([EQUIPAVEL, ESTUDO])).toEqual({
      drible: delta(4),
      forca: delta(-4),
      agilidade: delta(5),
    })
  })

  it('keeps percentage bonuses separate from flat values', () => {
    expect(mergeBonuses([EQUIPAVEL, ESTUDO_PCT])).toEqual({
      drible: delta(4),
      forca: delta(-3),
      agilidade: delta(0, 5),
    })
  })

  it('returns empty object when there are no items', () => {
    expect(mergeBonuses([])).toEqual({})
  })
})

describe('resolveSelectedItems', () => {
  it('returns selected items in equipavel-then-estudo order', () => {
    expect(
      resolveSelectedItems([ESTUDO, EQUIPAVEL], { equipavel: 'eq-1', estudo: 'st-1' }).map((item) => item.id),
    ).toEqual(['eq-1', 'st-1'])
  })

  it('ignores ids that are not in the catalog', () => {
    expect(resolveSelectedItems([EQUIPAVEL], { equipavel: 'missing', estudo: null })).toEqual([])
  })
})

describe('matchLoadoutToStoreIds', () => {
  it('maps loadout item_id to catalog store ids', () => {
    expect(matchLoadoutToStoreIds(LOADOUT)).toEqual({
      equipavel: 'eq-1',
      estudo: 'st-1',
    })
  })

  it('keeps slot ids when the item is not in the catalog', () => {
    expect(matchLoadoutToStoreIds({ equipavel: EQUIPAVEL, estudo: null })).toEqual({
      equipavel: 'eq-1',
      estudo: null,
    })
  })

  it('returns empty selection when loadout is missing', () => {
    expect(matchLoadoutToStoreIds(null)).toEqual(EMPTY_SELECTION)
  })
})

describe('mergeLoadoutItems', () => {
  it('injects equipped items that are not in the catalog', () => {
    expect(mergeLoadoutItems([EQUIPAVEL], { equipavel: null, estudo: ESTUDO }).map((item) => item.id)).toEqual([
      'st-1',
      'eq-1',
    ])
  })

  it('does not duplicate items already in the catalog', () => {
    expect(mergeLoadoutItems([EQUIPAVEL, ESTUDO], LOADOUT)).toEqual([EQUIPAVEL, ESTUDO])
  })
})

describe('pinActiveItem', () => {
  it('moves the active item to the top', () => {
    expect(pinActiveItem([EQUIPAVEL, EQUIPAVEL_ALT], 'eq-2').map((item) => item.id)).toEqual(['eq-2', 'eq-1'])
  })

  it('keeps order when the active item is already first or missing', () => {
    expect(pinActiveItem([EQUIPAVEL, EQUIPAVEL_ALT], 'eq-1')).toEqual([EQUIPAVEL, EQUIPAVEL_ALT])
    expect(pinActiveItem([EQUIPAVEL, EQUIPAVEL_ALT], 'missing')).toEqual([EQUIPAVEL, EQUIPAVEL_ALT])
    expect(pinActiveItem([EQUIPAVEL, EQUIPAVEL_ALT], null)).toEqual([EQUIPAVEL, EQUIPAVEL_ALT])
  })
})

describe('simulationBonuses', () => {
  const items = [EQUIPAVEL, EQUIPAVEL_ALT, ESTUDO]
  const equipped: SelectedItems = { equipavel: 'eq-1', estudo: 'st-1' }

  it('returns no simulation when the selection matches the equipped loadout', () => {
    expect(simulationBonuses(items, equipped, equipped)).toEqual({ values: {}, deltas: {} })
  })

  it('uses equipped bonuses as base and shows the selected item delta', () => {
    const active: StoreItem = {
      ...EQUIPAVEL,
      bonuses: [{ attr: 'velocidade', value: 2 }],
    }
    const replacement: StoreItem = {
      ...EQUIPAVEL_ALT,
      bonuses: [{ attr: 'velocidade', value: 3 }],
    }

    expect(
      simulationBonuses(
        [active, replacement],
        { equipavel: 'eq-2', estudo: null },
        { equipavel: 'eq-1', estudo: null },
      ),
    ).toEqual({
      values: { velocidade: delta(1) },
      deltas: { velocidade: delta(3) },
    })
  })

  it('applies the replacement bonuses and drops equipped attrs from the value', () => {
    expect(simulationBonuses(items, { equipavel: 'eq-2', estudo: 'st-1' }, equipped)).toEqual({
      values: { drible: delta(-4), forca: delta(6) },
      deltas: { drible: delta(0), forca: delta(3) },
    })
  })

  it('shows only the replaced item delta when the other slot stays equipped', () => {
    const activeEquipavel: StoreItem = {
      ...EQUIPAVEL,
      bonuses: [{ attr: 'aceleracao', value: 5 }],
    }
    const otherEquipavel: StoreItem = {
      ...EQUIPAVEL_ALT,
      bonuses: [{ attr: 'aceleracao', value: 4 }],
    }
    const activeEstudo: StoreItem = {
      ...ESTUDO,
      bonuses: [{ attr: 'aceleracao', value: 5 }],
    }

    expect(
      simulationBonuses(
        [activeEquipavel, otherEquipavel, activeEstudo],
        { equipavel: 'eq-2', estudo: 'st-1' },
        { equipavel: 'eq-1', estudo: 'st-1' },
      ),
    ).toEqual({
      values: { aceleracao: delta(-1) },
      deltas: { aceleracao: delta(4) },
    })
  })

  it('subtracts equipped bonuses from the value when the slot is cleared', () => {
    expect(simulationBonuses(items, { equipavel: null, estudo: null }, equipped)).toEqual({
      values: { drible: delta(-4), forca: delta(4), agilidade: delta(-5) },
      deltas: { drible: delta(0), forca: delta(0), agilidade: delta(0) },
    })
  })

  it('does not apply the equipped item bonuses when it stays selected', () => {
    expect(simulationBonuses(items, { equipavel: 'eq-1', estudo: null }, { equipavel: 'eq-1', estudo: null })).toEqual({
      values: {},
      deltas: {},
    })
  })

  it('subtracts and applies percentage bonuses without mixing them into flat values', () => {
    expect(
      simulationBonuses(
        [ESTUDO_PCT, ESTUDO_PCT_ALT],
        { equipavel: null, estudo: 'st-pct-2' },
        { equipavel: null, estudo: 'st-pct' },
      ),
    ).toEqual({
      values: { agilidade: delta(0, 2) },
      deltas: { agilidade: delta(0, 7) },
    })
  })
})

describe('filterItemsByName', () => {
  const items = [EQUIPAVEL, ESTUDO]

  it('returns all items when the query is empty or whitespace', () => {
    expect(filterItemsByName(items, '')).toEqual(items)
    expect(filterItemsByName(items, '   ')).toEqual(items)
  })

  it('matches a substring ignoring case and extra spaces', () => {
    expect(filterItemsByName(items, 'veloz')).toEqual([EQUIPAVEL])
    expect(filterItemsByName(items, '  AGILIDADE  ')).toEqual([ESTUDO])
  })

  it('returns an empty list when nothing matches', () => {
    expect(filterItemsByName(items, 'xyz')).toEqual([])
  })
})
