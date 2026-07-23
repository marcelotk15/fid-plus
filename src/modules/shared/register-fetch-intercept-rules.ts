import { QuizFetchInterceptRuleRunner } from '~/modules/quiz/quiz-fetch-bridge'
import { FetchInterceptRuleRegistry } from '~/modules/shared/fetch-intercept-rule-runner'

export const fetchInterceptRuleRegistry = new FetchInterceptRuleRegistry([new QuizFetchInterceptRuleRunner()])
