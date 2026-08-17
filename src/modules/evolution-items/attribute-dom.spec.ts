import { afterEach, describe, expect, it } from 'vitest'

import {
  applyAttributeSimulation,
  ATTRS_GRID_SELECTOR,
  ensureHostBeforeGrid,
  EVOLUTION_ITEMS_HOST_ID,
  findAttributeValueElement,
  ORIGINAL_VALUE_ATTR,
  restoreAttributeSimulation,
  SIM_BAR_ATTR,
  SIM_DELTA_ATTR,
  SIMULATED_VALUE_ATTR,
} from './attribute-dom'

function createGrid(): HTMLElement {
  const grid = document.createElement('div')
  grid.setAttribute('data-tour', 'attrs-grid')
  grid.innerHTML = `
    <div class="flex items-center gap-2">
      <button type="button">
        <div class="flex items-center gap-2 sm:gap-3">
          <div class="flex items-center gap-1">
            <span class="text-xs text-muted-foreground">Agilidade</span>
          </div>
          <div class="relative h-2 flex-1">
            <div data-testid="agilidade-bar" style="width: 71.55%"></div>
          </div>
          <span class="inline-flex w-20 shrink-0 items-baseline justify-end font-display" title="Base: 63.55 · Bônus: +8.00 · Final: 71.55">
            <span class="w-11 text-right text-sm font-bold">71.55</span>
            <span class="ml-1 w-8 text-left text-xs font-bold text-emerald-400 invisible">+8</span>
          </span>
        </div>
      </button>
    </div>
    <div class="flex items-center gap-2">
      <button type="button">
        <div class="flex items-center gap-2 sm:gap-3">
          <div class="flex items-center gap-1">
            <span class="text-xs text-muted-foreground">Força</span>
          </div>
          <div class="relative h-2 flex-1">
            <div data-testid="forca-bar" style="width: 37.20%"></div>
          </div>
          <span class="inline-flex w-20 shrink-0 items-baseline justify-end font-display">
            <span class="w-11 text-right text-sm font-bold">37.20</span>
          </span>
        </div>
      </button>
    </div>
    <div class="flex items-center gap-2">
      <button type="button">
        <div class="flex items-center gap-2 sm:gap-3">
          <div class="flex items-center gap-1">
            <span class="text-xs text-muted-foreground">Velocidade</span>
          </div>
          <div class="relative h-2 flex-1 overflow-hidden">
            <div data-testid="velocidade-bar" style="transform: translateX(-28.45%)"></div>
          </div>
          <span class="inline-flex w-20 shrink-0 items-baseline justify-end font-display">
            <span class="w-11 text-right text-sm font-bold">71.55</span>
            <span class="ml-1 w-8 text-left text-xs font-bold text-emerald-400">+8</span>
          </span>
        </div>
      </button>
    </div>
  `

  document.body.append(grid)
  return grid
}

function getValueText(grid: HTMLElement, attr: string): string | null {
  return findAttributeValueElement(grid, attr)?.textContent ?? null
}

function getDeltaSlot(grid: HTMLElement, attr: string): HTMLElement | null {
  const valueEl = findAttributeValueElement(grid, attr)
  const slot = valueEl?.nextElementSibling
  if (!(slot instanceof HTMLElement) || !slot.hasAttribute(SIM_DELTA_ATTR)) return null
  return slot
}

function getDeltaText(grid: HTMLElement, attr: string): string | null {
  return getDeltaSlot(grid, attr)?.textContent ?? null
}

