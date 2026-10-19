import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

/**
 * The fake API every test talks to. Each test adds the handlers it needs with `server.use`; the
 * ones here are the defaults left after each reset.
 */
export const server = setupServer(
  // Typing a phone in the order form looks the customer up; by default nobody is known.
  http.get('/api/customers', () =>
    HttpResponse.json({ detail: 'Cliente não encontrado.' }, { status: 404 }),
  ),
  // Typing a CEP asks ViaCEP; by default no CEP exists.
  http.get('https://viacep.com.br/ws/:cep/json/', () => HttpResponse.json({ erro: 'true' })),
)
