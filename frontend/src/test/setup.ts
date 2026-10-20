import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest'
import { closeAllStreams, FakeEventSource } from './event-source'
import { server } from './server'
import { resetTab } from './tab'

Object.defineProperty(globalThis, 'EventSource', { configurable: true, value: FakeEventSource })

// With every file running at once, a first render that waits on several queries, like the board's
// five, can pass the default 1 s that findBy waits.
configure({ asyncUtilTimeout: 3000 })

// Radix selects and menus measure and capture the pointer with browser APIs jsdom lacks.
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
}
Object.assign(Element.prototype, {
  hasPointerCapture: () => false,
  releasePointerCapture: () => {},
  scrollIntoView: () => {},
})

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))

// The fake API sets no cookies, so each test starts as if the real one had handed out its CSRF token.
beforeEach(() => {
  document.cookie = 'XSRF-TOKEN=token-de-teste'
})

afterEach(() => {
  cleanup()
  closeAllStreams()
  resetTab()
  server.resetHandlers()
  for (const cookie of document.cookie.split('; ')) {
    const name = cookie.split('=')[0]
    if (name) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    }
  }
})

afterAll(() => server.close())
