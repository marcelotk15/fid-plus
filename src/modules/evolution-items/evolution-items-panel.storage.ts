import type { StorageLike } from '~/modules/shared/storage.types'

export const EVOLUTION_ITEMS_PANEL_STORAGE_KEY = 'fid-plus:evolution-items:panel' as const

export type EvolutionItemsPanelPersistedState = {
  open: boolean
}

function isEvolutionItemsPanelPersistedState(value: unknown): value is EvolutionItemsPanelPersistedState {
  if (typeof value !== 'object' || value === null) return false

  return typeof (value as Record<string, unknown>).open === 'boolean'
}

export function parseEvolutionItemsPanelState(raw: string | null): EvolutionItemsPanelPersistedState | null {
  if (!raw) return null

  try {
    const parsed: unknown = JSON.parse(raw)

    if (!isEvolutionItemsPanelPersistedState(parsed)) return null

    return parsed
  } catch {
    return null
  }
}

export function readEvolutionItemsPanelState(
  storage: StorageLike = globalThis.localStorage,
): EvolutionItemsPanelPersistedState | null {
  return parseEvolutionItemsPanelState(storage.getItem(EVOLUTION_ITEMS_PANEL_STORAGE_KEY))
}

export function writeEvolutionItemsPanelState(
  storage: StorageLike,
  state: EvolutionItemsPanelPersistedState,
): EvolutionItemsPanelPersistedState {
  storage.setItem(EVOLUTION_ITEMS_PANEL_STORAGE_KEY, JSON.stringify(state))

  return state
}
