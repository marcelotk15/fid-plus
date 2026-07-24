import { logger } from '~/modules/logger'
import { readSupabaseAccessToken } from '~/modules/shared/supabase-auth'

import type { DailyPackDeps, DailyPackStatusResponse } from './daily-pack.types'

import { fetchDailyPackStatusWithMeta } from './daily-pack-api'
import { setDailyPackMenuAvailable } from './daily-pack-menu-highlight'
import { notifyDailyPackAvailable } from './daily-pack-notifier'
import { applyDailyPackStatus } from './daily-pack-status'
import { isDailyPackCacheValid, readDailyPackCache } from './daily-pack.storage'

type ResolvedDailyPackDeps = {
  storage: NonNullable<DailyPackDeps['storage']>
  fetch: NonNullable<DailyPackDeps['fetch']>
  notify: NonNullable<DailyPackDeps['notify']>
  highlightMenu: NonNullable<DailyPackDeps['highlightMenu']>
}

export type DailyPackSession = {
  checkOncePerSession(): void
  ingestStatusFromPage(status: DailyPackStatusResponse): void
  reset(): void
}

function resolveDeps(deps: DailyPackDeps = {}): ResolvedDailyPackDeps {
  return {
    storage: deps.storage ?? globalThis.localStorage,
    fetch: deps.fetch ?? globalThis.fetch.bind(globalThis),
    notify: deps.notify ?? notifyDailyPackAvailable,
    highlightMenu: deps.highlightMenu ?? setDailyPackMenuAvailable,
  }
}

export function createDailyPackSession(deps: DailyPackDeps = {}): DailyPackSession {
  const resolved = resolveDeps(deps)
  let fetchAttemptedThisSession = false
  let statusAppliedThisSession = false

  function applyStatusOnce(status: DailyPackStatusResponse, options?: { notify?: boolean }): void {
    if (statusAppliedThisSession) return

    statusAppliedThisSession = true
    applyDailyPackStatus(status, resolved, options)
  }

  async function runDailyPackFetch(): Promise<void> {
    const { storage, fetch, notify, highlightMenu } = resolved
    const cache = readDailyPackCache(storage)

    if (cache && isDailyPackCacheValid(cache)) {
      statusAppliedThisSession = true
      const available = !cache.claimedToday
      highlightMenu(available)
      if (available) notify()
      logger.info('daily pack check skipped', { reason: 'cache_valid' })
      return
    }

    const accessToken = readSupabaseAccessToken(storage)

    if (!accessToken) {
      logger.info('daily pack check skipped', { reason: 'no_token' })
      return
    }

    const result = await fetchDailyPackStatusWithMeta(accessToken, fetch)

    if (!result.data) {
      logger.info('daily pack check skipped', {
        reason: 'api_error',
        detail: result.error,
        status: result.status,
      })
      return
    }

    applyStatusOnce(result.data)
  }

  return {
    checkOncePerSession(): void {
      if (fetchAttemptedThisSession) return

      fetchAttemptedThisSession = true
      void runDailyPackFetch()
    },

    ingestStatusFromPage(status: DailyPackStatusResponse): void {
      applyStatusOnce(status)
    },

    reset(): void {
      fetchAttemptedThisSession = false
      statusAppliedThisSession = false
    },
  }
}
