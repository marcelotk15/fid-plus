import type { FetchInterceptor } from '~/modules/shared/fetch-interceptor'

export interface FetchInterceptRuleRunner {
  register(interceptor: FetchInterceptor): void
}

export class FetchInterceptRuleRegistry {
  constructor(private readonly runners: FetchInterceptRuleRunner[]) {}

  registerAll(interceptor: FetchInterceptor): void {
    for (const runner of this.runners) {
      runner.register(interceptor)
    }
  }
}
