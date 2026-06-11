import { getTextContent, normalizeText } from '~/modules/shared/text'

export type WaitForElementOptions = {
  signal?: AbortSignal
  timeout?: number
  root?: ParentNode
}

const DEFAULT_TIMEOUT_MS = 10_000

export function waitForElement(selector: string, options: WaitForElementOptions = {}): Promise<Element> {
  const { signal, timeout = DEFAULT_TIMEOUT_MS, root = document } = options

  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }

    const existing = root.querySelector(selector)

    if (existing) {
      resolve(existing)
      return
    }

    let timeoutId: ReturnType<typeof setTimeout> | undefined

    const cleanup = () => {
      observer.disconnect()
      signal?.removeEventListener('abort', onAbort)

      if (timeoutId !== undefined) {
        clearTimeout(timeoutId)
      }
    }

    const onAbort = () => {
      cleanup()
      reject(new DOMException('Aborted', 'AbortError'))
    }

    const observer = new MutationObserver(() => {
      const element = root.querySelector(selector)

      if (!element) return

      cleanup()
      resolve(element)
    })

    signal?.addEventListener('abort', onAbort, { once: true })

    observer.observe(root === document ? document.documentElement : (root as Element), {
      childList: true,
      subtree: true,
    })

    timeoutId = setTimeout(() => {
      cleanup()
      reject(new Error(`Element not found: ${selector}`))
    }, timeout)
  })
}

export function clickElement(element: Element): void {
  if (!(element instanceof HTMLElement)) {
    throw new Error('Element is not clickable')
  }

  element.click()
}

export function findElementsByText(root: ParentNode, selector: string, text: string): HTMLElement[] {
  const normalizedText = normalizeText(text)

  return Array.from(root.querySelectorAll(selector)).filter((element): element is HTMLElement => {
    if (!(element instanceof HTMLElement)) return false

    return getTextContent(element).includes(normalizedText)
  })
}
