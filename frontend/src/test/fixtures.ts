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

export const pizzaria = {
  id: '0199f0a0-0000-7000-8000-0000000000a1',
  name: 'Pizzaria Bella',
  ownerName: 'Ana Souza',
}

export const burger = {
  id: '0199f0a0-0000-7000-8000-0000000000b2',
  name: 'Burger da Vila',
  ownerName: 'Bruno Lima',
}

/** A page of the order list as the API returns it. */
export function page<T>(content: T[]) {
  return { content, page: 0, size: 20, totalElements: content.length, totalPages: 1 }
}

/** An order as the list returns it, received in Pizzaria Bella unless overridden. */
export function orderSummary(overrides: Record<string, unknown> = {}) {
  return {
    id: '0199f0a0-0000-7000-8000-00000000c0de',
    code: '00C0DE11',
    restaurantId: pizzaria.id,
    restaurantName: pizzaria.name,
    status: 'RECEBIDO',
    allowedNextStatuses: ['EM_PREPARO', 'CANCELADO'],
    customerName: 'Maria Silva',
    neighborhood: 'Bela Vista',
    total: 98.8,
    createdAt: '2026-10-17T18:30:00Z',
    ...overrides,
  }
}

/** The full order the API returns after a change, built from a list entry. */
export function orderDetails(summary: ReturnType<typeof orderSummary>) {
  const { customerName, neighborhood, ...rest } = summary
  return {
    ...rest,
    customer: { name: customerName, phone: '11987654321' },
    deliveryAddress: {
      cep: '01310100',
      street: 'Av. Paulista',
      number: '1000',
      complement: null,
      neighborhood,
      city: 'São Paulo',
      state: 'SP',
    },
    items: [{ name: 'Pizza margherita', quantity: 2, unitPrice: 45.9 }],
    subtotal: 91.8,
    deliveryFee: 7,
    payment: { method: 'PIX', changeFor: null },
    notes: null,
    statusHistory: [],
  }
}

/** The API answers /auth/me with this user, as if the session were open. */
export function signedInAs(user: typeof ana) {
  return http.get('/api/auth/me', () => HttpResponse.json(user))
}

/** The API answers /auth/me with 401, as when there is no session. */
export const noSession = http.get('/api/auth/me', () =>
  HttpResponse.json({ detail: 'Faça login para continuar.' }, { status: 401 }),
)
