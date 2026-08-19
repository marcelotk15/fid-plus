import { normalizeText } from '~/modules/shared/text'

import type { PlayerLoadout, StoreItem, StoreItemBonus } from './store-items.types'

export type ItemSlot = 'equipavel' | 'estudo'

export type SelectedItems = {
  equipavel: string | null
  estudo: string | null
}

export const EMPTY_SELECTION: SelectedItems = {
  equipavel: null,
  estudo: null,
}

export function hasSelection(selected: SelectedItems): boolean {
  return selected.equipavel !== null || selected.estudo !== null
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

export type AttrBonusDelta = {
  flat: number
  pct: number
}

export type AttributeSimulation = {
  values: Record<string, AttrBonusDelta>
  deltas: Record<string, AttrBonusDelta>
}

export const EMPTY_SIMULATION: AttributeSimulation = {
  values: {},
  deltas: {},
}

function emptyDelta(): AttrBonusDelta {
  return { flat: 0, pct: 0 }
}

function isEmptyDelta(delta: AttrBonusDelta): boolean {
  return delta.flat === 0 && delta.pct === 0
}

function addBonusValue(delta: AttrBonusDelta, bonus: StoreItemBonus): AttrBonusDelta {
  if (bonus.pct) {
    return { flat: delta.flat, pct: delta.pct + bonus.value }
  }

  return { flat: delta.flat + bonus.value, pct: delta.pct }
}

function subtractDeltas(selected: AttrBonusDelta, equipped: AttrBonusDelta): AttrBonusDelta {
  return {
    flat: selected.flat - equipped.flat,
    pct: selected.pct - equipped.pct,
  }
}

export function mergeBonuses(items: Array<{ bonuses: StoreItemBonus[] }>): Record<string, AttrBonusDelta> {
  const totals: Record<string, AttrBonusDelta> = {}

  for (const item of items) {
    for (const bonus of item.bonuses) {
      totals[bonus.attr] = addBonusValue(totals[bonus.attr] ?? emptyDelta(), bonus)
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

export function matchLoadoutToStoreIds(loadout: PlayerLoadout | null): SelectedItems {
  if (!loadout) return { ...EMPTY_SELECTION }

  return {
    equipavel: loadout.equipavel?.id ?? null,
    estudo: loadout.estudo?.id ?? null,
  }
}

export function mergeLoadoutItems(catalog: StoreItem[], loadout: PlayerLoadout | null): StoreItem[] {
  if (!loadout) return catalog

  const extras: StoreItem[] = []

  for (const slot of [loadout.equipavel, loadout.estudo]) {
    if (!slot) continue
    if (catalog.some((item) => item.id === slot.id)) continue
    extras.push(slot)
  }

  return extras.length === 0 ? catalog : [...extras, ...catalog]
}

export function pinActiveItem(items: StoreItem[], activeId: string | null): StoreItem[] {
  if (!activeId) return items

  const index = items.findIndex((item) => item.id === activeId)

  if (index <= 0) return items

  const next = [...items]
  const [active] = next.splice(index, 1)

  if (!active) return items

  return [active, ...next]
}

export function simulationBonuses(
  items: StoreItem[],
  selected: SelectedItems,
  equipped: SelectedItems,
): AttributeSimulation {
  if (selected.equipavel === equipped.equipavel && selected.estudo === equipped.estudo) {
    return { values: {}, deltas: {} }
  }

  const selectedTotals = mergeBonuses(resolveSelectedItems(items, selected))
  const equippedTotals = mergeBonuses(resolveSelectedItems(items, equipped))
  const replacement: SelectedItems = {
    equipavel: selected.equipavel === equipped.equipavel ? null : selected.equipavel,
    estudo: selected.estudo === equipped.estudo ? null : selected.estudo,
  }
  const displayTotals = mergeBonuses(resolveSelectedItems(items, replacement))
  const values: Record<string, AttrBonusDelta> = {}
  const deltas: Record<string, AttrBonusDelta> = {}
  const attrs = new Set([
    ...Object.keys(selectedTotals),
    ...Object.keys(equippedTotals),
    ...Object.keys(displayTotals),
  ])

  for (const attr of attrs) {
    const selectedBonus = selectedTotals[attr] ?? emptyDelta()
    const equippedBonus = equippedTotals[attr] ?? emptyDelta()
    const displayBonus = displayTotals[attr] ?? emptyDelta()
    const valueDelta = subtractDeltas(selectedBonus, equippedBonus)

    if (isEmptyDelta(valueDelta) && isEmptyDelta(displayBonus)) continue

    if (!isEmptyDelta(valueDelta)) values[attr] = valueDelta
    deltas[attr] = displayBonus
  }

  return { values, deltas }
}

export function filterItemsByName(items: StoreItem[], query: string): StoreItem[] {
  const needle = normalizeText(query)

  if (needle.length === 0) return items

  return items.filter((item) => normalizeText(item.name).includes(needle))
}
