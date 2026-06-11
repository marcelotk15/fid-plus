import { QuizHandlerRegistry } from '~/modules/quiz/registry'

import { qualECamisaHandler } from './qual-e-a-camisa.handler'
import { quemEQuemHandler } from './quem-e-quem.handler'
import { squadWordleHandler } from './squad-wordle.handler'

export const quizHandlerRegistry = new QuizHandlerRegistry([
  qualECamisaHandler,
  quemEQuemHandler,
  squadWordleHandler,
])
