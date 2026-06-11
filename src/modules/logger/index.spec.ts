import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { BrowserLoggerService } from './index'

describe('BrowserLoggerService', () => {
  beforeEach(() => {
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'groupCollapsed').mockImplementation(() => {})
    vi.spyOn(console, 'groupEnd').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('logs info when enabled', () => {
    const logger = new BrowserLoggerService({ enabled: true })

    logger.info('test message')

    expect(console.info).toHaveBeenCalled()
  })

  it('logs error when enabled', () => {
    const logger = new BrowserLoggerService({ enabled: true })

    logger.error('error message')

    expect(console.error).toHaveBeenCalled()
  })

  it('does not log anything when disabled', () => {
    const logger = new BrowserLoggerService({ enabled: false })

    logger.info('test message')
    logger.error('error message')

    expect(console.info).not.toHaveBeenCalled()
    expect(console.error).not.toHaveBeenCalled()
  })

  it('uses groupCollapsed when metadata is provided', () => {
    const logger = new BrowserLoggerService({ enabled: true })

    logger.info('with metadata', { key: 'value' })

    expect(console.groupCollapsed).toHaveBeenCalled()
    expect(console.groupEnd).toHaveBeenCalled()
  })

  it('includes appName in the prefix when configured', () => {
    const logger = new BrowserLoggerService({ enabled: true, appName: 'Test App' })

    logger.info('hello')

    const infoMock = console.info as ReturnType<typeof vi.fn>
    expect(infoMock.mock.calls[0]?.[0]).toContain('[Test App]')
  })
})
