export type PlayerContract = {
  id: string
  playerProfileId: string
  salary: number
  createdAt: string
}

export type FetchLike = typeof fetch

export type FetchContractError = 'http' | 'parse' | 'network' | 'not_found'

export type FetchProfileError = 'http' | 'parse' | 'network' | 'profile_not_found' | 'no_player_profile'

export type FetchContractResult = {
  data: PlayerContract | null
  error?: FetchContractError
  status?: number
}

export type PlayerSalaryError = FetchContractError | FetchProfileError | 'no_token'
