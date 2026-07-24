import { Browser } from 'happy-dom'

const browser = new Browser()
const page = browser.newPage()
const window = page.mainFrame.window

globalThis.window = window as unknown as Window & typeof globalThis
globalThis.document = window.document as unknown as Document
globalThis.Event = window.Event as unknown as typeof Event
globalThis.HTMLElement = window.HTMLElement as unknown as typeof HTMLElement
globalThis.HTMLButtonElement = window.HTMLButtonElement as unknown as typeof HTMLButtonElement
globalThis.HTMLInputElement = window.HTMLInputElement as unknown as typeof HTMLInputElement
globalThis.MutationObserver = window.MutationObserver as unknown as typeof MutationObserver
globalThis.AbortController = window.AbortController as unknown as typeof AbortController
globalThis.AbortSignal = window.AbortSignal as unknown as typeof AbortSignal
globalThis.DOMException = window.DOMException as unknown as typeof DOMException
globalThis.MessageEvent = window.MessageEvent as unknown as typeof MessageEvent
globalThis.CustomEvent = window.CustomEvent as unknown as typeof CustomEvent
