import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'

import {
  applyAttributeSimulation,
  ATTRS_GRID_SELECTOR,
  ensureHostBeforeGrid,
  EVOLUTION_ITEMS_HOST_ID,
  restoreAttributeSimulation,
} from './attribute-dom'
import { EvolutionItemsPanel } from './evolution-items-panel'
import { readEvolutionItemsPanelState } from './evolution-items-panel.storage'
import { ensureEvolutionItemsPanelStyles } from './evolution-items-panel.styles'
import { EMPTY_SELECTION, type SelectedItems } from './item-selection'

const EVOLUTION_PATHNAME = '/player/evolution'

type MountedUi = {
  root: ReactDOM.Root
  host: HTMLElement
}

let mounted: MountedUi | null = null
let selected: SelectedItems = { ...EMPTY_SELECTION }
let bonuses: Record<string, number> = {}
let documentObserver: MutationObserver | null = null
let parentObserver: MutationObserver | null = null
let gridObserver: MutationObserver | null = null
let applying = false
let syncRaf = 0

function isEvolutionPage(): boolean {
  return location.pathname === EVOLUTION_PATHNAME
}

function getGrid(): Element | null {
  return document.querySelector(ATTRS_GRID_SELECTOR)
}

function applyCurrentSimulation(grid: ParentNode): void {
  if (applying) return

  applying = true
  applyAttributeSimulation(grid, bonuses)
  applying = false
}

function handleSelectionChange(nextSelected: SelectedItems, nextBonuses: Record<string, number>): void {
  selected = nextSelected
  bonuses = nextBonuses

  const grid = getGrid()
  if (grid) applyCurrentSimulation(grid)
}

function observeGrid(grid: Element): void {
  gridObserver?.disconnect()
  gridObserver = new MutationObserver(() => {
    if (applying) return
    applyCurrentSimulation(grid)
  })
  gridObserver.observe(grid, { childList: true, subtree: true, characterData: true })
}

function observeParent(parent: Element, grid: Element, host: HTMLElement): void {
  parentObserver?.disconnect()
  parentObserver = new MutationObserver(() => {
    if (!host.isConnected && grid.isConnected) {
      ensureHostBeforeGrid(grid, host)
    }
  })
  parentObserver.observe(parent, { childList: true })
}

function syncHostOpenState(host: HTMLElement): void {
  const open = readEvolutionItemsPanelState()?.open ?? true
  host.setAttribute('data-fid-plus-panel-open', open ? 'true' : 'false')
}

function renderPanel(host: HTMLElement): ReactDOM.Root {
  const root = ReactDOM.createRoot(host)

  root.render(
    <StrictMode>
      <EvolutionItemsPanel initialSelected={selected} onSelectionChange={handleSelectionChange} />
    </StrictMode>,
  )

  return root
}

function mount(grid: Element): void {
  if (mounted?.host.isConnected && mounted.host.nextElementSibling === grid) {
    observeGrid(grid)
    if (grid.parentElement) observeParent(grid.parentElement, grid, mounted.host)
    applyCurrentSimulation(grid)
    return
  }

  const host = ensureHostBeforeGrid(grid, mounted?.host ?? document.getElementById(EVOLUTION_ITEMS_HOST_ID))
  syncHostOpenState(host)

  if (mounted && mounted.host === host) {
    if (grid.parentElement) observeParent(grid.parentElement, grid, host)
    observeGrid(grid)
    applyCurrentSimulation(grid)
    return
  }

  unmountUi()

  const root = renderPanel(host)
  mounted = { root, host }

  if (grid.parentElement) observeParent(grid.parentElement, grid, host)
  observeGrid(grid)
  applyCurrentSimulation(grid)
}

function unmountUi(): void {
  gridObserver?.disconnect()
  gridObserver = null
  parentObserver?.disconnect()
  parentObserver = null

  const grid = getGrid()
  if (grid) restoreAttributeSimulation(grid)

  if (!mounted) return

  mounted.root.unmount()
  mounted.host.remove()
  mounted = null
}

function syncMount(): void {
  const grid = getGrid()

  if (isEvolutionPage() && grid) {
    mount(grid)
    return
  }

  unmountUi()
}

function scheduleSync(): void {
  if (syncRaf) return

  syncRaf = requestAnimationFrame(() => {
    syncRaf = 0
    syncMount()
  })
}

export function initEvolutionItems(): void {
  if (documentObserver) return

  ensureEvolutionItemsPanelStyles()
  documentObserver = new MutationObserver(scheduleSync)
  documentObserver.observe(document.documentElement, { childList: true, subtree: true })
  syncMount()
}

export function destroyEvolutionItems(): void {
  if (syncRaf) {
    cancelAnimationFrame(syncRaf)
    syncRaf = 0
  }

  documentObserver?.disconnect()
  documentObserver = null
  unmountUi()
  selected = { ...EMPTY_SELECTION }
  bonuses = {}
}
