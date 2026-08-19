import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { installStorageChangeNotifier } from '~/modules/shared/storage-sync'

import type { AttributeSimulation } from './item-selection'
import type { PlayerLoadout, StoreItem } from './store-items.types'

import { EvolutionItemsPanel } from './evolution-items-panel'
import {
  EVOLUTION_ITEMS_PANEL_STORAGE_KEY,
  parseEvolutionItemsPanelState,
  writeEvolutionItemsPanelState,
} from './evolution-items-panel.storage'

const { EQUIPAVEL_ACTIVE, EQUIPAVEL_OTHER, LOADOUT } = vi.hoisted(() => {
  const active: StoreItem = {
    id: 'eq-1',
    name: 'Chuteira Veloz',
    price: 1200,
    bonuses: [{ attr: 'drible', value: 4 }],
    category: 'v2_equipavel',
    sortOrder: 2,
  }
  const other: StoreItem = {
    id: 'eq-2',
    name: 'Chuteira Pesada',
    price: 900,
    bonuses: [{ attr: 'forca', value: 3, pct: true }],
    category: 'v2_equipavel',
    sortOrder: 1,
  }
  const loadout: PlayerLoadout = {
    equipavel: { ...active, sortOrder: -1 },
    estudo: null,
  }

  return { EQUIPAVEL_ACTIVE: active, EQUIPAVEL_OTHER: other, LOADOUT: loadout }
})

vi.mock('./use-store-items', () => ({
  useStoreItems: () => ({
    items: [EQUIPAVEL_OTHER, EQUIPAVEL_ACTIVE],
    loading: false,
    error: null,
  }),
}))

vi.mock('./use-player-loadout', () => ({
  usePlayerLoadout: () => ({
    loadout: LOADOUT,
    loading: false,
  }),
}))

function renderPanel(
  onSelectionChange: (
    selected: { equipavel: string | null; estudo: string | null },
    simulation: AttributeSimulation,
  ) => void = () => {},
): { container: HTMLDivElement; root: Root } {
  const container = document.createElement('div')
  document.body.append(container)

  const root = createRoot(container)

  act(() => {
    root.render(<EvolutionItemsPanel onSelectionChange={onSelectionChange} />)
  })

  return { container, root }
}

function getTrigger(): HTMLButtonElement {
  const trigger = document.querySelector('[data-testid="evolution-items-panel"] button[aria-expanded]')
  if (!(trigger instanceof HTMLButtonElement)) {
    throw new TypeError('Panel toggle trigger not found')
  }
  return trigger
}

