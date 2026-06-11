import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { clickElement, findElementsByText, waitForElement } from './dom'

describe('clickElement', () => {
  it('clicks an HTMLElement', () => {
    const button = document.createElement('button')
    const clickSpy = vi.spyOn(button, 'click')

    clickElement(button)

    expect(clickSpy).toHaveBeenCalledOnce()
  })

  it('throws when the element is not clickable', () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')

    expect(() => clickElement(svg)).toThrow('Element is not clickable')
  })
})

describe('findElementsByText', () => {
  it('filters elements by normalized text', () => {
    const root = document.createElement('div')
    root.innerHTML = `
      <button class="option">Rabico</button>
      <button class="option">  FLUMINENSE  </button>
      <button class="option">Brasil</button>
    `

    const matches = findElementsByText(root, '.option', 'fluminense')

    expect(matches).toHaveLength(1)
    expect(matches[0]?.textContent?.trim()).toBe('FLUMINENSE')
  })
})

describe('waitForElement', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('resolves immediately when the element already exists', async () => {
    const existing = document.createElement('div')
    existing.id = 'target'
    document.body.append(existing)

    const element = await waitForElement('#target')

    expect(element).toBe(existing)
  })

  it('resolves when the element is inserted later', async () => {
    const promise = waitForElement('#delayed')

    const element = document.createElement('div')
    element.id = 'delayed'
    document.body.append(element)

    await expect(promise).resolves.toBe(element)
  })

  it('rejects with timeout when the element never appears', async () => {
    vi.useFakeTimers()

    const promise = waitForElement('#missing', { timeout: 50 })

    vi.advanceTimersByTime(50)

    await expect(promise).rejects.toThrow('Element not found: #missing')
  })

  it('rejects with AbortError when the signal is already aborted', async () => {
    const controller = new AbortController()
    controller.abort()

    await expect(waitForElement('#target', { signal: controller.signal })).rejects.toMatchObject({
      name: 'AbortError',
    })
  })

  it('rejects with AbortError when the signal is aborted while waiting', async () => {
    const controller = new AbortController()

    const promise = waitForElement('#target', { signal: controller.signal })

    controller.abort()

    await expect(promise).rejects.toMatchObject({ name: 'AbortError' })
  })
})
