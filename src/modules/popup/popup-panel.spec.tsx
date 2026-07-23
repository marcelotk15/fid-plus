import { act, createRef } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { installStorageChangeNotifier } from '~/modules/shared/storage-sync'

import { PopupPanel, applyMinimizedPosition, clampPanelPosition, type PopupHandle } from './popup-panel'

vi.mock('/icon.png', () => ({ default: '/icon.png' }))

vi.stubGlobal('browser', {
  runtime: {
    getURL: (path: string) => `chrome-extension://test${path}`,
  },
})

function renderPanel(options?: {
  onClose?: () => void
  onReady?: (handle: PopupHandle) => void
  onPersistState?: (state: unknown) => void
}): {
  container: HTMLDivElement
  root: Root
  handle: PopupHandle | null
} {
  const container = document.createElement('div')
  document.body.append(container)

  const wrapperRef = createRef<HTMLDivElement>()
  wrapperRef.current = container

  let handle: PopupHandle | null = null
  const root = createRoot(container)

  act(() => {
    root.render(
      <PopupPanel
        wrapperRef={wrapperRef}
        onClose={options?.onClose ?? (() => {})}
        onPersistState={options?.onPersistState}
        onReady={(nextHandle) => {
          handle = nextHandle
          options?.onReady?.(nextHandle)
        }}
      />,
    )
  })

  return { container, root, handle }
}

function clickByLabel(label: string): void {
  const control = document.querySelector(`[aria-label="${label}"]`)
  if (!(control instanceof HTMLElement)) {
    throw new TypeError(`Control "${label}" not found`)
  }

  act(() => {
    control.click()
  })
}

