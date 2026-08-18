import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { installStorageChangeNotifier } from '~/modules/shared/storage-sync'

import type { StoreItem } from './store-items.types'

import { EvolutionItemsPanel } from './evolution-items-panel'
import {
  EVOLUTION_ITEMS_PANEL_STORAGE_KEY,
  parseEvolutionItemsPanelState,
  writeEvolutionItemsPanelState,
} from './evolution-items-panel.storage'

vi.mock('./use-store-items', () => ({
  useStoreItems: () => ({
    items: [
      {
        id: 'eq-1',
        name: 'Chuteira Veloz',
        price: 1200,
        bonuses: [{ attr: 'drible', value: 4 }],
        category: 'v2_equipavel',
        sortOrder: 1,
      } satisfies StoreItem,
    ],
    loading: false,
    error: null,
  }),
}))

function renderPanel(): { container: HTMLDivElement; root: Root } {
  const container = document.createElement('div')
  document.body.append(container)

  const root = createRoot(container)

  act(() => {
    root.render(<EvolutionItemsPanel onSelectionChange={() => {}} />)
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
})
