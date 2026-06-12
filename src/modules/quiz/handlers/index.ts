import { QuizHandlerRegistry } from '~/modules/quiz/registry'

import { conexoesDaLigaHandler } from './conexoes-da-liga.handler'
import { qualECamisaHandler } from './qual-e-a-camisa.handler'
import { quemEQuemHandler } from './quem-e-quem.handler'
import { quemJogaNoClubeHandler } from './quem-joga-no-clube.handler'
import { squadWordleHandler } from './squad-wordle.handler'
import { stadiumsHandler } from './stadiums.handler'
import { topScorersHandler } from './top-scorers.handler'
import { wordleDaLigaHandler } from './wordle-da-liga.handler'

export const quizHandlerRegistry = new QuizHandlerRegistry([
  qualECamisaHandler,
  quemEQuemHandler,
  squadWordleHandler,
  stadiumsHandler,
  topScorersHandler,
  wordleDaLigaHandler,
  conexoesDaLigaHandler,
  quemJogaNoClubeHandler,
])
