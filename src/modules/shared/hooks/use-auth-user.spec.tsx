import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { SUPABASE } from '~/modules/shared/consts'
import { useAuthUser } from '~/modules/shared/hooks/use-auth-user'
import { useStorageItem } from '~/modules/shared/hooks/use-storage-item'
import { installStorageChangeNotifier } from '~/modules/shared/storage-sync'

function renderHook<T>(useHook: () => T): { result: { current: T }; root: Root; rerender: () => void } {
  const container = document.createElement('div')
  document.body.append(container)

  const result = { current: undefined as T }
  const root = createRoot(container)

  const render = () => {
    function Test() {
      result.current = useHook()
      return null
    }

    act(() => {
      root.render(createElement(Test))
    })
  }

  render()

  return {
    result,
    root,
    rerender: render,
  }
}

describe('useStorageItem', () => {
  let hook: ReturnType<typeof renderHook<string | null>>

  beforeEach(() => {
    localStorage.clear()
    installStorageChangeNotifier()
    hook = renderHook(() => useStorageItem('test-key'))
  })

  afterEach(() => {
    act(() => {
      hook.root.unmount()
    })
  })

  it('returns the current localStorage value', () => {
    expect(hook.result.current).toBeNull()

    act(() => {
      localStorage.setItem('test-key', 'hello')
    })

    expect(hook.result.current).toBe('hello')
  })

  it('updates when the key is removed', () => {
    localStorage.setItem('test-key', 'hello')

    hook.rerender()
    expect(hook.result.current).toBe('hello')

    act(() => {
      localStorage.removeItem('test-key')
    })

    expect(hook.result.current).toBeNull()
  })
})

describe('useAuthUser', () => {
  let hook: ReturnType<typeof renderHook<ReturnType<typeof useAuthUser>>>

  beforeEach(() => {
    localStorage.clear()
    installStorageChangeNotifier()
    hook = renderHook(() => useAuthUser())
  })

  afterEach(() => {
    act(() => {
      hook.root.unmount()
    })
  })

  it('returns logged-out state when auth is missing', () => {
    expect(hook.result.current).toEqual({
      user: null,
      accessToken: null,
      session: null,
      isLoggedIn: false,
    })
  })

  it('returns user data when auth is present', () => {
    act(() => {
      localStorage.setItem(
        SUPABASE.AUTH_STORAGE_KEY,
        JSON.stringify({
          access_token: 'valid-token',
          token_type: 'bearer',
          user: {
            id: 'user-1',
            email: 'player@example.com',
          },
        }),
      )
    })

    expect(hook.result.current).toEqual({
      user: {
        id: 'user-1',
        email: 'player@example.com',
      },
      accessToken: 'valid-token',
      session: {
        accessToken: 'valid-token',
        user: {
          id: 'user-1',
          email: 'player@example.com',
        },
        expiresAt: undefined,
      },
      isLoggedIn: true,
    })
  })

  it('clears user when auth is removed', () => {
    localStorage.setItem(
      SUPABASE.AUTH_STORAGE_KEY,
      JSON.stringify({
        access_token: 'valid-token',
        token_type: 'bearer',
        user: { id: 'user-1' },
      }),
    )

    hook.rerender()
    expect(hook.result.current.isLoggedIn).toBe(true)

    act(() => {
      localStorage.removeItem(SUPABASE.AUTH_STORAGE_KEY)
    })

    expect(hook.result.current.isLoggedIn).toBe(false)
  })
})
