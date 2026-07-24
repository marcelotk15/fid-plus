import { describe, expect, it, vi } from 'vitest'

import { CONTRACTS_ENDPOINT } from '~/modules/shared/consts'

import {
  buildLatestContractUrl,
  fetchLatestContract,
  fetchLatestContractWithMeta,
  parseContractRow,
  parseContractsBody,
} from './contracts-api'

const PLAYER_ID = 'c5075e8e-e5cc-455d-a566-7b1cacb2341b'

describe('contracts-api', () => {
  it('builds latest contract url with expected query params', () => {
    const url = new URL(buildLatestContractUrl(PLAYER_ID))

    expect(url.origin + url.pathname).toBe(CONTRACTS_ENDPOINT)
    expect(url.searchParams.get('select')).toBe('*')
    expect(url.searchParams.get('player_profile_id')).toBe(`eq.${PLAYER_ID}`)
    expect(url.searchParams.get('order')).toBe('created_at.desc')
    expect(url.searchParams.get('limit')).toBe('1')
  })

  it('parses contract row with weekly_salary', () => {
    expect(
      parseContractRow({
        id: 'contract-1',
        player_profile_id: PLAYER_ID,
        created_at: '2026-07-01T00:00:00.000Z',
        weekly_salary: 2500,
      }),
    ).toEqual({
      id: 'contract-1',
      playerProfileId: PLAYER_ID,
      salary: 2500,
      createdAt: '2026-07-01T00:00:00.000Z',
    })
  })

  it('parses contract row with salary_cents', () => {
    expect(
      parseContractRow({
        id: 'contract-1',
        player_profile_id: PLAYER_ID,
        created_at: '2026-07-01T00:00:00.000Z',
        salary_cents: 250000,
      }),
    ).toEqual({
      id: 'contract-1',
      playerProfileId: PLAYER_ID,
      salary: 2500,
      createdAt: '2026-07-01T00:00:00.000Z',
    })
  })

  it('parses first contract from postgrest array body', () => {
    const body = [
      {
        id: 'contract-1',
        player_profile_id: PLAYER_ID,
        created_at: '2026-07-01T00:00:00.000Z',
        salary: 2500,
      },
    ]

    expect(parseContractsBody(body)).toEqual({
      id: 'contract-1',
      playerProfileId: PLAYER_ID,
      salary: 2500,
      createdAt: '2026-07-01T00:00:00.000Z',
    })
  })

  it('returns parsed contract from fetch', async () => {
    const body = [
      {
        id: 'contract-1',
        player_profile_id: PLAYER_ID,
        created_at: '2026-07-01T00:00:00.000Z',
        salary: 2500,
      },
    ]

    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => body,
    })

    const result = await fetchLatestContract('token', PLAYER_ID, fetchImpl)

    expect(result).toEqual({
      id: 'contract-1',
      playerProfileId: PLAYER_ID,
      salary: 2500,
      createdAt: '2026-07-01T00:00:00.000Z',
    })
    expect(fetchImpl).toHaveBeenCalledWith(
      buildLatestContractUrl(PLAYER_ID),
      expect.objectContaining({ method: 'GET' }),
    )
  })

  it('returns not_found for empty array', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [],
    })

    const result = await fetchLatestContractWithMeta('token', PLAYER_ID, fetchImpl)

    expect(result).toEqual({ data: null, error: 'not_found', status: 200 })
  })

  it('returns http error metadata', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({}),
    })

    const result = await fetchLatestContractWithMeta('token', PLAYER_ID, fetchImpl)

    expect(result).toEqual({ data: null, error: 'http', status: 401 })
  })

  it('returns parse error metadata', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [{ invalid: true }],
    })

    const result = await fetchLatestContractWithMeta('token', PLAYER_ID, fetchImpl)

    expect(result).toEqual({ data: null, error: 'parse', status: 200 })
  })

  it('returns network error metadata', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('network'))

    const result = await fetchLatestContractWithMeta('token', PLAYER_ID, fetchImpl)

    expect(result).toEqual({ data: null, error: 'network' })
  })
})
