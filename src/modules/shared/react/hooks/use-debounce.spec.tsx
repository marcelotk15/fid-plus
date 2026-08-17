import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useDebounce } from './use-debounce'

function renderHook<T>(useHook: () => T): { result: { current: T }; root: Root; rerender: () => void } {
  const container = document.createElement('div')
  document.body.append(container)

  const result = { current: undefined as T }
  const root = createRoot(container)
  let latestUseHook = useHook

  function Test() {
    result.current = latestUseHook()
    return null
  }

  const render = () => {
    act(() => {
      root.render(createElement(Test))
    })
  }

  render()

  return {
    result,
    root,
    rerender: () => {
      latestUseHook = useHook
      render()
    },
  }
}

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    document.body.replaceChildren()
  })

  it('returns the initial value immediately', () => {
    const hook = renderHook(() => useDebounce('hello', 300))

    expect(hook.result.current).toBe('hello')

    act(() => {
      hook.root.unmount()
    })
  })

  it('updates only after the delay', () => {
    let value = 'hello'
    const hook = renderHook(() => useDebounce(value, 300))

    value = 'world'
    hook.rerender()
    expect(hook.result.current).toBe('hello')

    act(() => {
      vi.advanceTimersByTime(299)
    })
    expect(hook.result.current).toBe('hello')

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(hook.result.current).toBe('world')

    act(() => {
      hook.root.unmount()
    })
  })

  it('resets the delay when the value changes again', () => {
    let value = 'a'
    const hook = renderHook(() => useDebounce(value, 300))

    value = 'ab'
    hook.rerender()

    act(() => {
      vi.advanceTimersByTime(200)
    })

    value = 'abc'
    hook.rerender()

    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(hook.result.current).toBe('a')

    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(hook.result.current).toBe('abc')

    act(() => {
      hook.root.unmount()
    })
  })
})
