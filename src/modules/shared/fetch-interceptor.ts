import { logger } from '~/modules/logger'

export type FetchInterceptRule = {
  id: string
  source: string
  matchUrl: (url: string) => boolean
  resolveType: (url: string) => string | null
  isActive?: () => boolean
}

export function normalizeUrl(input: RequestInfo | URL): string {
  if (input instanceof URL) {
    return input.href
  }

  if (input instanceof Request) {
    return input.url
  }

  return new URL(input, globalThis.location?.origin ?? 'https://footballidentity.org').toString()
}

export async function readResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    return response.clone().json()
  }

  return response.clone().text()
}

export class FetchInterceptor {
  private readonly rules = new Map<string, FetchInterceptRule>()
  private originalFetch: typeof globalThis.fetch | null = null
  private isPatched = false

  registerRule(rule: FetchInterceptRule): void {
    this.rules.set(rule.id, rule)
  }

  setup(): void {
    if (this.isPatched) return

    this.originalFetch = globalThis.fetch.bind(globalThis)
    this.isPatched = true

    const fetchImpl = this.originalFetch

    globalThis.fetch = async (input, init) => {
      const url = normalizeUrl(input)
      const response = await fetchImpl(input, init)
      const rule = this.findMatchingRule(url)

      if (rule) {
        void this.publishResponse(url, response, rule)
      }

      return response
    }
  }

  cleanup(): void {
    if (!this.originalFetch) return

    globalThis.fetch = this.originalFetch
    this.originalFetch = null
    this.isPatched = false
  }

  reset(): void {
    this.rules.clear()
    this.cleanup()
  }

  private findMatchingRule(url: string): FetchInterceptRule | null {
    for (const rule of this.rules.values()) {
      const isActive = rule.isActive?.() ?? true

      if (isActive && rule.matchUrl(url)) {
        return rule
      }
    }

    return null
  }

  private async publishResponse(url: string, response: Response, rule: FetchInterceptRule): Promise<void> {
    try {
      const body = await readResponseBody(response)
      const type = rule.resolveType(url)

      logger.info('response body: ', { body: JSON.stringify(body) })

      globalThis.postMessage({
        source: rule.source,
        type,
        payload: {
          pageUrl: globalThis.location?.href ?? '',
          status: response.status,
          body,
        },
      })
    } catch (error) {
      logger.error(`error reading response: ${url}`, {
        error: JSON.stringify(error),
      })
    }
  }
}
