import { ATTRIBUTE_LABELS } from '~/modules/shared/attribute-labels'
import { getTextContent, normalizeText } from '~/modules/shared/text'

export const ATTRS_GRID_SELECTOR = '[data-tour="attrs-grid"]'
export const EVOLUTION_ITEMS_HOST_ID = 'fid-plus-evolution-items'
export const SIM_DELTA_ATTR = 'data-fid-plus-sim-delta'
export const ORIGINAL_VALUE_ATTR = 'data-fid-plus-original'
export const SIMULATED_VALUE_ATTR = 'data-fid-plus-simulated'
export const ORIGINAL_DELTA_TEXT_ATTR = 'data-fid-plus-original-delta-text'
export const ORIGINAL_DELTA_CLASS_ATTR = 'data-fid-plus-original-delta-class'
export const ORIGINAL_BAR_WIDTH_ATTR = 'data-fid-plus-original-bar-width'
export const ORIGINAL_BAR_TRANSFORM_ATTR = 'data-fid-plus-original-bar-transform'
export const SIM_BAR_ATTR = 'data-fid-plus-sim-bar'

const VALUE_SELECTOR = 'span.w-11.text-right.text-sm.font-bold'
const NATIVE_SLOT_SELECTOR = 'span.ml-1.w-8'
const CREATED_SLOT_ATTR = 'data-fid-plus-sim-delta-created'
const CREATED_SLOT_CLASS = 'ml-1 w-8 text-left text-xs font-bold text-emerald-400 invisible'
const VALUE_MATCH_EPSILON = 0.05

export function formatAttributeValue(value: number): string {
  return value.toFixed(2)
}

export function formatBonusDelta(value: number): string {
  return `${value > 0 ? '+' : ''}${value}`
}

export function parseDisplayedValue(text: string): number | null {
  const normalized = text.trim().replace(',', '.')
  if (normalized.length === 0) return null

  const value = Number(normalized)
  return Number.isFinite(value) ? value : null
}

function findValueSpan(labelEl: HTMLElement): HTMLElement | null {
  let current: HTMLElement | null = labelEl.parentElement

  while (current) {
    const value = current.querySelector(VALUE_SELECTOR)

    if (value instanceof HTMLElement) return value

    current = current.parentElement
  }

  return null
}

export function findAttributeValueElement(grid: ParentNode, attr: string): HTMLElement | null {
  const label = ATTRIBUTE_LABELS[attr]
  if (!label) return null

  const target = normalizeText(label)

  for (const span of grid.querySelectorAll('span')) {
    if (!(span instanceof HTMLElement)) continue
    if (getTextContent(span) !== target) continue

    const valueEl = findValueSpan(span)
    if (valueEl) return valueEl
  }

  return null
}

function parseBonusDelta(text: string): number | null {
  return parseDisplayedValue(text)
}

function valuesMatch(left: number, right: number): boolean {
  return Math.abs(left - right) < VALUE_MATCH_EPSILON
}

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value))
}

function parsePercent(value: string): number | null {
  const match = value.trim().match(/^(-?[\d.]+)%$/)
  if (!match) return null

  const parsed = Number(match[1])
  return Number.isFinite(parsed) ? parsed : null
}

function parseTranslateXPercent(transform: string): number | null {
  const match = transform.match(/translateX\(\s*(-?[\d.]+)%\s*\)/)
  if (!match) return null

  const parsed = Number(match[1])
  return Number.isFinite(parsed) ? parsed : null
}

function findNativeBonusSlot(valueEl: HTMLElement): HTMLElement | null {
  const sibling = valueEl.nextElementSibling
  if (sibling instanceof HTMLElement && sibling.matches(NATIVE_SLOT_SELECTOR)) return sibling

  const parent = valueEl.parentElement
  if (!parent) return null

  const slot = parent.querySelector(NATIVE_SLOT_SELECTOR)
  return slot instanceof HTMLElement ? slot : null
}

function removeOrphanDeltas(valueEl: HTMLElement): boolean {
  const parent = valueEl.parentElement
  if (!parent) return false

  let removed = false
  const nativeSlot = findNativeBonusSlot(valueEl)
  let sibling = parent.nextElementSibling

  while (sibling instanceof HTMLElement && sibling.hasAttribute(SIM_DELTA_ATTR)) {
    const next = sibling.nextElementSibling
    if (sibling !== nativeSlot) {
      sibling.remove()
      removed = true
    }
    sibling = next
  }

  return removed
}

function readNativeBonus(slot: HTMLElement): number {
  const originalClass = slot.getAttribute(ORIGINAL_DELTA_CLASS_ATTR)
  const originalText = slot.getAttribute(ORIGINAL_DELTA_TEXT_ATTR)

  if (originalClass !== null || originalText !== null) {
    if ((originalClass ?? '').split(/\s+/).includes('invisible')) return 0
    return parseBonusDelta(originalText ?? '') ?? 0
  }

  if (slot.classList.contains('invisible')) return 0
  return parseBonusDelta(slot.textContent ?? '') ?? 0
}

