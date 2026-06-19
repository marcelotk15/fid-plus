export const APP_NAME = 'FID Plus'

/** Rotas do site Football Identity (navegação SPA). */
export const FID_ROUTE = {
  QUIZ: '/player/quiz',
} as const

/** URLs e paths do backend Supabase. */
export const SUPABASE = {
  BASE_URL: 'https://vbpgsdotwsfsiutydpad.supabase.co',
  RPC_PATH_PREFIX: '/rest/v1/rpc',
  AUTH_STORAGE_KEY: 'sb-vbpgsdotwsfsiutydpad-auth-token',
  PUBLIC_API_KEY: 'sb_publishable_JmOwSLwTLCOyid5Ecg6-3A_TUuTK-gu',
  CLIENT_INFO: 'supabase-js-web/2.99.2',
} as const
} as const

/** Identificadores da comunicação entre content scripts da extensão. */
export const MESSAGE_SOURCE = {
  QUIZ_CONTENT: 'quiz-content',
} as const

export const MESSAGE_TYPE = {
  GET_SQUAD_HUMANS_FOR_MINIGAME: 'get_squad_humans_for_minigame',
  GET_STADIUMS_FOR_MINIGAME: 'get_stadiums_for_minigame',
  GET_LEAGUE_HUMANS_FOR_MINIGAME: 'get_league_humans_for_minigame',
  GET_TOP_SCORERS_FOR_MINIGAME: 'get_top_scorers_for_minigame',
} as const
