import type { RouteChangePayload } from '~/entrypoints/content'
import type { FetchInterceptRuleRunner } from '~/modules/shared/fetch-intercept-rule-runner'
import type { FetchInterceptor } from '~/modules/shared/fetch-interceptor'

import { QUIZ_API_MAP } from '~/modules/quiz/constants'
import { isQuizRoute } from '~/modules/quiz/routes'
import { MESSAGE_SOURCE, MESSAGE_TYPE, SUPABASE } from '~/modules/shared/consts'

type QuizApiMessageType = Exclude<(typeof QUIZ_API_MAP)[keyof typeof QUIZ_API_MAP], null>

const QUIZ_API_MESSAGE_TYPES = [
  ...new Set(Object.values(QUIZ_API_MAP).filter((type): type is QuizApiMessageType => type !== null)),
]

const QUIZ_ALLOWED_REQUESTS = QUIZ_API_MESSAGE_TYPES.map((path) => `${SUPABASE.RPC_PATH_PREFIX}/${path}`)

const QUIZ_RULE_ID = 'quiz'

let activePathname = ''

function parseSupabaseUrl(url: string): URL {
  return new URL(url, SUPABASE.BASE_URL)
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

function getMessageTypeFromUrl(url: string): (typeof MESSAGE_TYPE)[keyof typeof MESSAGE_TYPE] | null {
  const parsedUrl = parseSupabaseUrl(url)

  return (
    QUIZ_API_MESSAGE_TYPES.find((type) => parsedUrl.pathname.startsWith(`${SUPABASE.RPC_PATH_PREFIX}/${type}`)) ?? null
  )
}

export class QuizFetchInterceptRuleRunner implements FetchInterceptRuleRunner {
  register(interceptor: FetchInterceptor): void {
    interceptor.registerRule({
      id: QUIZ_RULE_ID,
      source: MESSAGE_SOURCE.QUIZ_CONTENT,
      matchUrl: isQuizRequest,
      resolveType: getMessageTypeFromUrl,
      isActive: () => isQuizRoute(activePathname),
    })
  }
}

export function handleRouteChange(payload: RouteChangePayload): void {
  activePathname = payload.pathname
}

export function resetQuizFetchBridgeState(): void {
  activePathname = ''
}