function simulatedSlotClassName(total: number, originalClass: string): string {
  const tokens = originalClass.split(/\s+/).filter((token) => {
    return token.length > 0 && token !== 'invisible' && token !== 'text-emerald-400' && token !== 'text-destructive'
  })

  if (total === 0) {
    tokens.push('invisible')
    tokens.push(originalClass.split(/\s+/).includes('text-destructive') ? 'text-destructive' : 'text-emerald-400')
  } else if (total > 0) {
    tokens.push('text-emerald-400')
  } else {
    tokens.push('text-destructive')
  }

  return tokens.join(' ')
}

function rememberSlotOriginal(slot: HTMLElement): void {
  if (!slot.hasAttribute(ORIGINAL_DELTA_TEXT_ATTR)) {
    slot.setAttribute(ORIGINAL_DELTA_TEXT_ATTR, slot.textContent ?? '')
  }

  if (!slot.hasAttribute(ORIGINAL_DELTA_CLASS_ATTR)) {
    slot.setAttribute(ORIGINAL_DELTA_CLASS_ATTR, slot.className)
  }
}

function ensureBonusSlot(valueEl: HTMLElement): HTMLElement | null {
  const parent = valueEl.parentElement
  if (!parent) return null

  const existing = findNativeBonusSlot(valueEl)
  if (existing) return existing

  const slot = document.createElement('span')
  slot.className = CREATED_SLOT_CLASS
  slot.setAttribute(CREATED_SLOT_ATTR, '')
  parent.append(slot)
  return slot
}

function upsertDelta(valueEl: HTMLElement, itemBonus: number): boolean {
  removeOrphanDeltas(valueEl)

  const slot = ensureBonusSlot(valueEl)
  if (!slot) return false

  rememberSlotOriginal(slot)

  const total = readNativeBonus(slot) + itemBonus
  const nextText = total === 0 ? (slot.getAttribute(ORIGINAL_DELTA_TEXT_ATTR) ?? '') : formatBonusDelta(total)
  const nextClass = simulatedSlotClassName(total, slot.getAttribute(ORIGINAL_DELTA_CLASS_ATTR) ?? slot.className)

  let changed = false

  if (!slot.hasAttribute(SIM_DELTA_ATTR)) {
    slot.setAttribute(SIM_DELTA_ATTR, '')
    changed = true
  }

  if (slot.textContent !== nextText) {
    slot.textContent = nextText
    changed = true
  }

  if (slot.className !== nextClass) {
    slot.className = nextClass
    changed = true
  }

  return changed
}

function restoreDelta(valueEl: HTMLElement): boolean {
  const orphanRemoved = removeOrphanDeltas(valueEl)
  const slot = findNativeBonusSlot(valueEl)

  if (!slot) return orphanRemoved

  if (slot.hasAttribute(CREATED_SLOT_ATTR)) {
    slot.remove()
    return true
  }

  const originalText = slot.getAttribute(ORIGINAL_DELTA_TEXT_ATTR)
  const originalClass = slot.getAttribute(ORIGINAL_DELTA_CLASS_ATTR)
  let changed = orphanRemoved || slot.hasAttribute(SIM_DELTA_ATTR)

  if (originalText !== null && slot.textContent !== originalText) {
    slot.textContent = originalText
    changed = true
  }

  if (originalClass !== null && slot.className !== originalClass) {
    slot.className = originalClass
    changed = true
  }

  slot.removeAttribute(SIM_DELTA_ATTR)
  slot.removeAttribute(ORIGINAL_DELTA_TEXT_ATTR)
  slot.removeAttribute(ORIGINAL_DELTA_CLASS_ATTR)

  return changed
}

function findAttributeRow(valueEl: HTMLElement): HTMLElement | null {
  let current: HTMLElement | null = valueEl

  while (current.parentElement) {
    if (current.parentElement.matches(ATTRS_GRID_SELECTOR)) return current
    current = current.parentElement
  }

  return valueEl.parentElement
}

function fillMatchesOriginal(el: HTMLElement, originalValue: number): boolean {
  const width = parsePercent(el.style.width)
  if (width !== null && valuesMatch(width, originalValue)) return true

  const translateX = parseTranslateXPercent(el.style.transform)
  if (translateX === null) return false

  return valuesMatch(translateX, -(100 - originalValue)) || valuesMatch(-translateX, originalValue)
}

function findProgressFill(valueEl: HTMLElement, originalValue: number): HTMLElement | null {
  const row = findAttributeRow(valueEl)
  if (!row) return null

  const marked = row.querySelector(`[${SIM_BAR_ATTR}]`)
  if (marked instanceof HTMLElement) return marked

  for (const el of row.querySelectorAll<HTMLElement>('[style]')) {
    if (el === valueEl || valueEl.contains(el) || el.contains(valueEl)) continue
    if (fillMatchesOriginal(el, originalValue)) return el
  }

  return null
}

