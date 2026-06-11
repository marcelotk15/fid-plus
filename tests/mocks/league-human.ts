import type { LeagueHumanForMinigame } from '~/modules/quiz/types'

export function createLeagueHuman(overrides: Partial<LeagueHumanForMinigame> = {}): LeagueHumanForMinigame {
  return {
    archetype: 'human',
    club_crest_url: 'https://example.com/crest.png',
    club_id: 'club-1',
    club_name: 'Royal Identity',
    full_name: 'John Doe',
    is_human: true,
    jersey_number: 10,
    player_profile_id: 'player-1',
    primary_position: 'LW',
    ...overrides,
  }
}