describe('attribute-dom', () => {
  afterEach(() => {
    document.body.replaceChildren()
  })

  it('applies bonuses on top of the current displayed values', () => {
    const grid = createGrid()

    applyAttributeSimulation(grid, { agilidade: 5, forca: -3 })

    expect(getValueText(grid, 'agilidade')).toBe('76.55')
    expect(getDeltaText(grid, 'agilidade')).toBe('+5')
    expect(getValueText(grid, 'forca')).toBe('34.20')
    expect(getDeltaText(grid, 'forca')).toBe('-3')
  })

  it('reuses the reserved native slot instead of inserting a sibling in the row', () => {
    const grid = createGrid()
    const valueEl = findAttributeValueElement(grid, 'agilidade')
    const parent = valueEl?.parentElement
    const nativeSlot = valueEl?.nextElementSibling

    applyAttributeSimulation(grid, { agilidade: 5 })

    expect(nativeSlot).toBeInstanceOf(HTMLElement)
    expect(nativeSlot).toHaveProperty('textContent', '+5')
    expect((nativeSlot as HTMLElement).hasAttribute(SIM_DELTA_ATTR)).toBe(true)
    expect((nativeSlot as HTMLElement).classList.contains('invisible')).toBe(false)
    expect(parent?.nextElementSibling?.hasAttribute(SIM_DELTA_ATTR) ?? false).toBe(false)
    expect(parent?.querySelectorAll('span.ml-1.w-8')).toHaveLength(1)
  })

  it('adds the item bonus to a visible native slot', () => {
    const grid = createGrid()

    applyAttributeSimulation(grid, { velocidade: 5 })

    expect(getValueText(grid, 'velocidade')).toBe('76.55')
    expect(getDeltaText(grid, 'velocidade')).toBe('+13')
  })

  it('moves width-based progress bars to the simulated value', () => {
    const grid = createGrid()
    const bar = grid.querySelector('[data-testid="agilidade-bar"]') as HTMLElement

    applyAttributeSimulation(grid, { agilidade: 5 })

    expect(bar.style.width).toBe('76.55%')
    expect(bar.hasAttribute(SIM_BAR_ATTR)).toBe(true)
  })

  it('moves transform-based progress bars to the simulated value', () => {
    const grid = createGrid()
    const bar = grid.querySelector('[data-testid="velocidade-bar"]') as HTMLElement

    applyAttributeSimulation(grid, { velocidade: 5 })

    expect(bar.style.transform).toBe('translateX(-23.45%)')
  })

  it('keeps the original value when reapplying the same bonuses', () => {
    const grid = createGrid()

    applyAttributeSimulation(grid, { agilidade: 5 })
    applyAttributeSimulation(grid, { agilidade: 5 })

    expect(getValueText(grid, 'agilidade')).toBe('76.55')
    expect(grid.querySelectorAll(`[${SIM_DELTA_ATTR}]`)).toHaveLength(1)
    expect(grid.querySelector('[data-testid="agilidade-bar"]')?.getAttribute('style')).toContain('76.55%')
  })

  it('restores originals when bonuses are cleared', () => {
    const grid = createGrid()
    const agilidadeSlot = findAttributeValueElement(grid, 'agilidade')?.nextElementSibling as HTMLElement
    const agilidadeBar = grid.querySelector('[data-testid="agilidade-bar"]') as HTMLElement
    const velocidadeBar = grid.querySelector('[data-testid="velocidade-bar"]') as HTMLElement

    applyAttributeSimulation(grid, { agilidade: 5, forca: -3, velocidade: 5 })
    restoreAttributeSimulation(grid)

    expect(getValueText(grid, 'agilidade')).toBe('71.55')
    expect(getValueText(grid, 'forca')).toBe('37.20')
    expect(getValueText(grid, 'velocidade')).toBe('71.55')
    expect(grid.querySelectorAll(`[${SIM_DELTA_ATTR}]`)).toHaveLength(0)
    expect(agilidadeSlot.classList.contains('invisible')).toBe(true)
    expect(agilidadeSlot.textContent).toBe('+8')
    expect(findAttributeValueElement(grid, 'forca')?.nextElementSibling).toBeNull()
    expect(agilidadeBar.style.width).toBe('71.55%')
    expect(velocidadeBar.style.transform).toBe('translateX(-28.45%)')
    expect(grid.querySelectorAll(`[${SIM_BAR_ATTR}]`)).toHaveLength(0)
  })

  it('treats a react reset as a new original and reapplies', () => {
    const grid = createGrid()

    applyAttributeSimulation(grid, { agilidade: 5 })

    const valueEl = findAttributeValueElement(grid, 'agilidade')
    expect(valueEl).not.toBeNull()

    valueEl?.removeAttribute(ORIGINAL_VALUE_ATTR)
    valueEl?.removeAttribute(SIMULATED_VALUE_ATTR)
    if (valueEl) valueEl.textContent = '63.55'

    const slot = valueEl?.nextElementSibling
    if (slot instanceof HTMLElement) {
      slot.removeAttribute(SIM_DELTA_ATTR)
      slot.className = 'ml-1 w-8 text-left text-xs font-bold text-emerald-400 invisible'
      slot.textContent = '+8'
    }

    const bar = grid.querySelector('[data-testid="agilidade-bar"]') as HTMLElement
    bar.removeAttribute(SIM_BAR_ATTR)
    bar.style.width = '63.55%'

    applyAttributeSimulation(grid, { agilidade: 5 })

    expect(getValueText(grid, 'agilidade')).toBe('68.55')
    expect(getDeltaText(grid, 'agilidade')).toBe('+5')
    expect(bar.style.width).toBe('68.55%')
  })

  it('inserts the host immediately before the attributes grid', () => {
    const wrapper = document.createElement('div')
    const grid = document.createElement('div')
    grid.setAttribute('data-tour', 'attrs-grid')
    wrapper.append(grid)
    document.body.append(wrapper)

    const host = ensureHostBeforeGrid(document.querySelector(ATTRS_GRID_SELECTOR) as Element)

    expect(host.id).toBe(EVOLUTION_ITEMS_HOST_ID)
    expect(host.nextElementSibling).toBe(grid)
    expect(ensureHostBeforeGrid(grid, host)).toBe(host)
    expect(wrapper.children).toHaveLength(2)
  })
})