function applyBar(valueEl: HTMLElement, original: number, simulated: number): boolean {
  const fill = findProgressFill(valueEl, original)
  if (!fill) return false

  const percent = `${formatAttributeValue(clampPercent(simulated))}%`
  let changed = false

  if (!fill.hasAttribute(SIM_BAR_ATTR)) {
    fill.setAttribute(SIM_BAR_ATTR, '')
    changed = true
  }

  if (fill.style.width) {
    if (!fill.hasAttribute(ORIGINAL_BAR_WIDTH_ATTR)) {
      fill.setAttribute(ORIGINAL_BAR_WIDTH_ATTR, fill.style.width)
      changed = true
    }

    if (fill.style.width !== percent) {
      fill.style.width = percent
      changed = true
    }

    return changed
  }

  if (fill.style.transform) {
    if (!fill.hasAttribute(ORIGINAL_BAR_TRANSFORM_ATTR)) {
      fill.setAttribute(ORIGINAL_BAR_TRANSFORM_ATTR, fill.style.transform)
      changed = true
    }

    const hidden = formatAttributeValue(100 - clampPercent(simulated))
    const nextTransform = `translateX(-${hidden}%)`

    if (fill.style.transform !== nextTransform) {
      fill.style.transform = nextTransform
      changed = true
    }
  }

  return changed
}

function restoreBar(valueEl: HTMLElement, original: number): boolean {
  const fill = findProgressFill(valueEl, original)
  if (!fill) return false

  let changed = false
  const originalWidth = fill.getAttribute(ORIGINAL_BAR_WIDTH_ATTR)
  const originalTransform = fill.getAttribute(ORIGINAL_BAR_TRANSFORM_ATTR)

  if (originalWidth !== null && fill.style.width !== originalWidth) {
    fill.style.width = originalWidth
    changed = true
  }

  if (originalTransform !== null && fill.style.transform !== originalTransform) {
    fill.style.transform = originalTransform
    changed = true
  }

  if (fill.hasAttribute(SIM_BAR_ATTR) || originalWidth !== null || originalTransform !== null) {
    fill.removeAttribute(SIM_BAR_ATTR)
    fill.removeAttribute(ORIGINAL_BAR_WIDTH_ATTR)
    fill.removeAttribute(ORIGINAL_BAR_TRANSFORM_ATTR)
    changed = true
  }

  return changed
}

function readOriginalValue(valueEl: HTMLElement, displayed: number): number {
  const lastSimulated = parseDisplayedValue(valueEl.getAttribute(SIMULATED_VALUE_ATTR) ?? '')
  const storedOriginal = parseDisplayedValue(valueEl.getAttribute(ORIGINAL_VALUE_ATTR) ?? '')

  if (lastSimulated !== null && displayed === lastSimulated && storedOriginal !== null) {
    return storedOriginal
  }

  return displayed
}

export function applyAttributeSimulation(grid: ParentNode, bonuses: Record<string, number>): boolean {
  let changed = false

  for (const attr of Object.keys(ATTRIBUTE_LABELS)) {
    const valueEl = findAttributeValueElement(grid, attr)
    if (!valueEl) continue

    const displayed = parseDisplayedValue(valueEl.textContent ?? '')
    if (displayed === null) continue

    const original = readOriginalValue(valueEl, displayed)
    const bonus = bonuses[attr] ?? 0

    if (bonus === 0) {
      if (valueEl.hasAttribute(ORIGINAL_VALUE_ATTR) || valueEl.hasAttribute(SIMULATED_VALUE_ATTR)) {
        const formatted = formatAttributeValue(original)

        if (valueEl.textContent !== formatted) {
          valueEl.textContent = formatted
          changed = true
        }

        valueEl.removeAttribute(ORIGINAL_VALUE_ATTR)
        valueEl.removeAttribute(SIMULATED_VALUE_ATTR)
      }

      if (restoreDelta(valueEl)) changed = true
      if (restoreBar(valueEl, original)) changed = true
      continue
    }

    const simulated = original + bonus
    const formatted = formatAttributeValue(simulated)

    if (valueEl.textContent !== formatted) {
      valueEl.textContent = formatted
      changed = true
    }

    valueEl.setAttribute(ORIGINAL_VALUE_ATTR, formatAttributeValue(original))
    valueEl.setAttribute(SIMULATED_VALUE_ATTR, formatted)

    if (upsertDelta(valueEl, bonus)) changed = true
    if (applyBar(valueEl, original, simulated)) changed = true
  }

  return changed
}

export function restoreAttributeSimulation(grid: ParentNode): void {
  applyAttributeSimulation(grid, {})
}

export function ensureHostBeforeGrid(grid: Element, existingHost?: HTMLElement | null): HTMLElement {
  let host = existingHost ?? document.getElementById(EVOLUTION_ITEMS_HOST_ID)

  if (!(host instanceof HTMLElement)) {
    host = document.createElement('div')
    host.id = EVOLUTION_ITEMS_HOST_ID
  }

  if (host.nextElementSibling !== grid || host.parentNode !== grid.parentNode) {
    grid.parentNode?.insertBefore(host, grid)
  }

  return host
}
