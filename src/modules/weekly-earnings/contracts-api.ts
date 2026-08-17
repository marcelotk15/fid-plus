import type { FetchLike } from '~/modules/shared/fetch.types'

import { CONTRACTS_ENDPOINT } from '~/modules/shared/consts'
import { buildSupabaseHeaders } from '~/modules/shared/supabase-headers'

import type { FetchContractResult, PlayerContract } from './contracts.types'

const SALARY_FIELDS = ['weekly_salary', 'salary', 'wage', 'monthly_salary', 'base_salary'] as const

function parseSalaryValue(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null
  return value
}

function extractSalary(row: Record<string, unknown>): number | null {
  if (typeof row.salary_cents === 'number') {
    return parseSalaryValue(row.salary_cents / 100)
  }

  for (const field of SALARY_FIELDS) {
    const parsed = parseSalaryValue(row[field])
    if (parsed !== null) return parsed
  }

  return null
}

export function parseContractRow(value: unknown): PlayerContract | null {
  if (typeof value !== 'object' || value === null) return null

  const row = value as Record<string, unknown>
  const salary = extractSalary(row)

  if (
    typeof row.id !== 'string' ||
    typeof row.player_profile_id !== 'string' ||
    typeof row.created_at !== 'string' ||
    salary === null
  ) {
    return null
  }

  return {
    id: row.id,
    playerProfileId: row.player_profile_id,
    salary,
    createdAt: row.created_at,
  }
}

export function parseContractsBody(value: unknown): PlayerContract | null {
  if (!Array.isArray(value) || value.length === 0) return null
  return parseContractRow(value[0])
}

export function buildLatestContractUrl(playerProfileId: string): string {
  const url = new URL(CONTRACTS_ENDPOINT)

  url.searchParams.set('select', '*')
  url.searchParams.set('player_profile_id', `eq.${playerProfileId}`)
  url.searchParams.set('order', 'created_at.desc')
  url.searchParams.set('limit', '1')

  return url.toString()
}

export async function fetchLatestContractWithMeta(
  accessToken: string,
  playerProfileId: string,
  fetchImpl: FetchLike = globalThis.fetch.bind(globalThis),
): Promise<FetchContractResult> {
  try {
    const response = await fetchImpl(buildLatestContractUrl(playerProfileId), {
      method: 'GET',
      headers: buildSupabaseHeaders(accessToken),
    })

    if (!response.ok) {
      return { data: null, error: 'http', status: response.status }
    }

    const body: unknown = await response.json()

    if (Array.isArray(body) && body.length === 0) {
      return { data: null, error: 'not_found', status: response.status }
    }

    const data = parseContractsBody(body)

    if (!data) {
      return { data: null, error: 'parse', status: response.status }
    }

    return { data, status: response.status }
  } catch {
    return { data: null, error: 'network' }
  }
}

export async function fetchLatestContract(
  accessToken: string,
  playerProfileId: string,
  fetchImpl: FetchLike = globalThis.fetch.bind(globalThis),
): Promise<PlayerContract | null> {
  const result = await fetchLatestContractWithMeta(accessToken, playerProfileId, fetchImpl)
  return result.data
}
