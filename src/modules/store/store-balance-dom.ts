import { findElementsByText } from '~/modules/shared/dom'

import type { PlayerProfileSnapshot } from './player-profiles-api'

export const STORE_BALANCE_HOST_ID = 'fid-plus-store-balance'
export const STORE_BALANCE_HOST_CLASS = 'w-full basis-full'
export const STORE_BALANCE_VALUE_CLASS = 'font-bold text-amber-600 tabular-nums'
export const STORE_VALUE_ATTR = 'data-fid-plus-store-value'
export const STORE_BUY_HINT_WRAPPER_ATTR = 'data-fid-plus-store-buy-hint'
export const STORE_BUY_HINT_LABEL_ATTR = 'data-fid-plus-store-buy-label'
export const STORE_BUY_HINT_PREFIX_ATTR = 'data-fid-plus-store-buy-prefix'
export const STORE_BUY_HINT_NAME_ATTR = 'data-fid-plus-store-buy-name'
export const STORE_BUY_HINT_WRAPPER_CLASS = 'flex flex-col items-end gap-1'
export const STORE_BUY_HINT_LABEL_CLASS = 'text-xs font-normal text-muted-foreground text-right'
export const STORE_BUY_HINT_PREFIX_CLASS = 'font-normal'
export const STORE_BUY_HINT_NAME_CLASS = 'font-bold'
export const STORE_PRICE_CLASS = 'font-bold text-amber-600'
export const STORE_PURCHASE_FOOTER_ATTR = 'data-fid-plus-store-purchase-footer'

export function formatStoreBalance(value: number): string {
  return `🪙 ${value.toLocaleString('pt-BR')}`
}

export function formatBuyingWithProfile(fullName: string): string {
  return `Comprando com perfil ${fullName}`
}

export function findStoreHeading(root: ParentNode = document): HTMLElement | null {
  return findElementsByText(root, 'h1', 'Loja')[0] ?? null
}

function upsertLine(
  host: HTMLElement,
  attr: string,
  className: string,
  text: string | null,
  position: 'start' | 'end',
): void {
  let line = host.querySelector(`[${attr}]`)

  if (!text) {
    line?.remove()
    return
  }

  if (!(line instanceof HTMLElement)) {
    line = document.createElement('span')
    line.setAttribute(attr, '')
    if (position === 'start') host.prepend(line)
    else host.append(line)
  }

  if (line.className !== className) line.className = className
  if (line.textContent !== text) line.textContent = text
}

export function ensureBalanceBelowHeading(
  heading: HTMLElement,
  profile: PlayerProfileSnapshot,
  existingHost?: HTMLElement | null,
): HTMLElement {
  let host = existingHost ?? document.getElementById(STORE_BALANCE_HOST_ID)

  if (!(host instanceof HTMLElement)) {
    host = document.createElement('div')
    host.id = STORE_BALANCE_HOST_ID
  }

  if (host.className !== STORE_BALANCE_HOST_CLASS) host.className = STORE_BALANCE_HOST_CLASS

  host.querySelector('[data-fid-plus-store-profile]')?.remove()
  upsertLine(host, STORE_VALUE_ATTR, STORE_BALANCE_VALUE_CLASS, formatStoreBalance(profile.money), 'start')

  const parent = heading.parentNode

  if (parent && (host.previousElementSibling !== heading || host.parentNode !== parent)) {
    parent.insertBefore(host, heading.nextSibling)
  }

  return host
}

export function removeStoreBalanceHost(host?: HTMLElement | null): void {
  host?.remove()
  document.getElementById(STORE_BALANCE_HOST_ID)?.remove()
}

function isStorePriceElement(element: Element | null): element is HTMLElement {
  return (
    element instanceof HTMLElement &&
    element.classList.contains('font-bold') &&
    element.classList.contains('text-amber-600')
  )
}

function isStorePurchaseFooter(buttonsGroup: HTMLElement): boolean {
  if (isStorePriceElement(buttonsGroup.previousElementSibling)) return true

  const wrapper = buttonsGroup.parentElement

  return (
    wrapper instanceof HTMLElement &&
    wrapper.hasAttribute(STORE_BUY_HINT_WRAPPER_ATTR) &&
    isStorePriceElement(wrapper.previousElementSibling)
  )
}

export function findStorePurchaseFooters(root: ParentNode = document): HTMLElement[] {
  const groups: HTMLElement[] = []

  for (const button of findElementsByText(root, 'button', 'Comprar')) {
    const buttonsGroup = button.parentElement

    if (!(buttonsGroup instanceof HTMLElement)) continue
    if (!isStorePurchaseFooter(buttonsGroup)) continue

    if (!groups.includes(buttonsGroup)) groups.push(buttonsGroup)
  }

  return groups
}

