import { afterEach, describe, expect, it, vi } from 'vitest'

import type { StorageLike } from '~/modules/shared/storage.types'

import { logger } from '~/modules/logger'
import { DAILY_PACK, SUPABASE } from '~/modules/shared/consts'

import type { DailyPackDeps } from './daily-pack.types'

import { createDailyPackSession } from './daily-pack-session'

function createMemoryStorage(initial: Record<string, string> = {}): StorageLike {
  const store = new Map(Object.entries(initial))

  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value)
    },
  }
}

function createAvailableStatus() {
  return { claimed_today: false as const }
}

function createClaimedStatus() {
  return {
    reward_type: 'coins',
    reward_value: { amount: 55 },
    claimed_today: true as const,
    next_reset_at: '2099-01-01T00:00:00.000Z',
  }
}

async function flushPromises() {
  await Promise.resolve()
  await Promise.resolve()
}

describe('daily-pack-session', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('runs only once per session', async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => createAvailableStatus(),
    })
    const notify = vi.fn()
    const highlightMenu = vi.fn()
    const storage = createMemoryStorage({
      [SUPABASE.AUTH_STORAGE_KEY]: JSON.stringify({
        access_token: 'token',
        token_type: 'bearer',
      }),
    })

    const deps: DailyPackDeps = { storage, fetch, notify, highlightMenu }
    const session = createDailyPackSession(deps)

    session.checkOncePerSession()
    session.checkOncePerSession()

    await flushPromises()

    expect(fetch).toHaveBeenCalledTimes(1)
    expect(notify).toHaveBeenCalledTimes(1)
    expect(highlightMenu).toHaveBeenCalledWith(true)
  })

  it('skips API when cache is still valid and already claimed', async () => {
    const fetch = vi.fn()
    const notify = vi.fn()
    const highlightMenu = vi.fn()
    const storage = createMemoryStorage({
      [DAILY_PACK.CACHE_STORAGE_KEY]: JSON.stringify({
        nextResetAt: '2099-01-01T00:00:00.000Z',
        claimedToday: true,
      }),
    })

    createDailyPackSession({ storage, fetch, notify, highlightMenu }).checkOncePerSession()

    await flushPromises()

    expect(fetch).not.toHaveBeenCalled()
    expect(notify).not.toHaveBeenCalled()
    expect(highlightMenu).toHaveBeenCalledWith(false)
  })

  it('highlights menu from cache when daily pack is still available', async () => {
    const fetch = vi.fn()
    const notify = vi.fn()
    const highlightMenu = vi.fn()
    const storage = createMemoryStorage({
      [DAILY_PACK.CACHE_STORAGE_KEY]: JSON.stringify({
        nextResetAt: '2099-01-01T00:00:00.000Z',
        claimedToday: false,
      }),
    })

    createDailyPackSession({ storage, fetch, notify, highlightMenu }).checkOncePerSession()

    await flushPromises()

    expect(fetch).not.toHaveBeenCalled()
    expect(notify).toHaveBeenCalledTimes(1)
    expect(highlightMenu).toHaveBeenCalledWith(true)
  })

  it('notifies when daily pack is available', async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => createAvailableStatus(),
    })
    const notify = vi.fn()
    const highlightMenu = vi.fn()
    const storage = createMemoryStorage({
      [SUPABASE.AUTH_STORAGE_KEY]: JSON.stringify({
        access_token: 'token',
        token_type: 'bearer',
      }),
    })

    createDailyPackSession({ storage, fetch, notify, highlightMenu }).checkOncePerSession()

    await flushPromises()

    expect(notify).toHaveBeenCalledTimes(1)
    expect(highlightMenu).toHaveBeenCalledWith(true)
    expect(storage.getItem(DAILY_PACK.CACHE_STORAGE_KEY)).toBeNull()
  })

  it('saves cache without notifying when already claimed', async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => createClaimedStatus(),
    })
    const notify = vi.fn()
    const highlightMenu = vi.fn()
    const storage = createMemoryStorage({
      [SUPABASE.AUTH_STORAGE_KEY]: JSON.stringify({
        access_token: 'token',
        token_type: 'bearer',
      }),
    })

    createDailyPackSession({ storage, fetch, notify, highlightMenu }).checkOncePerSession()

    await flushPromises()

    expect(notify).not.toHaveBeenCalled()
    expect(highlightMenu).toHaveBeenCalledWith(false)
    expect(storage.getItem(DAILY_PACK.CACHE_STORAGE_KEY)).toBe(
      JSON.stringify({ nextResetAt: '2099-01-01T00:00:00.000Z', claimedToday: true }),
    )
  })

  it('aborts silently when token is missing', async () => {
    const fetch = vi.fn()
    const notify = vi.fn()
    const highlightMenu = vi.fn()
    const infoSpy = vi.spyOn(logger, 'info').mockImplementation(() => {})

    createDailyPackSession({
      storage: createMemoryStorage(),
      fetch,
      notify,
      highlightMenu,
    }).checkOncePerSession()

    await flushPromises()

    expect(fetch).not.toHaveBeenCalled()
    expect(notify).not.toHaveBeenCalled()
    expect(highlightMenu).not.toHaveBeenCalled()
    expect(infoSpy).toHaveBeenCalledWith('daily pack check skipped', { reason: 'no_token' })
  })

  it('ingests daily pack status from page fetch when extension fetch fails', async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({}),
    })
    const notify = vi.fn()
    const highlightMenu = vi.fn()
    const storage = createMemoryStorage({
      [SUPABASE.AUTH_STORAGE_KEY]: JSON.stringify({
        access_token: 'token',
        token_type: 'bearer',
      }),
    })

    const session = createDailyPackSession({ storage, fetch, notify, highlightMenu })

    session.checkOncePerSession()
    await flushPromises()

    expect(notify).not.toHaveBeenCalled()

    session.ingestStatusFromPage({ claimed_today: false })

    expect(notify).toHaveBeenCalledTimes(1)
    expect(highlightMenu).toHaveBeenCalledWith(true)
  })
})