describe('popup-panel', () => {
  let roots: Root[] = []

  beforeEach(() => {
    roots = []
    localStorage.clear()
    installStorageChangeNotifier()
  })

  afterEach(() => {
    for (const root of roots) {
      root.unmount()
    }
    document.body.replaceChildren()
  })

  it('renders open panel with placeholder', () => {
    const { root } = renderPanel()
    roots.push(root)

    const panel = document.querySelector('#aside-popup')
    expect(panel?.classList.contains('w-[55px]')).toBe(false)
    expect(panel?.querySelector('.placeholder')?.textContent).toBe('Faça login para continuar')
    expect(panel?.querySelector('.screen')).not.toBeNull()
  })

  it('minimize shows icon and hides body', () => {
    const { root } = renderPanel()
    roots.push(root)

    clickByLabel('Minimizar')

    const panel = document.querySelector('#aside-popup')
    const iconButton = panel?.querySelector('.minimized-icon')
    const icon = panel?.querySelector('.minimized-icon img')

    expect(iconButton?.classList.contains('w-[55px]')).toBe(true)
    expect(iconButton?.classList.contains('h-[55px]')).toBe(true)
    expect(panel?.querySelector('.screen')).toBeNull()
    expect(icon?.getAttribute('width')).toBe('45')
    expect(icon?.getAttribute('height')).toBe('45')
  })

  it('clicking minimized icon reopens the panel', () => {
    const { root } = renderPanel()
    roots.push(root)

    clickByLabel('Minimizar')
    clickByLabel('Abrir menu')

    const panel = document.querySelector('#aside-popup')
    expect(panel?.querySelector('[data-testid="popup-open"]')).not.toBeNull()
  })

  it('close button calls onClose', () => {
    const onClose = vi.fn()
    const { root } = renderPanel({ onClose })
    roots.push(root)

    clickByLabel('Fechar')

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('exposes imperative open handle for minimized state', () => {
    const { root, handle } = renderPanel()
    roots.push(root)

    clickByLabel('Minimizar')
    expect(handle?.isMinimized()).toBe(true)

    act(() => {
      handle?.open()
    })

    const panel = document.querySelector('#aside-popup')
    expect(panel?.querySelector('[data-testid="popup-open"]')).not.toBeNull()
  })

  it('exposes imperative minimize handle for open state', () => {
    const { root, handle } = renderPanel()
    roots.push(root)

    act(() => {
      handle?.minimize()
    })

    expect(handle?.isMinimized()).toBe(true)
    expect(document.querySelector('[data-testid="popup-minimized"]')).not.toBeNull()
  })

  it('persists visible minimized state when minimizing', () => {
    const onPersistState = vi.fn()
    const { root } = renderPanel({ onPersistState })
    roots.push(root)

    clickByLabel('Minimizar')

    expect(onPersistState).toHaveBeenCalledWith(
      expect.objectContaining({
        visible: true,
        mode: 'minimized',
      }),
    )
  })

  it('restores minimized state from initial props after refresh', () => {
    const container = document.createElement('div')
    document.body.append(container)

    const wrapperRef = createRef<HTMLDivElement>()
    wrapperRef.current = container
    container.style.position = 'fixed'
    container.style.top = '120px'
    container.style.right = '16px'

    const root = createRoot(container)

    act(() => {
      root.render(
        <PopupPanel
          wrapperRef={wrapperRef}
          initialMode="minimized"
          initialMinimizedTop={120}
          onClose={() => {}}
          onReady={() => {}}
        />,
      )
    })

    roots.push(root)

    expect(document.querySelector('[data-testid="popup-minimized"]')).not.toBeNull()
    expect(container.style.top).toBe('120px')
  })

  it('header drag does not block close button clicks', () => {
    const onClose = vi.fn()
    const { root } = renderPanel({ onClose })
    roots.push(root)

    const closeButton = document.querySelector('button[aria-label="Fechar"]')
    if (!(closeButton instanceof HTMLButtonElement)) {
      throw new TypeError('Close button not found')
    }

    closeButton.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0 }))
    act(() => {
      closeButton.click()
    })

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('drag handle moves minimized icon vertically only', () => {
    const { root, container } = renderPanel()
    roots.push(root)

    container.style.position = 'fixed'
    container.style.width = '55px'
    container.style.height = '55px'
    container.getBoundingClientRect = () => ({
      width: 55,
      height: 55,
      top: 16,
      left: 0,
      right: 55,
      bottom: 71,
      x: 0,
      y: 16,
      toJSON: () => ({}),
    })

    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 })

    clickByLabel('Minimizar')

    const dragHandle = document.querySelector('.aside-minimized-drag-handle')
    if (!(dragHandle instanceof HTMLDivElement)) {
      throw new TypeError('Drag handle not found')
    }

    act(() => {
      dragHandle.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, clientY: 100 }))
      dragHandle.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientY: 200 }))
      dragHandle.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientY: 200 }))
    })

    expect(container.style.top).toBe('116px')
    expect(container.style.right).toBe('16px')
    expect(container.style.left).toBe('auto')
  })

  it('minimize snaps icon to top-right corner', () => {
    const { root, container } = renderPanel()
    roots.push(root)

    container.style.position = 'fixed'
    container.style.left = '100px'
    container.style.top = '80px'
    container.style.right = 'auto'

    clickByLabel('Minimizar')

    expect(container.style.top).toBe('16px')
    expect(container.style.right).toBe('16px')
    expect(container.style.left).toBe('auto')
  })

  it('reopening restores position before minimize', () => {
    const { root, container } = renderPanel()
    roots.push(root)

    container.style.position = 'fixed'
    container.style.left = '100px'
    container.style.top = '80px'
    container.style.right = 'auto'
    container.getBoundingClientRect = () => ({
      width: 320,
      height: 200,
      top: 80,
      left: 100,
      right: 420,
      bottom: 280,
      x: 100,
      y: 80,
      toJSON: () => ({}),
    })

    clickByLabel('Minimizar')
    clickByLabel('Abrir menu')

    expect(container.style.left).toBe('100px')
    expect(container.style.top).toBe('80px')
    expect(container.style.right).toBe('auto')
  })

  it('applyMinimizedPosition pins wrapper to top-right', () => {
    const wrapper = document.createElement('div')
    wrapper.style.position = 'fixed'
    wrapper.style.left = '200px'
    wrapper.style.top = '150px'

    applyMinimizedPosition(wrapper)

    expect(wrapper.style.top).toBe('16px')
    expect(wrapper.style.right).toBe('16px')
    expect(wrapper.style.left).toBe('auto')
  })

  it('clampPanelPosition keeps the panel inside the viewport', () => {
    const wrapper = document.createElement('div')
    wrapper.style.width = '320px'
    wrapper.style.height = '200px'
    document.body.append(wrapper)

    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 400 })
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 300 })

    wrapper.getBoundingClientRect = () => ({
      width: 320,
      height: 200,
      top: 0,
      left: 0,
      right: 320,
      bottom: 200,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })

    expect(clampPanelPosition(wrapper, -50, -20)).toEqual({ left: 16, top: 16 })
    expect(clampPanelPosition(wrapper, 200, 150)).toEqual({ left: 64, top: 84 })
  })
})
