import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { FetchInterceptor } from './fetch-interceptor'

describe('fetch-interceptor', () => {
  let interceptor: FetchInterceptor

  beforeEach(() => {
    interceptor = new FetchInterceptor()
  })

  afterEach(() => {
    interceptor.reset()
    vi.restoreAllMocks()
  })

  async function flushPromises() {
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
  }

  it('publishes response for matching active rule', async () => {
    const url = 'https://example.com/api/test-endpoint'
    const postMessageSpy = vi.spyOn(globalThis, 'postMessage').mockImplementation(() => {})

    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    interceptor.registerRule({
      id: 'test-rule',
      source: 'test-source',
      matchUrl: (requestUrl) => requestUrl.includes('test-endpoint'),
      resolveType: () => 'test-endpoint',
    })

    interceptor.setup()

    await globalThis.fetch(url, { method: 'POST' })
    await flushPromises()

    expect(postMessageSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'test-source',
        type: 'test-endpoint',
        payload: expect.objectContaining({
          status: 200,
          body: { ok: true },
        }),
      }),
    )
  })

  it('skips inactive rules', async () => {
    const url = 'https://example.com/api'
    const postMessageSpy = vi.spyOn(globalThis, 'postMessage').mockImplementation(() => {})

    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    interceptor.registerRule({
      id: 'inactive',
      source: 'test',
      matchUrl: () => true,
      resolveType: () => 'test',
      isActive: () => false,
    })

    interceptor.setup()

    await globalThis.fetch(url)
    await Promise.resolve()

    expect(postMessageSpy).not.toHaveBeenCalled()
  })

  it('patches fetch only once', () => {
    const fetchMock = vi.fn()
    globalThis.fetch = fetchMock

    interceptor.setup()
    const firstPatch = globalThis.fetch

    interceptor.setup()
    const secondPatch = globalThis.fetch

    expect(firstPatch).toBe(secondPatch)
    expect(firstPatch).not.toBe(fetchMock)

    interceptor.cleanup()
    expect(globalThis.fetch).not.toBe(firstPatch)
  })
})
