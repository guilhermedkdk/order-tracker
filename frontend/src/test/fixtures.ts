import { http, HttpResponse } from 'msw'

export const ana = {
  id: '0199f0a0-0000-7000-8000-000000000001',
  name: 'Ana Souza',
  email: 'ana@example.com',
  role: 'DONO',
  demo: false,
}

export const admin = {
  id: '0199f0a0-0000-7000-8000-000000000009',
  name: 'Suporte',
  email: 'suporte@example.com',
  role: 'ADMIN',
  demo: false,
}

/** The API answers /auth/me with this user, as if the session were open. */
export function signedInAs(user: typeof ana) {
  return http.get('/api/auth/me', () => HttpResponse.json(user))
}

/** The API answers /auth/me with 401, as when there is no session. */
export const noSession = http.get('/api/auth/me', () =>
  HttpResponse.json({ detail: 'Faça login para continuar.' }, { status: 401 }),
)
