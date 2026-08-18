import { afterEach, describe, expect, it } from 'vitest'

import type { PlayerProfileSnapshot } from './player-profiles-api'

import {
  ensureBalanceBelowHeading,
  findStoreHeading,
  findStorePurchaseFooters,
  formatBuyingWithProfile,
  formatStoreBalance,
  removePurchaseHints,
  removeStoreBalanceHost,
  syncPurchaseHints,
  STORE_BALANCE_HOST_CLASS,
  STORE_BALANCE_HOST_ID,
  STORE_BALANCE_VALUE_CLASS,
  STORE_BUY_HINT_LABEL_ATTR,
  STORE_BUY_HINT_LABEL_CLASS,
  STORE_BUY_HINT_NAME_ATTR,
  STORE_BUY_HINT_NAME_CLASS,
  STORE_BUY_HINT_PREFIX_ATTR,
  STORE_BUY_HINT_PREFIX_CLASS,
  STORE_BUY_HINT_WRAPPER_ATTR,
  STORE_BUY_HINT_WRAPPER_CLASS,
  STORE_PURCHASE_FOOTER_ATTR,
  STORE_VALUE_ATTR,
} from './store-balance-dom'

function createStoreHeading(text = 'Loja'): HTMLElement {
  const wrap = document.createElement('div')
  wrap.className = 'flex items-center gap-2 flex-wrap'

  const heading = document.createElement('h1')
  heading.className = 'text-2xl font-display font-bold'
  heading.textContent = text
  wrap.append(heading)
  document.body.append(wrap)

  return heading
}

function snapshot(overrides: Partial<PlayerProfileSnapshot> = {}): PlayerProfileSnapshot {
  return {
    money: 1000,
    fullName: 'Marcelo',
    primaryPosition: 'ME',
    ...overrides,
  }
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

function createStoreGrid(cards: Array<{ name: string; price: string }> = []): HTMLElement {
  const grid = document.createElement('div')
  grid.className = 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3'

  for (const card of cards) {
    grid.append(createStoreCard(card.name, card.price))
  }

  document.body.append(grid)
  return grid
}

describe('formatStoreBalance', () => {
  it('formats with coin prefix and pt-BR grouping', () => {
    expect(formatStoreBalance(1000)).toBe(`🪙 ${Number(1000).toLocaleString('pt-BR')}`)
    expect(formatStoreBalance(1500)).toBe(`🪙 ${Number(1500).toLocaleString('pt-BR')}`)
  })
})

describe('formatBuyingWithProfile', () => {
  it('formats the purchase hint with the profile name', () => {
    expect(formatBuyingWithProfile('Marcelo')).toBe('Comprando com perfil Marcelo')
  })
})

describe('findStorePurchaseFooters', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('finds button groups next to the coin price in store cards', () => {
    createStoreGrid([
      { name: 'Barrinha de Cereal', price: '🪙 1.000' },
      { name: 'Kit de Hidratação', price: '🪙 1.500' },
    ])

    expect(findStorePurchaseFooters()).toHaveLength(2)
  })

  it('ignores unrelated Comprar buttons without a coin price sibling', () => {
    const footer = document.createElement('div')
    footer.innerHTML = `
      <span class="font-bold">🪙 1.000</span>
      <div class="flex items-center gap-1">
        <button type="button">Comprar</button>
      </div>
    `
    document.body.append(footer)

    expect(findStorePurchaseFooters()).toHaveLength(0)
  })
})

describe('findStoreHeading', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('finds the Loja heading case-insensitively', () => {
    createStoreHeading('LOJA')

    expect(findStoreHeading()?.textContent).toBe('LOJA')
  })

  it('returns null when the heading is missing', () => {
    expect(findStoreHeading()).toBeNull()
  })
})

describe('ensureBalanceBelowHeading', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('inserts the balance below the heading', () => {
    const heading = createStoreHeading()

    const host = ensureBalanceBelowHeading(heading, snapshot({ money: 1000 }))
    const value = host.querySelector(`[${STORE_VALUE_ATTR}]`)

    expect(host.id).toBe(STORE_BALANCE_HOST_ID)
    expect(host.className).toBe(STORE_BALANCE_HOST_CLASS)
    expect(host.previousElementSibling).toBe(heading)
    expect(heading.nextElementSibling).toBe(host)
    expect(host.querySelector('[data-fid-plus-store-profile]')).toBeNull()
    expect(value?.className).toBe(STORE_BALANCE_VALUE_CLASS)
    expect(value?.textContent).toBe(formatStoreBalance(1000))
  })

  it('renders only the balance when name and position are missing', () => {
    const heading = createStoreHeading()

    const host = ensureBalanceBelowHeading(heading, snapshot({ fullName: null, primaryPosition: null }))

    expect(host.querySelector('[data-fid-plus-store-profile]')).toBeNull()
    expect(host.querySelector(`[${STORE_VALUE_ATTR}]`)?.textContent).toBe(formatStoreBalance(1000))
  })

  it('reinserts the same host when the heading is remounted', () => {
    const heading = createStoreHeading()
    const host = ensureBalanceBelowHeading(heading, snapshot({ money: 1000 }))

    heading.parentElement?.remove()
    const nextHeading = createStoreHeading()

    const reused = ensureBalanceBelowHeading(
      nextHeading,
      snapshot({ money: 2500, fullName: 'Ana', primaryPosition: 'ATA' }),
      host,
    )

    expect(reused).toBe(host)
    expect(reused.previousElementSibling).toBe(nextHeading)
    expect(reused.querySelector('[data-fid-plus-store-profile]')).toBeNull()
    expect(reused.querySelector(`[${STORE_VALUE_ATTR}]`)?.textContent).toBe(formatStoreBalance(2500))
    expect(document.getElementById(STORE_BALANCE_HOST_ID)).toBe(host)
  })
})

