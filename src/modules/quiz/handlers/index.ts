import { QuizHandlerRegistry } from '~/modules/quiz/registry'

import { qualECamisaHandler } from './qual-e-a-camisa.handler'

export const quizHandlerRegistry = new QuizHandlerRegistry([qualECamisaHandler])
