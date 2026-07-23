import type { WeeklyObjective, WeeklyObjectiveStatus, WeeklyObjectiveView } from './weekly-objectives.types'

import { resolveDailyPerfectWeekStatus } from './weekly-dailies-feasibility'

const WEEKLY_OBJECTIVE_LABELS: Record<string, string> = {
  perfect_minigame_score_week: 'Nota perfeita no mini-jogo',
  vote_2_mvps: 'Vote em 2 MVPs',
  play_2_pickup_matches: 'Jogue 2 partidas de várzea',
  play_15_minigames_week: 'Jogue 15 mini-jogos',
  complete_dailies_perfect: '7 dias de missões perfeitas',
  play_2_league_matches: 'Jogue 2 partidas da liga',
  team_training_week: 'Participe do treino do time',
  train_14_attributes: 'Treine 14 vezes',
  use_daily_shop_3x: 'Use a loja diária 3 vezes',
  watch_2_replays: 'Assista 2 replays',
  fidgram_interact_10_week: 'Interaja 10 vezes no fidgram',
  play_squad_quiz_week: 'Jogue o quiz',
  streak_7_days_week: 'Fique ativo 7 dias na semana (streak)',
}

function formatObjectiveKeyFallback(key: string): string {
  return key.replaceAll('_', ' ')
}

export function getWeeklyObjectiveLabel(key: string): string {
  return WEEKLY_OBJECTIVE_LABELS[key] ?? formatObjectiveKeyFallback(key)
}

export function toWeeklyObjectiveViews(
  objectives: WeeklyObjective[],
  weekStart: string,
  now = new Date(),
): WeeklyObjectiveView[] {
  return objectives.map((objective) => {
    const status: WeeklyObjectiveStatus = resolveDailyPerfectWeekStatus({
      key: objective.key,
      currentCount: objective.currentCount,
      targetCount: objective.targetCount,
      completedAt: objective.completedAt,
      weekStart,
      now,
    })

    return {
      ...objective,
      label: getWeeklyObjectiveLabel(objective.key),
      isCompleted: status === 'completed',
      status,
    }
  })
}
