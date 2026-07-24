import { FetchInterceptRuleRegistry } from '~/modules/shared/fetch-intercept-rule-runner'
import { WeeklyEarningsFetchInterceptRuleRunner } from '~/modules/weekly-earnings/weekly-earnings-fetch-bridge'

export const fetchInterceptRuleRegistry = new FetchInterceptRuleRegistry([new WeeklyEarningsFetchInterceptRuleRunner()])
