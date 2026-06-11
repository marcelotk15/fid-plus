import { Browser } from 'happy-dom'

const browser = new Browser()
const page = browser.newPage()
const window = page.mainFrame.window

globalThis.window = window as unknown as Window & typeof globalThis
globalThis.document = window.document
globalThis.HTMLElement = window.HTMLElement
globalThis.HTMLButtonElement = window.HTMLButtonElement
globalThis.MutationObserver = window.MutationObserver
globalThis.AbortController = window.AbortController
globalThis.AbortSignal = window.AbortSignal
globalThis.DOMException = window.DOMException
globalThis.MessageEvent = window.MessageEvent
globalThis.CustomEvent = window.CustomEvent
