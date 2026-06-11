import type { StadiumForMinigame } from '~/modules/quiz/types'

export function createStadium(overrides: Partial<StadiumForMinigame> = {}): StadiumForMinigame {
  return {
    club_id: 'club-1',
    club_name: 'FK Vedernik Prauzhda',
    club_short_name: 'VED',
    crest_url: 'https://example.com/crest.png',
    primary_color: '#077407',
    secondary_color: '#ffffff',
    stadium_name: 'Livada',
    ...overrides,
  }
}