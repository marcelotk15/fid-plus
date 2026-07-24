import type { SquadHumanForMinigame } from '~/modules/quiz/types'

export function createSquadHuman(overrides: Partial<SquadHumanForMinigame> = {}): SquadHumanForMinigame {
  return {
    archetype: 'human',
    full_name: 'John Doe',
    is_human: true,
    jersey_number: 10,
    player_profile_id: 'player-1',
    primary_position: 'ST',
    ...overrides,
  }
}
