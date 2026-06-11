import type { RouteChangePayload } from '~/entrypoints/content'

import { EVENTS } from '~/constants'
import { logger } from '~/modules/logger'
import { MESSAGE_SOURCE, MESSAGE_TYPE } from '~/modules/shared/consts'

const TARGET_API_BASE_URL = 'https://vbpgsdotwsfsiutydpad.supabase.co'
const QUIZ_PATH_PREFIX = '/player/quiz'
const RPC_PATH_PREFIX = '/rest/v1/rpc'

const ALLOWED_REQUESTS = Object.values(MESSAGE_TYPE).map((path) => `${RPC_PATH_PREFIX}/${path}`)

let originalFetch: typeof globalThis.fetch | null = null

function normalizeUrl(input: RequestInfo | URL): string {
  if (input instanceof URL) {
    return input.href
  }

  if (input instanceof Request) {
    return input.url
  }

  return new URL(input, location.origin).toString()
}

function isAllowedPage(pathname = location.pathname) {
  return pathname.startsWith(QUIZ_PATH_PREFIX)
}

function isTargetRequest(url: string): boolean {
  const parsedUrl = new URL(url, location.origin)

  return (
    parsedUrl.origin === TARGET_API_BASE_URL && ALLOWED_REQUESTS.some((path) => parsedUrl.pathname.startsWith(path))
  )
}

async function readResponseBody(response: Response) {
  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    return response.clone().json()
  }

  return response.clone().text()
}

function getMessageTypeFromUrl(url: string): (typeof MESSAGE_TYPE)[keyof typeof MESSAGE_TYPE] | null {
  const parsedUrl = new URL(url, location.origin)

  return Object.values(MESSAGE_TYPE).find((type) => parsedUrl.pathname.startsWith(`${RPC_PATH_PREFIX}/${type}`)) ?? null
}

async function publishQuizResponse(url: string, response: Response) {
  try {
    const body = await readResponseBody(response)

    logger.info('response body: ', { body: JSON.stringify(body) })

    const messageType = getMessageTypeFromUrl(url)

    globalThis.postMessage({
      source: MESSAGE_SOURCE.QUIZ_CONTENT,
      type: messageType,
      payload: {
        pageUrl: location.href,
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

function setupFetchInterceptor() {
  originalFetch ??= globalThis.fetch.bind(globalThis)

  const fetchImpl = originalFetch

  globalThis.fetch = async (input, init) => {
    const url = normalizeUrl(input)
    const shouldIntercept = isTargetRequest(url)

    const response = await fetchImpl(input, init)

    if (shouldIntercept) {
      void publishQuizResponse(url, response)
    }

    return response
  }
}

function cleanupFetchInterceptor() {
  if (!originalFetch) return

  globalThis.fetch = originalFetch
  originalFetch = null
}

function handleRouteChange(payload: RouteChangePayload) {
  if (isAllowedPage(payload.pathname)) {
    setupFetchInterceptor()
    return
  }

  cleanupFetchInterceptor()
}

export default defineContentScript({
  matches: ['*://*.footballidentity.org/*'],
  runAt: 'document_start',
  world: 'MAIN',

  main() {
    globalThis.addEventListener(EVENTS.ROUTE_CHANGED, (event) => {
      handleRouteChange((event as CustomEvent<RouteChangePayload>).detail)
    })

    handleRouteChange({
      href: location.href,
      pathname: location.pathname,
      search: location.search,
    })
  },
})
