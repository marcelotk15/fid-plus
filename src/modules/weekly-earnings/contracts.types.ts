import type { FetchError, FetchResult } from '~/modules/shared/fetch.types'

export type PlayerContract = {
  id: string
  playerProfileId: string
  salary: number
  createdAt: string
}

export type FetchContractError = FetchError | 'not_found'

export type FetchProfileError = FetchError | 'profile_not_found' | 'no_player_profile'

export type FetchContractResult = FetchResult<PlayerContract | null, FetchContractError>

export type PlayerSalaryError = FetchContractError | FetchProfileError | 'no_token'
