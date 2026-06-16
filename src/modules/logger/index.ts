import { APP_NAME } from '../shared/consts'

type LogMetadata = Record<string, unknown>

type LogType = 'info' | 'error'

interface LoggerOptions {
  enabled?: boolean
  appName?: string
}

interface LoggerService {
  info(message: string, metadata?: LogMetadata): void
  error(message: string, metadata?: LogMetadata): void
}

export class BrowserLoggerService implements LoggerService {
  private readonly enabled: boolean
  private readonly appName?: string

  constructor(options: LoggerOptions = {}) {
    this.enabled = options.enabled ?? true
    this.appName = options.appName
  }

  info(message: string, metadata?: LogMetadata): void {
    this.log('info', message, metadata)
  }

  error(message: string, metadata?: LogMetadata): void {
    this.log('error', message, metadata)
  }

  private log(type: LogType, message: string, metadata?: LogMetadata): void {
    if (!this.enabled) return

    const timestamp = new Date().toISOString()

    const config = this.getLogConfig(type)

    const prefix = this.appName ? `[${this.appName}] [${type.toUpperCase()}]` : `[${type.toUpperCase()}]`

    const formattedMessage = `${prefix} ${message}`

    const payload = {
      type,
      message,
      timestamp,
      metadata: metadata ?? null,
    }

    const consoleMethod = type === 'error' ? console.error : console.info

    if (metadata) {
      console.groupCollapsed(`%c${formattedMessage}`, config.badgeStyle)

      consoleMethod('%cTimestamp:', config.labelStyle, timestamp)
      consoleMethod('%cMetadata:', config.labelStyle, metadata)
      consoleMethod('%cPayload:', config.labelStyle, payload)

      console.groupEnd()
      return
    }

    consoleMethod(`%c${formattedMessage}`, config.badgeStyle, {
      timestamp,
    })
  }

  private getLogConfig(type: LogType) {
    const baseStyle = ['color: white', 'padding: 2px 6px', 'border-radius: 4px', 'font-weight: bold']

    if (type === 'error') {
      return {
        badgeStyle: [...baseStyle, 'background: #dc2626'].join(';'),
        labelStyle: 'color: #dc2626; font-weight: bold',
      }
    }

    return {
      badgeStyle: [...baseStyle, 'background: #2563eb'].join(';'),
      labelStyle: 'color: #2563eb; font-weight: bold',
    }
  }
}

export const logger = new BrowserLoggerService({
  appName: APP_NAME,
  enabled: true,
})
