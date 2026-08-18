import { afterEach, describe, expect, it } from 'vitest'

import type { PlayerProfileSnapshot } from './player-profiles-api'

import { destroyStoreBalance, initStoreBalance, updateStoreProfile } from './store-balance-controller'
import {
  formatStoreBalance,
  STORE_BALANCE_HOST_ID,
  STORE_BUY_HINT_LABEL_ATTR,
  STORE_BUY_HINT_WRAPPER_ATTR,
  STORE_VALUE_ATTR,
} from './store-balance-dom'

function createStoreHeading(): HTMLElement {
  const wrap = document.createElement('div')
  wrap.className = 'flex items-center gap-2 flex-wrap'

  const heading = document.createElement('h1')
  heading.textContent = 'Loja'
  wrap.append(heading)
  document.body.append(wrap)

  return heading
}

function createStoreCard(name: string, price: string): HTMLElement {
  const card = document.createElement('div')
  card.className = 'rounded-lg border bg-card text-card-foreground shadow-sm flex flex-col'
  card.innerHTML = `
    <div class="p-4 flex flex-col gap-2 flex-1">
      <h3 class="font-display font-semibold leading-tight">${name}</h3>
      <div class="flex items-center justify-between pt-2 border-t mt-auto">
        <span class="font-bold text-amber-600">${price}</span>
        <div class="flex items-center gap-1">
          <button type="button">20 💎</button>
          <button type="button">Comprar</button>
        </div>
      </div>
    </div>
  `
  return card
}

function createStoreGrid(cards: Array<{ name: string; price: string }>): HTMLElement {
  const grid = document.createElement('div')
  grid.className = 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3'

  for (const card of cards) {
    grid.append(createStoreCard(card.name, card.price))
  }

  document.body.append(grid)
  return grid
}

function snapshot(overrides: Partial<PlayerProfileSnapshot> = {}): PlayerProfileSnapshot {
  return { money: 1000, fullName: 'Marcelo', primaryPosition: 'ME', ...overrides }
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    const raf = globalThis.requestAnimationFrame ?? ((cb: FrameRequestCallback) => setTimeout(() => cb(0), 0))
    raf(() => resolve())
  })
}

describe('store-balance-controller', () => {
  afterEach(() => {
    destroyStoreBalance()
    document.body.innerHTML = ''
  })

  it('does not render a badge before the first valid balance', () => {
    createStoreHeading()
    initStoreBalance()

    expect(document.getElementById(STORE_BALANCE_HOST_ID)).toBeNull()
  })

  it('renders the badge after receiving a balance', () => {
    const heading = createStoreHeading()
    initStoreBalance()
    updateStoreProfile(snapshot({ money: 1000 }))

    const host = document.getElementById(STORE_BALANCE_HOST_ID)

    expect(host?.querySelector(`[${STORE_VALUE_ATTR}]`)?.textContent).toBe(formatStoreBalance(1000))
    expect(host?.querySelector('[data-fid-plus-store-profile]')).toBeNull()
    expect(heading.nextElementSibling).toBe(host)
  })

  it('removes the badge when the heading disappears', async () => {
    const heading = createStoreHeading()
    initStoreBalance()
    updateStoreProfile(snapshot({ money: 1000 }))

    heading.parentElement?.remove()
    await nextFrame()

    expect(document.getElementById(STORE_BALANCE_HOST_ID)).toBeNull()
  })

  it('reinserts the badge when the heading is remounted', async () => {
    const heading = createStoreHeading()
    initStoreBalance()
    updateStoreProfile(snapshot({ money: 1000 }))

    heading.parentElement?.remove()
    await nextFrame()
    expect(document.getElementById(STORE_BALANCE_HOST_ID)).toBeNull()

    const nextHeading = createStoreHeading()
    await nextFrame()

    const host = document.getElementById(STORE_BALANCE_HOST_ID)

    expect(host?.querySelector(`[${STORE_VALUE_ATTR}]`)?.textContent).toBe(formatStoreBalance(1000))
    expect(host?.querySelector('[data-fid-plus-store-profile]')).toBeNull()
    expect(nextHeading.nextElementSibling).toBe(host)
  })

  it('injects purchase hints on store cards when the profile is received', () => {
    createStoreHeading()
    createStoreGrid([
      { name: 'Barrinha de Cereal', price: '🪙 1.000' },
      { name: 'Kit de Hidratação', price: '🪙 1.500' },
    ])
    initStoreBalance()
    updateStoreProfile(snapshot({ fullName: 'Marcelo' }))

    expect(document.querySelectorAll(`[${STORE_BUY_HINT_WRAPPER_ATTR}]`)).toHaveLength(2)
    expect(document.querySelectorAll(`[${STORE_BUY_HINT_LABEL_ATTR}]`)[0]?.textContent).toBe(
      'Comprando com perfil Marcelo',
    )
  })

  it('does not inject purchase hints when the profile name is missing', () => {
    createStoreHeading()
    createStoreGrid([{ name: 'Barrinha de Cereal', price: '🪙 1.000' }])
    initStoreBalance()
    updateStoreProfile(snapshot({ fullName: null }))

    expect(document.querySelector(`[${STORE_BUY_HINT_WRAPPER_ATTR}]`)).toBeNull()
  })

  it('reapplies purchase hints when the store grid is remounted', async () => {
    createStoreHeading()
    const grid = createStoreGrid([{ name: 'Barrinha de Cereal', price: '🪙 1.000' }])
    initStoreBalance()
    updateStoreProfile(snapshot({ fullName: 'Marcelo' }))

    grid.remove()
    await nextFrame()
    expect(document.querySelector(`[${STORE_BUY_HINT_WRAPPER_ATTR}]`)).toBeNull()

    createStoreGrid([{ name: 'Kit de Hidratação', price: '🪙 1.500' }])
    await nextFrame()

    expect(document.querySelectorAll(`[${STORE_BUY_HINT_WRAPPER_ATTR}]`)).toHaveLength(1)
    expect(document.querySelector(`[${STORE_BUY_HINT_LABEL_ATTR}]`)?.textContent).toBe('Comprando com perfil Marcelo')
  })

  it('restores purchase footers when destroyed', () => {
    createStoreHeading()
    createStoreGrid([{ name: 'Barrinha de Cereal', price: '🪙 1.000' }])
    initStoreBalance()
    updateStoreProfile(snapshot({ fullName: 'Marcelo' }))

    destroyStoreBalance()

    const footer = document.querySelector('.flex.items-center.justify-between.pt-2.border-t.mt-auto')

    expect(document.querySelector(`[${STORE_BUY_HINT_WRAPPER_ATTR}]`)).toBeNull()
    expect(footer?.lastElementChild?.className).toBe('flex items-center gap-1')
  })
})
