import { describe, expect, it } from 'vitest'

import {
  EVOLUTION_ITEMS_PANEL_STORAGE_KEY,
  parseEvolutionItemsPanelState,
  readEvolutionItemsPanelState,
  writeEvolutionItemsPanelState,
} from './evolution-items-panel.storage'

describe('evolution-items-panel.storage', () => {
  it('reads and writes persisted panel state', () => {
    const storage = {
      values: new Map<string, string>(),
      getItem(key: string) {
        return this.values.get(key) ?? null
      },
      setItem(key: string, value: string) {
        this.values.set(key, value)
      },
    }

    writeEvolutionItemsPanelState(storage, { open: false })

    expect(storage.values.get(EVOLUTION_ITEMS_PANEL_STORAGE_KEY)).toBeTruthy()
    expect(readEvolutionItemsPanelState(storage)).toEqual({ open: false })
  })

  it('returns null for empty or invalid persisted state', () => {
    expect(parseEvolutionItemsPanelState(null)).toBeNull()
    expect(parseEvolutionItemsPanelState('{invalid')).toBeNull()
    expect(parseEvolutionItemsPanelState(JSON.stringify({ foo: true }))).toBeNull()
  })
})
