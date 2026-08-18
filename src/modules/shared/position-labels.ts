/** Siglas FIFA → brasileiras usadas no FID. */
export const POSITION_LABELS: Record<string, string> = {
  GK: 'GOL',
  CB: 'ZAG',
  LCB: 'ZAG',
  RCB: 'ZAG',
  LB: 'LE',
  RB: 'LD',
  LWB: 'ALE',
  RWB: 'ALD',
  CDM: 'VOL',
  LDM: 'VOL',
  RDM: 'VOL',
  CM: 'MC',
  LCM: 'MC',
  RCM: 'MC',
  CAM: 'MEI',
  LAM: 'MEI',
  RAM: 'MEI',
  LM: 'ME',
  RM: 'MD',
  LW: 'PE',
  LF: 'PE',
  RW: 'PD',
  RF: 'PD',
  CF: 'CA',
  SS: 'SA',
  ST: 'ATA',
}

export function getPositionLabel(code: string): string {
  return POSITION_LABELS[code.trim().toUpperCase()] ?? code
}
