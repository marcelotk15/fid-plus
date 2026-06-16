import type { AttributeKey, PlayerAttributes } from '~/modules/player/types'

import { ATTRIBUTE_GROUPS, ATTRIBUTE_LABELS } from '~/modules/player/constants'
import { getAttributeBarWidth, getAttributeLabel } from '~/modules/player/labels'

export const ATTRS_GRID_SELECTOR = '[data-tour="attrs-grid"]'
export const ATTRS_GRID_DATA_ATTR = 'data-fid-plus-attrs-grid'

function createAttributeRow(key: AttributeKey, value: number): HTMLElement {
  const { label, barClass, textClass } = getAttributeLabel(value)
  const displayName = ATTRIBUTE_LABELS[key]

  const row = document.createElement('div')
  row.className = 'flex items-center gap-2'

  const content = document.createElement('div')
  content.className = 'flex-1 min-w-0 rounded-md p-1 pl-2'

  const inner = document.createElement('div')
  inner.className = 'flex items-center gap-3'

  const nameWrapper = document.createElement('div')
  nameWrapper.className = 'flex items-center gap-1 w-32 min-w-0'

  const name = document.createElement('span')
  name.className = 'text-xs text-muted-foreground truncate'
  name.textContent = displayName

  nameWrapper.append(name)

  const barTrack = document.createElement('div')
  barTrack.className = 'relative flex-1 h-2 rounded-full bg-muted'

  const barFill = document.createElement('div')
  barFill.className = `h-2 rounded-full transition-all ${barClass}`
  barFill.style.width = getAttributeBarWidth(value)

  barTrack.append(barFill)

  const valueSpan = document.createElement('span')
  valueSpan.className = 'font-display text-sm font-bold text-right shrink-0 w-10'
  valueSpan.textContent = value.toFixed(2)

  const ratingSpan = document.createElement('span')
  ratingSpan.className = `text-[10px] font-display font-semibold w-20 text-right truncate ${textClass}`
  ratingSpan.textContent = label

  inner.append(nameWrapper, barTrack, valueSpan, ratingSpan)
  content.append(inner)
  row.append(content)

  return row
}

function createGroupCard(title: string, attrs: PlayerAttributes, keys: AttributeKey[]): HTMLElement {
  const card = document.createElement('div')
  card.className = 'stat-card'

  const heading = document.createElement('h2')
  heading.className = 'font-display text-lg font-bold mb-4'
  heading.textContent = title

  const list = document.createElement('div')
  list.className = 'space-y-2'

  for (const key of keys) {
    list.append(createAttributeRow(key, attrs[key]))
  }

  card.append(heading, list)

  return card
}

export function renderAttrsGrid(attrs: PlayerAttributes): HTMLElement {
  const grid = document.createElement('div')
  grid.setAttribute('data-tour', 'attrs-grid')
  grid.setAttribute(ATTRS_GRID_DATA_ATTR, 'true')
  grid.className = 'grid grid-cols-1 md:grid-cols-2 gap-6'

  for (const group of ATTRIBUTE_GROUPS) {
    grid.append(createGroupCard(group.title, attrs, group.keys))
  }

  return grid
}

export function isExtensionAttrsGrid(element: Element): boolean {
  return element.getAttribute(ATTRS_GRID_DATA_ATTR) === 'true'
}
