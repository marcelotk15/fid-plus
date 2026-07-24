import { QUIZ_TYPE } from '~/modules/quiz/constants'
import { MESSAGE_TYPE } from '~/modules/shared/consts'

export type QuizType = (typeof QUIZ_TYPE)[keyof typeof QUIZ_TYPE]

export type ApiMessageType = (typeof MESSAGE_TYPE)[keyof typeof MESSAGE_TYPE]

export interface SquadHumanForMinigame {
  archetype: string
  full_name: string
  is_human: boolean
  jersey_number: number
  player_profile_id: string
  primary_position: string
}

export interface StadiumForMinigame {
  club_id: string
  club_name: string
  club_short_name: string
  crest_url: string
  primary_color: string
  secondary_color: string
  stadium_name: string
}

export interface LeagueHumanForMinigame {
  archetype: string
  club_crest_url: string
  club_id: string
  club_name: string
  full_name: string
  is_human: boolean
  jersey_number: number
  player_profile_id: string
  primary_position: string
}

export interface TopScorerForMinigame {
  full_name: string
  is_human: boolean
  player_profile_id: string
  round_number: number
  season_number: number
  total_goals: number
}
