import type { FetchInterceptRuleRunner } from '~/modules/shared/fetch-intercept-rule-runner'
import type { FetchInterceptor } from '~/modules/shared/fetch-interceptor'
import type { StorageLike } from '~/modules/shared/storage.types'

import {
  ACTIVE_SPONSORSHIPS,
  CONTRACTS,
  MESSAGE_SOURCE,
  PROFILES,
  SUPABASE,
  WEEKLY_EARNINGS_MESSAGE_TYPE,
  WEEKLY_OBJECTIVES,
} from '~/modules/shared/consts'
import { readSupabaseSession } from '~/modules/shared/supabase-auth'

import type { WeeklyEarningsIngestPayload } from './weekly-earnings-cache'

import { parseContractsBody } from './contracts-api'
import { ingestWeeklyEarningsFromPage } from './weekly-earnings-cache'

function parseSupabaseUrl(url: string): URL {
  return new URL(url, SUPABASE.BASE_URL)
}

function isSupabaseRequest(url: string): boolean {
  try {
    return parseSupabaseUrl(url).origin === new URL(SUPABASE.BASE_URL).origin
  } catch {
    return false
  }
}

export function extractProfileUserId(url: string): string | null {
  if (!isSupabaseRequest(url)) return null

  const parsed = parseSupabaseUrl(url)

  if (!parsed.pathname.includes(PROFILES.TABLE_PATH)) return null

  const id = parsed.searchParams.get('id')

  if (!id?.startsWith('eq.')) return null

  return id.slice(3)
}

export function extractPlayerProfileId(url: string): string | null {
  if (!isSupabaseRequest(url)) return null

  const parsed = parseSupabaseUrl(url)
  const playerProfileId = parsed.searchParams.get('player_profile_id')

  if (!playerProfileId?.startsWith('eq.')) return null

  return playerProfileId.slice(3)
}

export function isWeeklyEarningsProfileRequest(url: string): boolean {
  return extractProfileUserId(url) !== null
}

export function isWeeklyEarningsContractRequest(url: string): boolean {
  if (!isSupabaseRequest(url)) return false

  const parsed = parseSupabaseUrl(url)

  return parsed.pathname.includes(CONTRACTS.TABLE_PATH) && extractPlayerProfileId(url) !== null
}

export function isWeeklyEarningsSponsorshipsRequest(url: string): boolean {
  if (!isSupabaseRequest(url)) return false

  return parseSupabaseUrl(url).pathname.includes(ACTIVE_SPONSORSHIPS.TABLE_PATH)
}

export function isWeeklyEarningsObjectivesRequest(url: string): boolean {
  if (!isSupabaseRequest(url)) return false

  return parseSupabaseUrl(url).pathname.includes(`${SUPABASE.RPC_PATH_PREFIX}/${WEEKLY_OBJECTIVES.RPC}`)
}

type BridgePayload = {
  pageUrl: string
  status: number
  body: unknown
}

type BridgeMessage = {
  source: string
  type: string
  payload: BridgePayload
}

function readUserIdFromStorage(storage: StorageLike): string | null {
  const session = readSupabaseSession(storage)

  return session?.user.id ?? null
}

function parseProfileUserIdFromBody(body: unknown): string | null {
  if (!Array.isArray(body) || body.length === 0) return null

  const row = body[0]

  if (typeof row !== 'object' || row === null) return null
  if (typeof (row as Record<string, unknown>).id !== 'string') return null

  return (row as Record<string, unknown>).id as string
}

function parsePlayerProfileIdFromSponsorshipsBody(body: unknown): string | null {
  if (!Array.isArray(body) || body.length === 0) return null

  const row = body[0]

  if (typeof row !== 'object' || row === null) return null

  const playerProfileId = (row as Record<string, unknown>).player_profile_id

  return typeof playerProfileId === 'string' ? playerProfileId : null
}

export function buildWeeklyEarningsIngestPayload(
  message: BridgeMessage,
  storage: StorageLike,
): WeeklyEarningsIngestPayload | null {
  if (message.source !== MESSAGE_SOURCE.WEEKLY_EARNINGS) return null
  if (message.payload.status !== 200) return null

  const { type, payload } = message

  switch (type) {
    case WEEKLY_EARNINGS_MESSAGE_TYPE.PROFILE: {
      const userId = parseProfileUserIdFromBody(payload.body)

      if (!userId) return null

      return { type: 'profile', userId, body: payload.body }
    }
    case WEEKLY_EARNINGS_MESSAGE_TYPE.CONTRACT: {
      const userId = readUserIdFromStorage(storage)
      const contract = parseContractsBody(payload.body)

      if (!userId || !contract) return null

      return { type: 'contract', userId, playerProfileId: contract.playerProfileId, body: payload.body }
    }
    case WEEKLY_EARNINGS_MESSAGE_TYPE.SPONSORSHIPS: {
      const userId = readUserIdFromStorage(storage)
      const playerProfileId = parsePlayerProfileIdFromSponsorshipsBody(payload.body)

      if (!userId || !playerProfileId) return null

      return { type: 'sponsorships', userId, playerProfileId, body: payload.body }
    }
    case WEEKLY_EARNINGS_MESSAGE_TYPE.OBJECTIVES: {
      const userId = readUserIdFromStorage(storage)

      if (!userId) return null

      return { type: 'objectives', userId, body: payload.body }
    }
    default:
      return null
  }
}

export function parseWeeklyEarningsBridgeMessage(
  event: MessageEvent,
  storage: StorageLike = globalThis.localStorage,
): WeeklyEarningsIngestPayload | null {
  if (event.source !== globalThis.window) return null
  if (typeof event.data !== 'object' || event.data === null) return null

  return buildWeeklyEarningsIngestPayload(event.data as BridgeMessage, storage)
}

export function handleWeeklyEarningsBridgeMessage(
  event: MessageEvent,
  storage: StorageLike = globalThis.localStorage,
): void {
  const payload = parseWeeklyEarningsBridgeMessage(event, storage)

  if (!payload) return

  ingestWeeklyEarningsFromPage(storage, payload)
}

export class WeeklyEarningsFetchInterceptRuleRunner implements FetchInterceptRuleRunner {
  register(interceptor: FetchInterceptor): void {
    interceptor.registerRule({
      id: 'weekly-earnings-profile',
      source: MESSAGE_SOURCE.WEEKLY_EARNINGS,
      matchUrl: isWeeklyEarningsProfileRequest,
      resolveType: () => WEEKLY_EARNINGS_MESSAGE_TYPE.PROFILE,
    })

    interceptor.registerRule({
      id: 'weekly-earnings-contract',
      source: MESSAGE_SOURCE.WEEKLY_EARNINGS,
      matchUrl: isWeeklyEarningsContractRequest,
      resolveType: () => WEEKLY_EARNINGS_MESSAGE_TYPE.CONTRACT,
    })

    interceptor.registerRule({
      id: 'weekly-earnings-sponsorships',
      source: MESSAGE_SOURCE.WEEKLY_EARNINGS,
      matchUrl: isWeeklyEarningsSponsorshipsRequest,
      resolveType: () => WEEKLY_EARNINGS_MESSAGE_TYPE.SPONSORSHIPS,
    })

    interceptor.registerRule({
      id: 'weekly-earnings-objectives',
      source: MESSAGE_SOURCE.WEEKLY_EARNINGS,
      matchUrl: isWeeklyEarningsObjectivesRequest,
      resolveType: () => WEEKLY_EARNINGS_MESSAGE_TYPE.OBJECTIVES,
    })
  }
}
