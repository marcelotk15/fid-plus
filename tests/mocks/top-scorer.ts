import type { TopScorerForMinigame } from '~/modules/quiz/types'

export function createTopScorer(overrides: Partial<TopScorerForMinigame> = {}): TopScorerForMinigame {
  return {
    full_name: 'Edónho',
    is_human: true,
    player_profile_id: 'player-1',
    round_number: 6,
    season_number: 1,
    total_goals: 3,
    ...overrides,
  }
}
