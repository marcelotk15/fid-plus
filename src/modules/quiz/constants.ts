import { MESSAGE_TYPE } from '~/modules/shared/consts'

export const QUIZ_PATH_PREFIX = '/player/quiz'

export const QUIZ_TYPE = {
  SQUAD_WORDLE: 'Squad Wordle',
  QUAL_E_A_CAMISA: 'Qual é a Camisa?',
  QUEM_E_QUEM: 'Quem é Quem?',
  WORDLE_DA_LIGA: 'Wordle da Liga',
  ARTILHEIRO_DA_RODADA: 'Artilheiro da Rodada',
  CONEXOES_DA_LIGA: 'Conexões da Liga',
  QUEM_JOGA_NO_CLUBE: 'Quem Joga no Clube',
  TIME_ESTADIO: 'Time × Estádio',
} as const

/**
 * Maps the quiz card title to the RPC endpoint of the API.
 * Multiple quizzes can point to the same endpoint.
 */
export const QUIZ_API_MAP: Record<
  (typeof QUIZ_TYPE)[keyof typeof QUIZ_TYPE],
  (typeof MESSAGE_TYPE)[keyof typeof MESSAGE_TYPE] | null
> = {
  [QUIZ_TYPE.SQUAD_WORDLE]: MESSAGE_TYPE.GET_SQUAD_HUMANS_FOR_MINIGAME,
  [QUIZ_TYPE.QUAL_E_A_CAMISA]: MESSAGE_TYPE.GET_SQUAD_HUMANS_FOR_MINIGAME,
  [QUIZ_TYPE.QUEM_E_QUEM]: MESSAGE_TYPE.GET_SQUAD_HUMANS_FOR_MINIGAME,
  [QUIZ_TYPE.WORDLE_DA_LIGA]: null,
  [QUIZ_TYPE.ARTILHEIRO_DA_RODADA]: null,
  [QUIZ_TYPE.CONEXOES_DA_LIGA]: null,
  [QUIZ_TYPE.QUEM_JOGA_NO_CLUBE]: null,
  [QUIZ_TYPE.TIME_ESTADIO]: null,
}

export const QUIZ_MODAL_TITLE_SELECTOR = '[role="dialog"] h2'
