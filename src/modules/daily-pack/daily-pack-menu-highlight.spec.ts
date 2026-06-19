import { afterEach, describe, expect, it, vi } from 'vitest'

import { resetDailyPackMenuHighlight, setDailyPackMenuAvailable } from './daily-pack-menu-highlight'
import { DAILY_PACK_SIDEBAR_MENU } from './daily-pack.constants'

function createDailyPackMenuLink(): HTMLAnchorElement {
  const menu = document.createElement('ul')
  menu.dataset.sidebar = 'menu'

  const link = document.createElement('a')
  link.dataset.sidebar = 'menu-button'
  link.href = DAILY_PACK_SIDEBAR_MENU.HREF

  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  const label = document.createElement('span')
  label.textContent = 'Pacotes'

  link.append(icon, label)
  menu.append(link)
  document.body.append(menu)

  return link
}

describe('daily-pack-menu-highlight', () => {
  afterEach(() => {
    resetDailyPackMenuHighlight()
    document.body.replaceChildren()
    document.getElementById(DAILY_PACK_SIDEBAR_MENU.STYLE_ID)?.remove()
  })

  it('applies highlight attribute and stylesheet when daily pack is available', () => {
    const link = createDailyPackMenuLink()

    setDailyPackMenuAvailable(true)

    expect(link.getAttribute(DAILY_PACK_SIDEBAR_MENU.HIGHLIGHT_ATTR)).toBe('true')
    expect(link.querySelector(`.${DAILY_PACK_SIDEBAR_MENU.GLITTER_CLASS}`)).not.toBeNull()
    expect(link.querySelectorAll(`.${DAILY_PACK_SIDEBAR_MENU.GLITTER_CLASS} span`)).toHaveLength(
      DAILY_PACK_SIDEBAR_MENU.GLITTER_PARTICLE_COUNT,
    )
    expect(document.getElementById(DAILY_PACK_SIDEBAR_MENU.STYLE_ID)?.textContent).toContain(
      '@keyframes fid-plus-glitter-fall',
    )
  })

  it('does not highlight collection menu link', () => {
    const menu = document.createElement('ul')
    menu.dataset.sidebar = 'menu'

    const collectionLink = document.createElement('a')
    collectionLink.dataset.sidebar = 'menu-button'
    collectionLink.href = '/player/collection'

    menu.append(collectionLink)
    document.body.append(menu)

    setDailyPackMenuAvailable(true)

    expect(collectionLink.hasAttribute(DAILY_PACK_SIDEBAR_MENU.HIGHLIGHT_ATTR)).toBe(false)
  })

  it('removes highlight when daily pack is not available', () => {
    const link = createDailyPackMenuLink()

    setDailyPackMenuAvailable(true)
    setDailyPackMenuAvailable(false)

    expect(link.hasAttribute(DAILY_PACK_SIDEBAR_MENU.HIGHLIGHT_ATTR)).toBe(false)
    expect(link.querySelector(`.${DAILY_PACK_SIDEBAR_MENU.GLITTER_CLASS}`)).toBeNull()
  })

  it('reapplies highlight when menu link is re-rendered', async () => {
    setDailyPackMenuAvailable(true)

    const link = createDailyPackMenuLink()

    await vi.waitFor(() => {
      expect(link.getAttribute(DAILY_PACK_SIDEBAR_MENU.HIGHLIGHT_ATTR)).toBe('true')
    })
  })
})