describe('removeStoreBalanceHost', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('removes the host from the document', () => {
    const heading = createStoreHeading()
    const host = ensureBalanceBelowHeading(heading, snapshot())

    removeStoreBalanceHost(host)

    expect(document.getElementById(STORE_BALANCE_HOST_ID)).toBeNull()
  })
})

describe('syncPurchaseHints', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('wraps each purchase footer and injects the profile hint below the buttons', () => {
    createStoreGrid([
      { name: 'Barrinha de Cereal', price: '🪙 1.000' },
      { name: 'Kit de Hidratação', price: '🪙 1.500' },
    ])

    syncPurchaseHints(snapshot({ fullName: 'Marcelo' }))

    const wrappers = document.querySelectorAll(`[${STORE_BUY_HINT_WRAPPER_ATTR}]`)

    expect(wrappers).toHaveLength(2)

    for (const wrapper of wrappers) {
      expect(wrapper.className).toBe(STORE_BUY_HINT_WRAPPER_CLASS)

      const label = wrapper.querySelector(`[${STORE_BUY_HINT_LABEL_ATTR}]`)
      const buttonsGroup = wrapper.querySelector('.flex.items-center.gap-1')

      expect(label?.className).toBe(STORE_BUY_HINT_LABEL_CLASS)
      expect(label?.textContent).toBe('Comprando com perfil Marcelo')
      expect(label?.querySelector(`[${STORE_BUY_HINT_PREFIX_ATTR}]`)?.className).toBe(STORE_BUY_HINT_PREFIX_CLASS)
      expect(label?.querySelector(`[${STORE_BUY_HINT_PREFIX_ATTR}]`)?.textContent).toBe('Comprando com perfil ')
      expect(label?.querySelector(`[${STORE_BUY_HINT_NAME_ATTR}]`)?.className).toBe(STORE_BUY_HINT_NAME_CLASS)
      expect(label?.querySelector(`[${STORE_BUY_HINT_NAME_ATTR}]`)?.textContent).toBe('Marcelo')
      expect(buttonsGroup?.nextElementSibling).toBe(label)
      expect(label?.previousElementSibling).toBe(buttonsGroup)
      expect(wrapper.parentElement?.querySelector(':scope > .font-bold.text-amber-600')).not.toBeNull()
      expect(wrapper.parentElement?.classList.contains('items-start')).toBe(true)
      expect(wrapper.parentElement?.hasAttribute(STORE_PURCHASE_FOOTER_ATTR)).toBe(true)
    }
  })

  it('updates an existing wrapper without duplicating it', () => {
    createStoreGrid([{ name: 'Barrinha de Cereal', price: '🪙 1.000' }])

    syncPurchaseHints(snapshot({ fullName: 'Marcelo' }))
    syncPurchaseHints(snapshot({ fullName: 'Ana' }))

    expect(document.querySelectorAll(`[${STORE_BUY_HINT_WRAPPER_ATTR}]`)).toHaveLength(1)
    expect(document.querySelector(`[${STORE_BUY_HINT_LABEL_ATTR}]`)?.textContent).toBe('Comprando com perfil Ana')
  })

  it('removes hints when the profile name is missing', () => {
    createStoreGrid([{ name: 'Barrinha de Cereal', price: '🪙 1.000' }])

    syncPurchaseHints(snapshot({ fullName: 'Marcelo' }))
    syncPurchaseHints(snapshot({ fullName: null }))

    expect(document.querySelector(`[${STORE_BUY_HINT_WRAPPER_ATTR}]`)).toBeNull()
    expect(document.querySelector('.flex.items-center.justify-between.pt-2.border-t.mt-auto')).not.toBeNull()
    expect(document.querySelector('[data-fid-plus-store-purchase-footer]')).toBeNull()
  })
})

describe('removePurchaseHints', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('unwraps purchase footers and restores the original button layout', () => {
    createStoreGrid([{ name: 'Barrinha de Cereal', price: '🪙 1.000' }])

    syncPurchaseHints(snapshot({ fullName: 'Marcelo' }))
    removePurchaseHints()

    const footer = document.querySelector('.flex.items-center.justify-between.pt-2.border-t.mt-auto')

    expect(document.querySelector(`[${STORE_BUY_HINT_WRAPPER_ATTR}]`)).toBeNull()
    expect(footer?.classList.contains('items-center')).toBe(true)
    expect(footer?.classList.contains('items-start')).toBe(false)
    expect(footer?.hasAttribute(STORE_PURCHASE_FOOTER_ATTR)).toBe(false)
    expect(footer?.children).toHaveLength(2)
    expect(footer?.lastElementChild?.className).toBe('flex items-center gap-1')
  })
})
