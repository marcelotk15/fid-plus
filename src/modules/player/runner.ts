import type { RouteChangePayload } from '~/entrypoints/content'
import type { PlayerAttributes } from '~/modules/player/types'

import { logger } from '~/modules/logger'
import {
  findMainContainer,
  insertAttrsGridBetweenFirstDivs,
  restoreLayout,
  waitForInsertPoint,
  waitForMainContainer,
  waitForRouteDomUpdate,
  watchLayoutFix,
} from '~/modules/player/layout'
import { ATTRS_GRID_SELECTOR, isExtensionAttrsGrid, renderAttrsGrid } from '~/modules/player/render-attrs-grid'
import { getPlayerProfileId } from '~/modules/player/routes'
import { MESSAGE_SOURCE, MESSAGE_TYPE } from '~/modules/shared/consts'

type PlayerAttributesMessage = {
  source: typeof MESSAGE_SOURCE.PLAYER_CONTENT
  type: typeof MESSAGE_TYPE.PLAYER_ATTRIBUTES
  payload: {
    pageUrl: string
    status: number
    body: unknown
  }
}

function isPlayerAttributesMessage(data: unknown): data is PlayerAttributesMessage {
  if (!data || typeof data !== 'object') return false

  const message = data as Partial<PlayerAttributesMessage>

  return (
    message.source === MESSAGE_SOURCE.PLAYER_CONTENT &&
    message.type === MESSAGE_TYPE.PLAYER_ATTRIBUTES &&
    message.payload !== undefined &&
    typeof message.payload.status === 'number'
  )
}

function parsePlayerAttributes(body: unknown): PlayerAttributes | null {
  if (!Array.isArray(body) || body.length === 0) return null

  const attrs = body[0]

  if (!attrs || typeof attrs !== 'object') return null

  return attrs as PlayerAttributes
}

export class PlayerProfileRunner {
  private active = false
  private activePlayerId: string | null = null
  private layoutAdjusted = false
  private abortController: AbortController | null = null
  private layoutFixCleanup: (() => void) | null = null
  private injectedGrid: HTMLElement | null = null

  onRouteChange(route: RouteChangePayload): void {
    const playerId = getPlayerProfileId(route.pathname)

    if (!playerId) {
      if (this.active) {
        logger.info('leaving player profile route')
        this.resetState()
      }

      return
    }

    if (this.active && this.activePlayerId === playerId) {
      return
    }

    this.resetState()
    this.active = true
    this.activePlayerId = playerId
    this.abortController = new AbortController()

    logger.info('entering player profile route', { playerId })

    void this.prepareLayout(this.abortController.signal)
  }

  onPlayerAttributes(event: MessageEvent): void {
    if (!this.active || !this.activePlayerId) return
    if (!isPlayerAttributesMessage(event.data)) return
    if (event.data.payload.status !== 200) return

    const attrs = parsePlayerAttributes(event.data.payload.body)

    if (!attrs) {
      logger.info('player attributes payload is empty or invalid')
      return
    }

    if (attrs.player_profile_id !== this.activePlayerId) {
      logger.info('player attributes profile id mismatch', {
        expected: this.activePlayerId,
        received: attrs.player_profile_id,
      })
      return
    }

    void this.renderAttributes(attrs)
  }

  dispose(): void {
    this.resetState()
  }

  private async ensureMainContainer(signal: AbortSignal): Promise<Element> {
    const existing = findMainContainer()

    if (existing) {
      return existing
    }

    return waitForMainContainer({ signal })
  }

  private async prepareLayout(signal: AbortSignal): Promise<void> {
    try {
      await waitForRouteDomUpdate({ signal })

      if (signal.aborted || !this.active) {
        return
      }

      await this.ensureMainContainer(signal)

      if (signal.aborted || !this.active) {
        return
      }

      this.startLayoutFix(signal)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return
      }

      logger.error('failed to apply player profile layout fix', {
        error: String(error),
      })
    }
  }

  private startLayoutFix(signal: AbortSignal): void {
    this.stopLayoutFix()
    this.layoutFixCleanup = watchLayoutFix(document, signal)
    this.layoutAdjusted = true
  }

  private stopLayoutFix(): void {
    this.layoutFixCleanup?.()
    this.layoutFixCleanup = null
  }

  private async renderAttributes(attrs: PlayerAttributes): Promise<void> {
    const signal = this.abortController?.signal

    if (!signal || signal.aborted) return

    try {
      const container = await this.ensureMainContainer(signal)

      if (!this.layoutFixCleanup) {
        this.startLayoutFix(signal)
      }

      await waitForInsertPoint(container, { signal })

      const grid = renderAttrsGrid(attrs)

      const existingGrid = container.querySelector(ATTRS_GRID_SELECTOR)

      if (existingGrid && isExtensionAttrsGrid(existingGrid)) {
        existingGrid.replaceWith(grid)
      } else {
        if (existingGrid) {
          existingGrid.remove()
        }

        insertAttrsGridBetweenFirstDivs(container, grid)
      }

      this.injectedGrid = grid
      logger.info('player attributes grid rendered')
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return
      }

      logger.error('failed to render player attributes grid', {
        error: String(error),
      })
    }
  }

  private resetState(): void {
    this.abortController?.abort()
    this.abortController = null
    this.active = false
    this.activePlayerId = null

    if (this.injectedGrid?.isConnected) {
      this.injectedGrid.remove()
    }

    this.injectedGrid = null

    const shouldRestoreLayout = this.layoutAdjusted
    this.stopLayoutFix()

    if (shouldRestoreLayout) {
      restoreLayout()
      this.layoutAdjusted = false
    }
  }
}
