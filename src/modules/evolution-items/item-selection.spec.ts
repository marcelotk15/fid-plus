import { describe, expect, it } from 'vitest'

import type { StoreItem } from './store-items.types'

import {
  EMPTY_SELECTION,
  filterItemsByName,
  mergeBonuses,
  resolveSelectedItems,
  selectSlot,
  toggleItem,
} from './item-selection'

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
      drible: 4,
      forca: -4,
      agilidade: 5,
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
