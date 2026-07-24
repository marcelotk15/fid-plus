import { DAILY_PACK_SIDEBAR_MENU, DAILY_PACK_SIDEBAR_MENU_CSS } from './daily-pack.constants'

let highlightActive = false
let observer: MutationObserver | null = null

function ensureHighlightStyles(): void {
  if (document.getElementById(DAILY_PACK_SIDEBAR_MENU.STYLE_ID)) return

  const style = document.createElement('style')
  style.id = DAILY_PACK_SIDEBAR_MENU.STYLE_ID
  style.textContent = DAILY_PACK_SIDEBAR_MENU_CSS
  document.head.append(style)
}

function getParticleOffset(index: number): { left: string; delay: string; duration: string } {
  const left = ((index * 17 + 11) % 90) + 5
  const delay = ((index * 0.37) % 2.4).toFixed(2)
  const duration = (2.2 + (index % 5) * 0.35).toFixed(2)

  return {
    left: `${left}%`,
    delay: `${delay}s`,
    duration: `${duration}s`,
  }
}

function removeGlitter(link: HTMLElement): void {
  link.querySelector(`.${DAILY_PACK_SIDEBAR_MENU.GLITTER_CLASS}`)?.remove()
}

function ensureGlitter(link: HTMLElement): void {
  if (link.querySelector(`.${DAILY_PACK_SIDEBAR_MENU.GLITTER_CLASS}`)) return

  const container = document.createElement('div')
  container.className = DAILY_PACK_SIDEBAR_MENU.GLITTER_CLASS
  container.setAttribute('aria-hidden', 'true')

  for (let index = 0; index < DAILY_PACK_SIDEBAR_MENU.GLITTER_PARTICLE_COUNT; index += 1) {
    const particle = document.createElement('span')
    const { left, delay, duration } = getParticleOffset(index)

    particle.style.left = left
    particle.style.animationDelay = delay
    particle.style.animationDuration = duration
    container.append(particle)
  }

  link.append(container)
}

function clearAllHighlights(): void {
  for (const link of document.querySelectorAll(`[${DAILY_PACK_SIDEBAR_MENU.HIGHLIGHT_ATTR}]`)) {
    if (!(link instanceof HTMLElement)) continue

    removeGlitter(link)
    link.removeAttribute(DAILY_PACK_SIDEBAR_MENU.HIGHLIGHT_ATTR)
  }

  for (const container of document.querySelectorAll(`.${DAILY_PACK_SIDEBAR_MENU.GLITTER_CLASS}`)) {
    container.remove()
  }
}

function applyHighlight(link: HTMLElement, active: boolean): void {
  if (active) {
    ensureHighlightStyles()
    link.setAttribute(DAILY_PACK_SIDEBAR_MENU.HIGHLIGHT_ATTR, 'true')
    ensureGlitter(link)
    return
  }

  removeGlitter(link)
  link.removeAttribute(DAILY_PACK_SIDEBAR_MENU.HIGHLIGHT_ATTR)
}

function findDailyPackMenuLink(): HTMLElement | null {
  const link = document.querySelector(DAILY_PACK_SIDEBAR_MENU.SELECTOR)

  if (!(link instanceof HTMLElement)) return null

  return link
}

function syncHighlight(): void {
  if (!highlightActive) {
    clearAllHighlights()
    return
  }

  const link = findDailyPackMenuLink()

  if (!link) return

  applyHighlight(link, true)
}

function ensureObserver(): void {
  if (observer) return

  observer = new MutationObserver(() => {
    syncHighlight()
  })

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  })
}

export function setDailyPackMenuAvailable(available: boolean): void {
  highlightActive = available

  if (available) {
    ensureObserver()
  } else {
    observer?.disconnect()
    observer = null
    clearAllHighlights()
    return
  }

  syncHighlight()
}

export function resetDailyPackMenuHighlight(): void {
  highlightActive = false
  observer?.disconnect()
  observer = null
  clearAllHighlights()
}
