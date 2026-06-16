import type { AttributeKey } from '~/modules/player/types'

export type AttributeGroup = {
  title: string
  keys: AttributeKey[]
}

export const ATTRIBUTE_GROUPS: AttributeGroup[] = [
  {
    title: 'Físico',
    keys: ['velocidade', 'aceleracao', 'agilidade', 'forca', 'equilibrio', 'resistencia', 'pulo', 'stamina'],
  },
  {
    title: 'Técnico',
    keys: ['drible', 'controle_bola', 'marcacao', 'desarme', 'um_toque', 'curva', 'passe_baixo', 'passe_alto'],
  },
  {
    title: 'Mental',
    keys: [
      'visao_jogo',
      'tomada_decisao',
      'antecipacao',
      'trabalho_equipe',
      'coragem',
      'posicionamento_ofensivo',
      'posicionamento_defensivo',
    ],
  },
  {
    title: 'Chute',
    keys: ['cabeceio', 'acuracia_chute', 'forca_chute'],
  },
  {
    title: 'Goleiro',
    keys: [
      'reflexo',
      'posicionamento_gol',
      'defesa_aerea',
      'pegada',
      'saida_gol',
      'um_contra_um',
      'distribuicao_curta',
      'distribuicao_longa',
      'tempo_reacao',
      'comando_area',
    ],
  },
]

export const ATTRIBUTE_LABELS: Record<AttributeKey, string> = {
  velocidade: 'Velocidade',
  aceleracao: 'Aceleração',
  agilidade: 'Agilidade',
  forca: 'Força',
  equilibrio: 'Equilíbrio',
  resistencia: 'Resistência',
  pulo: 'Pulo',
  stamina: 'Condição Física',
  drible: 'Drible',
  controle_bola: 'Controle de Bola',
  marcacao: 'Marcação',
  desarme: 'Desarme',
  um_toque: 'Um Toque',
  curva: 'Curva',
  passe_baixo: 'Passe Baixo',
  passe_alto: 'Passe Alto',
  visao_jogo: 'Visão de Jogo',
  tomada_decisao: 'Tomada de Decisão',
  antecipacao: 'Antecipação',
  trabalho_equipe: 'Trabalho em Equipe',
  coragem: 'Coragem',
  posicionamento_ofensivo: 'Posic. Ofensivo',
  posicionamento_defensivo: 'Posic. Defensivo',
  cabeceio: 'Cabeceio',
  acuracia_chute: 'Precisão do Chute',
  forca_chute: 'Força do Chute',
  reflexo: 'Reflexo',
  posicionamento_gol: 'Posicionamento',
  defesa_aerea: 'Defesa Aérea',
  pegada: 'Pegada',
  saida_gol: 'Saída do Gol',
  um_contra_um: 'Um Contra Um',
  distribuicao_curta: 'Distribuição Curta',
  distribuicao_longa: 'Distribuição Longa',
  tempo_reacao: 'Tempo de Reação',
  comando_area: 'Comando de Área',
}

export const MAX_ATTRIBUTE_VALUE = 99
