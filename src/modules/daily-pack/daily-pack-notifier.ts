import { DAILY_PACK_SIDEBAR_MENU, DAILY_PACK_TOAST } from './daily-pack.constants'

const TOAST_HOST_ID = 'fid-plus-daily-pack-toast-host'

function createToastStyles(): HTMLStyleElement {
  const style = document.createElement('style')

  style.textContent = `
    :host {
      all: initial;
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 2147483647;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    .toast {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      max-width: 320px;
      padding: 14px 16px;
      border-radius: 10px;
      background: #111827;
      color: #f9fafb;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
      border: 1px solid #374151;
    }

    .content {
      flex: 1;
      min-width: 0;
    }

    .title {
      margin: 0 0 4px;
      font-size: 14px;
      font-weight: 600;
      line-height: 1.3;
    }

    .message {
      margin: 0 0 10px;
      font-size: 13px;
      line-height: 1.4;
      color: #d1d5db;
    }

    .action {
      display: inline-block;
      margin-top: 2px;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      line-height: 1.4;
      color: #111827;
      background: #fbbf24;
      text-decoration: none;
    }

    .action:hover {
      background: #fde68a;
      text-decoration: none;
    }

    .close {
      all: unset;
      cursor: pointer;
      color: #9ca3af;
      font-size: 18px;
      line-height: 1;
      padding: 2px 4px;
    }

    .close:hover {
      color: #f9fafb;
    }
  `

  return style
}

function dismissToast(host: HTMLElement, timerId?: ReturnType<typeof setTimeout>): void {
  if (timerId) clearTimeout(timerId)
  host.remove()
}

export function notifyDailyPackAvailable(): void {
  document.getElementById(TOAST_HOST_ID)?.remove()

  const host = document.createElement('div')
  host.id = TOAST_HOST_ID

  const shadow = host.attachShadow({ mode: 'open' })
  shadow.append(createToastStyles())

  const toast = document.createElement('div')
  toast.className = 'toast'

  const content = document.createElement('div')
  content.className = 'content'

  const title = document.createElement('p')
  title.className = 'title'
  title.textContent = DAILY_PACK_TOAST.TITLE

  const message = document.createElement('p')
  message.className = 'message'
  message.textContent = DAILY_PACK_TOAST.MESSAGE

  const actionLink = document.createElement('a')
  actionLink.className = 'action'
  actionLink.href = DAILY_PACK_SIDEBAR_MENU.HREF
  actionLink.textContent = DAILY_PACK_TOAST.GO_ACTION_LABEL

  const closeButton = document.createElement('button')
  closeButton.className = 'close'
  closeButton.type = 'button'
  closeButton.setAttribute('aria-label', 'Fechar')
  closeButton.textContent = '×'

  content.append(title, message, actionLink)
  toast.append(content, closeButton)
  shadow.append(toast)

  let timerId: ReturnType<typeof setTimeout> | undefined

  closeButton.addEventListener('click', () => {
    dismissToast(host, timerId)
  })

  actionLink.addEventListener('click', () => {
    dismissToast(host, timerId)
  })

  timerId = setTimeout(() => {
    dismissToast(host)
  }, DAILY_PACK_TOAST.AUTO_DISMISS_MS)

  document.body.append(host)
}

export function resetDailyPackNotifierState(): void {
  document.getElementById(TOAST_HOST_ID)?.remove()
}
