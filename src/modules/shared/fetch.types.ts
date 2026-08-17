export type FetchLike = typeof fetch

export type FetchError = 'http' | 'parse' | 'network'

export type FetchResult<TData, TError extends string = FetchError> = {
  data: TData
  error?: TError
  status?: number
}
