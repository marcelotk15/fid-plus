import { logger } from '~/modules/logger'

import type { DailyPackDeps, DailyPackStatusResponse } from './daily-pack.types'

import { setDailyPackMenuAvailable } from './daily-pack-menu-highlight'
import { notifyDailyPackAvailable } from './daily-pack-notifier'
import { saveDailyPackCache } from './daily-pack.storage'

type ApplyDailyPackStatusDeps = Pick<DailyPackDeps, 'storage' | 'notify' | 'highlightMenu'>

function resolveApplyDeps(deps: ApplyDailyPackStatusDeps = {}) {
  return {
    storage: deps.storage ?? globalThis.localStorage,
    notify: deps.notify ?? notifyDailyPackAvailable,
    highlightMenu: deps.highlightMenu ?? setDailyPackMenuAvailable,
  }
}

type ApplyDailyPackStatusOptions = {
  notify?: boolean
}

export function applyDailyPackStatus(
  status: DailyPackStatusResponse,
  deps: ApplyDailyPackStatusDeps = {},
  options: ApplyDailyPackStatusOptions = {},
): void {
  const { storage, notify, highlightMenu } = resolveApplyDeps(deps)
  const shouldNotify = options.notify ?? true

  if (status.claimed_today) {
    saveDailyPackCache(storage, status.next_reset_at, true)
    highlightMenu(false)
    logger.info('daily pack already claimed')
    return
  }

  highlightMenu(true)
  logger.info('daily pack available')

  if (shouldNotify) {
    notify()
  }
}
