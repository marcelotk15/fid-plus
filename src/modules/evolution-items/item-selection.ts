import { normalizeText } from '~/modules/shared/text'

import type { StoreItem, StoreItemBonus } from './store-items.types'

export type ItemSlot = 'equipavel' | 'estudo'

export type SelectedItems = {
  equipavel: string | null
  estudo: string | null
}

export const EMPTY_SELECTION: SelectedItems = {
  equipavel: null,
  estudo: null,
}

export function toggleItem(currentId: string | null, clickedId: string): string | null {
  return currentId === clickedId ? null : clickedId
}

export function selectSlot(selected: SelectedItems, slot: ItemSlot, clickedId: string): SelectedItems {
  return {
    ...selected,
    [slot]: toggleItem(selected[slot], clickedId),
  }
}

export function mergeBonuses(items: Array<{ bonuses: StoreItemBonus[] }>): Record<string, number> {
  const totals: Record<string, number> = {}

  for (const item of items) {
    for (const bonus of item.bonuses) {
      totals[bonus.attr] = (totals[bonus.attr] ?? 0) + bonus.value
    }
  }

  return totals
}

export function resolveSelectedItems(items: StoreItem[], selected: SelectedItems): StoreItem[] {
  const resolved: StoreItem[] = []
  const equipavel = items.find((item) => item.id === selected.equipavel)
  const estudo = items.find((item) => item.id === selected.estudo)

  if (equipavel) resolved.push(equipavel)
  if (estudo) resolved.push(estudo)

  return resolved
}

export function filterItemsByName(items: StoreItem[], query: string): StoreItem[] {
  const needle = normalizeText(query)

  if (needle.length === 0) return items

  return items.filter((item) => normalizeText(item.name).includes(needle))
}
