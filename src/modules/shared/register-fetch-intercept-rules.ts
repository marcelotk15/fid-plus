import { DailyPackFetchInterceptRuleRunner } from '~/modules/daily-pack/daily-pack-fetch-bridge'
import { QuizFetchInterceptRuleRunner } from '~/modules/quiz/quiz-fetch-bridge'
import { FetchInterceptRuleRegistry } from '~/modules/shared/fetch-intercept-rule-runner'

export const fetchInterceptRuleRegistry = new FetchInterceptRuleRegistry([
  new QuizFetchInterceptRuleRunner(),
  new DailyPackFetchInterceptRuleRunner(),
])
