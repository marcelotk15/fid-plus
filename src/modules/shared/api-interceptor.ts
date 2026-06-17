import type { RouteChangePayload } from '~/entrypoints/content'

import { logger } from '~/modules/logger'
import { isQuizRoute } from '~/modules/quiz/routes'
import { MESSAGE_SOURCE, MESSAGE_TYPE, SUPABASE } from '~/modules/shared/consts'

const QUIZ_ALLOWED_REQUESTS = [
  MESSAGE_TYPE.GET_SQUAD_HUMANS_FOR_MINIGAME,
  MESSAGE_TYPE.GET_STADIUMS_FOR_MINIGAME,
  MESSAGE_TYPE.GET_LEAGUE_HUMANS_FOR_MINIGAME,
  MESSAGE_TYPE.GET_TOP_SCORERS_FOR_MINIGAME,
].map((path) => `${SUPABASE.RPC_PATH_PREFIX}/${path}`)

let originalFetch: typeof globalThis.fetch | null = null
let activePathname = ''

function parseSupabaseUrl(url: string): URL {
  return new URL(url, SUPABASE.BASE_URL)
}

function normalizeUrl(input: RequestInfo | URL): string {
  if (input instanceof URL) {
    return input.href
  }

  if (input instanceof Request) {
    return input.url
  }

  return new URL(input, globalThis.location?.origin ?? 'https://footballidentity.org').toString()
}

function isAllowedRoute(pathname = activePathname): boolean {
  return isQuizRoute(pathname)
}

export function isQuizRequest(url: string): boolean {
  const parsedUrl = parseSupabaseUrl(url)

  return (
    parsedUrl.origin === SUPABASE.BASE_URL && QUIZ_ALLOWED_REQUESTS.some((path) => parsedUrl.pathname.startsWith(path))
  )
}

export function isTargetRequest(url: string, pathname = activePathname): boolean {
  if (isQuizRoute(pathname)) {
    return isQuizRequest(url)
  }

  return false
}

async function readResponseBody(response: Response) {
  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    return response.clone().json()
  }

  return response.clone().text()
}

function getMessageTypeFromUrl(url: string): (typeof MESSAGE_TYPE)[keyof typeof MESSAGE_TYPE] | null {
  const parsedUrl = parseSupabaseUrl(url)

  return (
    [
      MESSAGE_TYPE.GET_SQUAD_HUMANS_FOR_MINIGAME,
      MESSAGE_TYPE.GET_STADIUMS_FOR_MINIGAME,
      MESSAGE_TYPE.GET_LEAGUE_HUMANS_FOR_MINIGAME,
      MESSAGE_TYPE.GET_TOP_SCORERS_FOR_MINIGAME,
    ].find((type) => parsedUrl.pathname.startsWith(`${SUPABASE.RPC_PATH_PREFIX}/${type}`)) ?? null
  )
}

async function publishResponse(url: string, response: Response) {
  try {
    const body = await readResponseBody(response)

    logger.info('response body: ', { body: JSON.stringify(body) })

    const messageType = getMessageTypeFromUrl(url)

    globalThis.postMessage({
      source: MESSAGE_SOURCE.QUIZ_CONTENT,
      type: messageType,
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

export function setupFetchInterceptor() {
  originalFetch ??= globalThis.fetch.bind(globalThis)

  const fetchImpl = originalFetch

  globalThis.fetch = async (input, init) => {
    const url = normalizeUrl(input)
    const shouldIntercept = isTargetRequest(url)

    const response = await fetchImpl(input, init)

    if (shouldIntercept) {
      void publishResponse(url, response)
    }

    return response
  }
}

export function cleanupFetchInterceptor() {
  if (!originalFetch) return

  globalThis.fetch = originalFetch
  originalFetch = null
}

export function handleRouteChange(payload: RouteChangePayload) {
  activePathname = payload.pathname

  if (isAllowedRoute(payload.pathname)) {
    setupFetchInterceptor()
    return
  }

  cleanupFetchInterceptor()
}

export function resetApiInterceptorState(): void {
  activePathname = ''
  cleanupFetchInterceptor()
}
