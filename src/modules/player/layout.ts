import type { WaitForElementOptions } from '~/modules/shared/dom'

const MAIN_CONTAINER_TIMEOUT_MS = 30_000
const INSERT_POINT_TIMEOUT_MS = 30_000
const ROUTE_DOM_SETTLE_MS = 50
const ROUTE_DOM_FALLBACK_MS = 500
const MAX_WIDTH_CLASS = 'max-w-2xl'

function scheduleAfterPaint(callback: () => void): void {
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(() => {
      requestAnimationFrame(callback)
    })
    return
  }

  setTimeout(callback, 0)
}

function stripMaxWidthClass(element: Element): boolean {
  if (!(element instanceof HTMLElement)) return false
  if (!element.classList.contains(MAX_WIDTH_CLASS)) return false

  element.classList.remove(MAX_WIDTH_CLASS)

  return true
}

function collectLayoutTargets(root: ParentNode = document): HTMLElement[] {
  const targets = new Set<HTMLElement>()
  const main = root.querySelector('main') ?? root.querySelector('[role="main"]')

  if (main instanceof HTMLElement) {
    targets.add(main)

    for (const child of main.children) {
      if (child instanceof HTMLElement) {
        targets.add(child)
      }
    }
  }

  const container = findMainContainer(root)

  if (container instanceof HTMLElement) {
    targets.add(container)
  }

  return [...targets]
}

function findFirstDivChild(parent: Element): Element | null {
  for (const child of parent.children) {
    if (child.tagName === 'DIV') {
      return child
    }
  }

  return null
}

function findLayoutContainerInsideMain(main: Element): Element {
  for (const child of main.children) {
    if (!(child instanceof HTMLElement)) continue

    if (child.classList.contains('space-y-6') || child.classList.contains('max-w-2xl')) {
      return child
    }
  }

  return findFirstDivChild(main) ?? main
}

export function findMainContainer(root: ParentNode = document): Element | null {
  const main = root.querySelector('main') ?? root.querySelector('[role="main"]')

  if (main) {
    return findLayoutContainerInsideMain(main)
  }

  return (
    root.querySelector('.space-y-6.max-w-2xl') ?? root.querySelector('.max-w-2xl') ?? root.querySelector('.space-y-6')
  )
}

export function waitForRouteDomUpdate(options: WaitForElementOptions = {}): Promise<void> {
  const { signal, timeout = ROUTE_DOM_FALLBACK_MS, root = document } = options

  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }

    let observer: MutationObserver | undefined
    let settleTimer: ReturnType<typeof setTimeout> | undefined
    let fallbackTimer: ReturnType<typeof setTimeout> | undefined
    let settled = false

    const cleanup = () => {
      observer?.disconnect()
      signal?.removeEventListener('abort', onAbort)

      if (settleTimer !== undefined) {
        clearTimeout(settleTimer)
      }

      if (fallbackTimer !== undefined) {
        clearTimeout(fallbackTimer)
      }
    }

    const resolveOnce = () => {
      if (settled) return

      settled = true
      cleanup()
      resolve()
    }

    const onAbort = () => {
      if (settled) return

      settled = true
      cleanup()
      reject(new DOMException('Aborted', 'AbortError'))
    }

    const scheduleSettle = () => {
      if (settleTimer !== undefined) {
        clearTimeout(settleTimer)
      }

      settleTimer = setTimeout(resolveOnce, ROUTE_DOM_SETTLE_MS)
    }

    const observeTarget = root === document ? document.documentElement : (root as Element)

    observer = new MutationObserver(() => {
      scheduleSettle()
    })

    signal?.addEventListener('abort', onAbort, { once: true })

    observer.observe(observeTarget, {
      childList: true,
      subtree: true,
    })

    scheduleAfterPaint(() => {
      scheduleSettle()
    })

    fallbackTimer = setTimeout(resolveOnce, timeout)
  })
}

