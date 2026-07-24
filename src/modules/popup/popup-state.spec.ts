import { describe, expect, it } from 'vitest'

import {
  parsePopupPersistedState,
  POPUP_STATE_STORAGE_KEY,
  readPopupPersistedState,
  writePopupPersistedState,
} from './popup-state'

describe('popup-state', () => {
  it('reads and writes persisted popup state', () => {
    const storage = {
      values: new Map<string, string>(),
      getItem(key: string) {
        return this.values.get(key) ?? null
      },
      setItem(key: string, value: string) {
        this.values.set(key, value)
      },
      removeItem(key: string) {
        this.values.delete(key)
      },
    }

    writePopupPersistedState(storage, {
      visible: true,
      mode: 'minimized',
      minimizedTop: 120,
    })

    expect(storage.values.get(POPUP_STATE_STORAGE_KEY)).toBeTruthy()
    expect(readPopupPersistedState(storage)).toEqual({
      visible: true,
      mode: 'minimized',
      minimizedTop: 120,
    })
  })

  it('returns null for invalid persisted state', () => {
    expect(parsePopupPersistedState('{invalid')).toBeNull()
    expect(parsePopupPersistedState(JSON.stringify({ visible: true }))).toBeNull()
  })
})
