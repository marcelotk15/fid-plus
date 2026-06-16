export interface PlayerAttributes {
  id: string
  player_profile_id: string
  velocidade: number
  aceleracao: number
  agilidade: number
  forca: number
  equilibrio: number
  resistencia: number
  pulo: number
  stamina: number
  drible: number
  controle_bola: number
  marcacao: number
  desarme: number
  um_toque: number
  curva: number
  passe_baixo: number
  passe_alto: number
  visao_jogo: number
  tomada_decisao: number
  antecipacao: number
  trabalho_equipe: number
  coragem: number
  posicionamento_ofensivo: number
  posicionamento_defensivo: number
  cabeceio: number
  acuracia_chute: number
  forca_chute: number
  reflexo: number
  posicionamento_gol: number
  defesa_aerea: number
  pegada: number
  saida_gol: number
  um_contra_um: number
  distribuicao_curta: number
  distribuicao_longa: number
  tempo_reacao: number
  comando_area: number
  created_at: string
  updated_at: string
}

export type AttributeKey = keyof Omit<PlayerAttributes, 'id' | 'player_profile_id' | 'created_at' | 'updated_at'>
