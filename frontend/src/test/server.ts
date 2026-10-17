import { setupServer } from 'msw/node'

/** The fake API every test talks to. Each test adds the handlers it needs with `server.use`. */
export const server = setupServer()