function ensureBuyHintWrapper(buttonsGroup: HTMLElement): HTMLElement {
  const parent = buttonsGroup.parentElement

  if (parent instanceof HTMLElement && parent.hasAttribute(STORE_BUY_HINT_WRAPPER_ATTR)) {
    return parent
  }

  const wrapper = document.createElement('div')
  wrapper.setAttribute(STORE_BUY_HINT_WRAPPER_ATTR, '')
  wrapper.className = STORE_BUY_HINT_WRAPPER_CLASS
  parent?.insertBefore(wrapper, buttonsGroup)
  wrapper.append(buttonsGroup)

  return wrapper
}

function findButtonsGroupInWrapper(wrapper: HTMLElement): HTMLElement | null {
  for (const child of wrapper.children) {
    if (child instanceof HTMLElement && !child.hasAttribute(STORE_BUY_HINT_LABEL_ATTR)) {
      return child
    }
  }

  return null
}

function isStorePurchaseFooterElement(element: HTMLElement): boolean {
  return (
    element.classList.contains('flex') &&
    element.classList.contains('justify-between') &&
    element.classList.contains('border-t') &&
    element.classList.contains('mt-auto') &&
    isStorePriceElement(element.firstElementChild)
  )
}

function alignPurchaseFooterTop(footer: HTMLElement): void {
  if (!isStorePurchaseFooterElement(footer) || footer.hasAttribute(STORE_PURCHASE_FOOTER_ATTR)) return

  footer.setAttribute(STORE_PURCHASE_FOOTER_ATTR, '')

  if (footer.classList.contains('items-center')) {
    footer.classList.replace('items-center', 'items-start')
  }
}

function restorePurchaseFooterAlignment(footer: HTMLElement): void {
  if (!footer.hasAttribute(STORE_PURCHASE_FOOTER_ATTR)) return

  footer.removeAttribute(STORE_PURCHASE_FOOTER_ATTR)

  if (footer.classList.contains('items-start')) {
    footer.classList.replace('items-start', 'items-center')
  }
}

function upsertBuyHintLabel(wrapper: HTMLElement, fullName: string): void {
  const buttonsGroup = findButtonsGroupInWrapper(wrapper)
  let label = wrapper.querySelector(`[${STORE_BUY_HINT_LABEL_ATTR}]`)

  if (!(label instanceof HTMLElement)) {
    label = document.createElement('span')
    label.setAttribute(STORE_BUY_HINT_LABEL_ATTR, '')
    label.className = STORE_BUY_HINT_LABEL_CLASS
    wrapper.append(label)
  }

  const prefixEl = label.querySelector(`[${STORE_BUY_HINT_PREFIX_ATTR}]`)
  const nameEl = label.querySelector(`[${STORE_BUY_HINT_NAME_ATTR}]`)

  if (
    prefixEl instanceof HTMLElement &&
    nameEl instanceof HTMLElement &&
    prefixEl.textContent === 'Comprando com perfil ' &&
    nameEl.textContent === fullName &&
    label.previousElementSibling === buttonsGroup
  ) {
    return
  }

  label.className = STORE_BUY_HINT_LABEL_CLASS
  label.replaceChildren()

  const prefix = document.createElement('span')
  prefix.setAttribute(STORE_BUY_HINT_PREFIX_ATTR, '')
  prefix.className = STORE_BUY_HINT_PREFIX_CLASS
  prefix.textContent = 'Comprando com perfil '
  label.append(prefix)

  const name = document.createElement('span')
  name.setAttribute(STORE_BUY_HINT_NAME_ATTR, '')
  name.className = STORE_BUY_HINT_NAME_CLASS
  name.textContent = fullName
  label.append(name)

  if (buttonsGroup instanceof HTMLElement && label.previousElementSibling !== buttonsGroup) {
    wrapper.append(label)
  }
}

function unwrapBuyHintWrapper(wrapper: HTMLElement): void {
  const buttonsGroup = findButtonsGroupInWrapper(wrapper)

  if (!(buttonsGroup instanceof HTMLElement) || !wrapper.parentElement) return

  wrapper.parentElement.insertBefore(buttonsGroup, wrapper)
  wrapper.remove()
}

export function syncPurchaseHints(profile: PlayerProfileSnapshot, root: ParentNode = document): void {
  if (!profile.fullName) {
    removePurchaseHints(root)
    return
  }

  for (const buttonsGroup of findStorePurchaseFooters(root)) {
    const wrapper = ensureBuyHintWrapper(buttonsGroup)
    upsertBuyHintLabel(wrapper, profile.fullName)

    const footer = wrapper.parentElement

    if (footer instanceof HTMLElement) alignPurchaseFooterTop(footer)
  }
}

export function removePurchaseHints(root: ParentNode = document): void {
  for (const wrapper of root.querySelectorAll(`[${STORE_BUY_HINT_WRAPPER_ATTR}]`)) {
    if (!(wrapper instanceof HTMLElement)) continue

    const footer = wrapper.parentElement

    if (footer instanceof HTMLElement) restorePurchaseFooterAlignment(footer)

    unwrapBuyHintWrapper(wrapper)
  }
}
