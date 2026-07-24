export type WeekRange = {
  start: Date
  end: Date
}

export function getWeekRange(date = new Date()): WeekRange {
  const start = new Date(date)
  const day = start.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day

  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() + diffToMonday)

  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)

  return { start, end }
}

export function formatWeekRangeLabel(range: WeekRange): string {
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  })

  return `Semana ${formatter.format(range.start)} – ${formatter.format(range.end)}`
}

export function formatWeekRangeFromStart(weekStart: string): string {
  const start = new Date(`${weekStart}T00:00:00`)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)

  return formatWeekRangeLabel({ start, end })
}

export function formatWeekStartKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function getCurrentWeekStartKey(date = new Date()): string {
  return formatWeekStartKey(getWeekRange(date).start)
}