describe('EvolutionItemsPanel', () => {
  let root: Root | null = null

  beforeEach(() => {
    document.body.replaceChildren()
    localStorage.clear()
    installStorageChangeNotifier()
  })

  afterEach(() => {
    act(() => {
      root?.unmount()
    })
    root = null
  })

  it('shows tabs and items when storage is empty', () => {
    const rendered = renderPanel()
    root = rendered.root

    expect(getTrigger().getAttribute('aria-expanded')).toBe('true')
    expect(document.body.textContent).toContain('Simular itens')
    expect(document.body.textContent).toContain('Simulação local')
    const content = document.querySelector('[data-testid="evolution-items-panel-content"]')
    expect(content?.getAttribute('aria-hidden')).toBe('false')
    expect(content?.hasAttribute('hidden')).toBe(false)
    expect(getTrigger().querySelector('.lucide-chevron-down')?.getAttribute('data-open')).toBe('true')
    expect(document.body.textContent).toContain('Chuteira Veloz')
  })

  it('hides tabs and items when collapsed, keeping title and description', () => {
    writeEvolutionItemsPanelState(localStorage, { open: false })

    const rendered = renderPanel()
    root = rendered.root

    expect(getTrigger().getAttribute('aria-expanded')).toBe('false')
    expect(document.body.textContent).toContain('Simular itens')
    expect(document.body.textContent).toContain('Simulação local')
    const content = document.querySelector('[data-testid="evolution-items-panel-content"]')
    expect(content?.getAttribute('aria-hidden')).toBe('true')
    expect(content?.hasAttribute('hidden')).toBe(true)
    expect(getTrigger().querySelector('.lucide-chevron-down')?.getAttribute('data-open')).toBe('false')
  })

  it('persists collapsed state on click', () => {
    const rendered = renderPanel()
    root = rendered.root

    act(() => {
      getTrigger().click()
    })

    expect(getTrigger().getAttribute('aria-expanded')).toBe('false')
    const content = document.querySelector('[data-testid="evolution-items-panel-content"]')
    expect(content?.getAttribute('aria-hidden')).toBe('true')
    expect(content?.hasAttribute('hidden')).toBe(true)
    expect(getTrigger().querySelector('.lucide-chevron-down')?.getAttribute('data-open')).toBe('false')
    expect(parseEvolutionItemsPanelState(localStorage.getItem(EVOLUTION_ITEMS_PANEL_STORAGE_KEY))).toEqual({
      open: false,
    })
  })

  it('pins the equipped item to the top as atual ativo without applying its bonuses', () => {
    const onSelectionChange = vi.fn()
    const rendered = renderPanel(onSelectionChange)
    root = rendered.root

    const rows = [...document.querySelectorAll('[data-testid="evolution-items-panel-content"] button[aria-pressed]')]

    expect(rows[0]?.textContent).toContain('Chuteira Veloz')
    expect(rows[0]?.textContent).toContain('+4 Drible')
    expect(rows[0]?.textContent).toContain('atual ativo na build')
    expect(rows[0]?.getAttribute('aria-pressed')).toBe('true')
    expect(rows[1]?.textContent).toContain('Chuteira Pesada')
    expect(rows[1]?.textContent).toContain('+3% Força')
    expect(rows[1]?.textContent).not.toContain('atual ativo na build')
    expect(rows[1]?.getAttribute('aria-pressed')).toBe('false')
    expect(onSelectionChange).toHaveBeenCalledWith({ equipavel: 'eq-1', estudo: null }, { values: {}, deltas: {} })
  })

  it('toggles the equipped item off without removing the atual ativo label', () => {
    const onSelectionChange = vi.fn()
    const rendered = renderPanel(onSelectionChange)
    root = rendered.root

    const rows = [...document.querySelectorAll('[data-testid="evolution-items-panel-content"] button[aria-pressed]')]
    const active = rows[0]

    if (!(active instanceof HTMLButtonElement)) {
      throw new TypeError('Active item row not found')
    }

    onSelectionChange.mockClear()

    act(() => {
      active.click()
    })

    expect(active.getAttribute('aria-pressed')).toBe('false')
    expect(active.textContent).toContain('atual ativo na build')
    expect(onSelectionChange).toHaveBeenLastCalledWith(
      { equipavel: null, estudo: null },
      { values: { drible: { flat: -4, pct: 0 } }, deltas: { drible: { flat: 0, pct: 0 } } },
    )
  })

  it('moves selection highlight to another item while keeping atual ativo on the equipped one', () => {
    const onSelectionChange = vi.fn()
    const rendered = renderPanel(onSelectionChange)
    root = rendered.root

    const rows = [...document.querySelectorAll('[data-testid="evolution-items-panel-content"] button[aria-pressed]')]
    const other = rows[1]

    if (!(other instanceof HTMLButtonElement)) {
      throw new TypeError('Replacement item row not found')
    }

    onSelectionChange.mockClear()

    act(() => {
      other.click()
    })

    const nextRows = [
      ...document.querySelectorAll('[data-testid="evolution-items-panel-content"] button[aria-pressed]'),
    ]

    expect(nextRows[0]?.textContent).toContain('Chuteira Veloz')
    expect(nextRows[0]?.textContent).toContain('atual ativo na build')
    expect(nextRows[0]?.getAttribute('aria-pressed')).toBe('false')
    expect(nextRows[1]?.textContent).toContain('Chuteira Pesada')
    expect(nextRows[1]?.textContent).toContain('+3%')
    expect(nextRows[1]?.getAttribute('aria-pressed')).toBe('true')
    expect(onSelectionChange).toHaveBeenLastCalledWith(
      { equipavel: 'eq-2', estudo: null },
      {
        values: { drible: { flat: -4, pct: 0 }, forca: { flat: 0, pct: 3 } },
        deltas: { drible: { flat: 0, pct: 0 }, forca: { flat: 0, pct: 3 } },
      },
    )
  })
})