export function waitForMainContainer(options: WaitForElementOptions = {}): Promise<Element> {
  const { signal, timeout = MAIN_CONTAINER_TIMEOUT_MS, root = document } = options

  return new Promise((resolve, reject) => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    let observer: MutationObserver | undefined

    const cleanup = () => {
      observer?.disconnect()
      signal?.removeEventListener('abort', onAbort)

      if (timeoutId !== undefined) {
        clearTimeout(timeoutId)
      }
    }

    const tryResolve = () => {
      const container = findMainContainer(root)

      if (!container) return false

      cleanup()
      resolve(container)
      return true
    }

    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }

    if (tryResolve()) return

    const onAbort = () => {
      cleanup()
      reject(new DOMException('Aborted', 'AbortError'))
    }

    observer = new MutationObserver(() => {
      tryResolve()
    })

    signal?.addEventListener('abort', onAbort, { once: true })

    observer.observe(root === document ? document.documentElement : (root as Element), {
      childList: true,
      subtree: true,
    })

    timeoutId = setTimeout(() => {
      cleanup()
      reject(new Error('Main container not found'))
    }, timeout)
  })
}

function getDirectChildDivs(container: Element): HTMLElement[] {
  return Array.from(container.children).filter(
    (child): child is HTMLElement => child instanceof HTMLElement && child.tagName === 'DIV',
  )
}

export function hasInsertPoint(container: Element): boolean {
  return getDirectChildDivs(container).length >= 2
}

export function waitForInsertPoint(container: Element, options: WaitForElementOptions = {}): Promise<void> {
  const { signal, timeout = INSERT_POINT_TIMEOUT_MS } = options

  if (hasInsertPoint(container)) {
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    let observer: MutationObserver | undefined

    const cleanup = () => {
      observer?.disconnect()
      signal?.removeEventListener('abort', onAbort)

      if (timeoutId !== undefined) {
        clearTimeout(timeoutId)
      }
    }

    const tryResolve = () => {
      if (!hasInsertPoint(container)) return false

      cleanup()
      resolve()
      return true
    }

    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }

    if (tryResolve()) return

    const onAbort = () => {
      cleanup()
      reject(new DOMException('Aborted', 'AbortError'))
    }

    observer = new MutationObserver(() => {
      tryResolve()
    })

    signal?.addEventListener('abort', onAbort, { once: true })

    observer.observe(container, {
      childList: true,
    })

    timeoutId = setTimeout(() => {
      cleanup()
      reject(new Error('Insert point not found'))
    }, timeout)
  })
}

export function applyLayoutFix(root: ParentNode = document): boolean {
  let changed = false

  for (const target of collectLayoutTargets(root)) {
    if (stripMaxWidthClass(target)) {
      changed = true
    }
  }

  return changed
}

export function watchLayoutFix(root: ParentNode = document, signal?: AbortSignal): () => void {
  const strip = () => {
    applyLayoutFix(root)
  }

  strip()

  const observeTarget = root === document ? document.documentElement : (root as Element)

  const observer = new MutationObserver(() => {
    strip()
  })

  observer.observe(observeTarget, {
    subtree: true,
    attributes: true,
    attributeFilter: ['class'],
    childList: true,
  })

  const cleanup = () => {
    observer.disconnect()
    signal?.removeEventListener('abort', onAbort)
  }

  const onAbort = () => {
    cleanup()
  }

  signal?.addEventListener('abort', onAbort, { once: true })

  return cleanup
}

export function restoreLayout(root: ParentNode = document): void {
  const container = findMainContainer(root)

  if (!container) return

  container.classList.add(MAX_WIDTH_CLASS)
}

export function insertAttrsGridBetweenFirstDivs(container: Element, grid: HTMLElement): void {
  const childDivs = getDirectChildDivs(container)

  if (childDivs.length >= 2) {
    childDivs[1].before(grid)
    return
  }

  if (childDivs.length === 1) {
    childDivs[0].after(grid)
    return
  }

  container.append(grid)
}
