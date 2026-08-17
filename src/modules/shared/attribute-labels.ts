import { normalizeText } from '~/modules/shared/text'

/** Labels oficiais dos atributos do FID (bundle attributes). */
export const ATTRIBUTE_LABELS: Record<string, string> = {
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

const LABEL_TO_ATTR: Record<string, string> = Object.fromEntries(
  Object.entries(ATTRIBUTE_LABELS).map(([attr, label]) => [normalizeText(label), attr]),
)

export function getAttributeLabel(attr: string): string {
  return ATTRIBUTE_LABELS[attr] ?? attr
}

export function getAttrKeyByLabel(label: string): string | null {
  return LABEL_TO_ATTR[normalizeText(label)] ?? null
}
