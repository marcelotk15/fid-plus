import type { StorageLike } from '~/modules/shared/storage.types'

export const POPUP_STATE_STORAGE_KEY = 'fid-plus:popup:state' as const

export type PopupPersistedMode = 'open' | 'minimized'

export type PopupPersistedState = {
  visible: boolean
  mode: PopupPersistedMode
  openPosition?: { left: number; top: number }
  minimizedTop?: number
}

function isPopupPersistedState(value: unknown): value is PopupPersistedState {
  if (typeof value !== 'object' || value === null) return false

  const state = value as Record<string, unknown>

  if (typeof state.visible !== 'boolean') return false
  if (state.mode !== 'open' && state.mode !== 'minimized') return false

  if (state.openPosition !== undefined) {
    if (typeof state.openPosition !== 'object' || state.openPosition === null) return false

    const position = state.openPosition as Record<string, unknown>

    if (typeof position.left !== 'number' || typeof position.top !== 'number') return false
  }

  if (state.minimizedTop !== undefined && typeof state.minimizedTop !== 'number') return false

  return true
}

export function parsePopupPersistedState(raw: string | null): PopupPersistedState | null {
  if (!raw) return null

  try {
    const parsed: unknown = JSON.parse(raw)

    if (!isPopupPersistedState(parsed)) return null

    return parsed
  } catch {
    return null
  }
}

export function readPopupPersistedState(storage: StorageLike = globalThis.localStorage): PopupPersistedState | null {
  return parsePopupPersistedState(storage.getItem(POPUP_STATE_STORAGE_KEY))
}

export function writePopupPersistedState(storage: StorageLike, state: PopupPersistedState): PopupPersistedState {
  storage.setItem(POPUP_STATE_STORAGE_KEY, JSON.stringify(state))

  return state
}
