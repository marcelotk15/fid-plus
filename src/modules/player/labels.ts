export type AttributeLabelResult = {
  label: string
  barClass: string
  textClass: string
}

export function getAttributeLabel(value: number): AttributeLabelResult {
  if (value < 20) {
    return { label: 'Péssimo', barClass: 'bg-destructive', textClass: 'text-red-600' }
  }

  if (value < 40) {
    return { label: 'Ruim', barClass: 'bg-destructive', textClass: 'text-red-400' }
  }

  if (value < 50) {
    return { label: 'Fraco', barClass: 'bg-warning', textClass: 'text-orange-400' }
  }

  if (value < 60) {
    return { label: 'Mediano', barClass: 'bg-warning', textClass: 'text-amber-400' }
  }

  if (value < 75) {
    return { label: 'Bom', barClass: 'bg-green-400', textClass: 'text-green-400' }
  }

  if (value < 90) {
    return { label: 'Ótimo', barClass: 'bg-emerald-500', textClass: 'text-emerald-400' }
  }

  return { label: 'Excelente', barClass: 'bg-emerald-500', textClass: 'text-emerald-300' }
}

export function getAttributeBarWidth(value: number, max = 99): string {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  return `${percentage}%`
}
