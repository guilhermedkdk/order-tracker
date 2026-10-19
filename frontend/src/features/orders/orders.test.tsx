import { screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import {
  admin,
  ana,
  burger,
  orderDetails,
  orderSummary,
  page,
  pizzaria,
  signedInAs,
} from '@/test/fixtures'
import { renderAt } from '@/test/render'
import { choose } from '@/test/select'
import { server } from '@/test/server'

const restaurants = http.get('/api/restaurants', () => HttpResponse.json([burger, pizzaria]))

describe('order list', () => {
  it("shows the selected restaurant's orders with their current status", async () => {
    let requested: string | null = null
    server.use(
      signedInAs(ana),
      restaurants,
      http.get('/api/orders', ({ request }) => {
        requested = new URL(request.url).searchParams.get('restaurantId')
        return HttpResponse.json(page([orderSummary()]))
      }),
    )

    renderAt(`/pedidos?restaurante=${pizzaria.id}&visao=lista`)

    const row = await screen.findByRole('row', { name: /00C0DE11/ })
    expect(within(row).getByText('Maria Silva')).toBeInTheDocument()
    expect(within(row).getByText('Recebido')).toBeInTheDocument()
    expect(within(row).getByText('R$ 98,80')).toBeInTheDocument()
    expect(requested).toBe(pizzaria.id)
  })

  it('shows the admin every restaurant, with a restaurant column', async () => {
    let filtered: boolean | null = null
    server.use(
      signedInAs(admin),
      restaurants,
      http.get('/api/orders', ({ request }) => {
        filtered = new URL(request.url).searchParams.has('restaurantId')
        return HttpResponse.json(
          page([
            orderSummary(),
            orderSummary({
              id: '0199f0a0-0000-7000-8000-00000000beef',
              code: '0000BEEF',
              restaurantId: burger.id,
              restaurantName: burger.name,
            }),
          ]),
        )
      }),
    )

    renderAt('/pedidos?visao=lista')

    const row = await screen.findByRole('row', { name: /0000BEEF/ })
    expect(within(row).getByText('Burger da Vila')).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Restaurante' })).toBeInTheDocument()
    expect(filtered).toBe(false)
  })

  it('moves an order forward with the action the API allows', async () => {
    let order = orderSummary()
    let sent: unknown = null
    server.use(
      signedInAs(ana),
      restaurants,
      http.get('/api/orders', () => HttpResponse.json(page([order]))),
      http.patch(`/api/orders/${order.id}/status`, async ({ request }) => {
        sent = await request.json()
        order = orderSummary({
          status: 'EM_PREPARO',
          allowedNextStatuses: ['SAIU_PARA_ENTREGA', 'CANCELADO'],
        })
        return HttpResponse.json(orderDetails(order))
      }),
    )
    const { user } = renderAt(`/pedidos?restaurante=${pizzaria.id}&visao=lista`)

    const row = await screen.findByRole('row', { name: /00C0DE11/ })
    await user.click(within(row).getByRole('button', { name: 'Iniciar preparo' }))

    expect(await within(row).findByText('Em preparo')).toBeInTheDocument()
    expect(within(row).getByRole('button', { name: 'Saiu para entrega' })).toBeInTheDocument()
    expect(sent).toEqual({ status: 'EM_PREPARO' })
  })

  it('cancels an order with the reason chosen in the dialog', async () => {
    let order = orderSummary()
    let sent: unknown = null
    server.use(
      signedInAs(ana),
      restaurants,
      http.get('/api/orders', () => HttpResponse.json(page([order]))),
      http.patch(`/api/orders/${order.id}/status`, async ({ request }) => {
        sent = await request.json()
        order = orderSummary({ status: 'CANCELADO', allowedNextStatuses: [] })
        return HttpResponse.json(orderDetails(order))
      }),
    )
    const { user } = renderAt(`/pedidos?restaurante=${pizzaria.id}&visao=lista`)

    const row = await screen.findByRole('row', { name: /00C0DE11/ })
    await user.click(within(row).getByRole('button', { name: 'Mais ações do pedido #00C0DE11' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Cancelar pedido' }))
    const dialog = await screen.findByRole('dialog', { name: 'Cancelar o pedido #00C0DE11' })
    await choose({ user, label: 'Motivo', option: 'Cliente desistiu' })
    await user.click(within(dialog).getByRole('button', { name: 'Confirmar cancelamento' }))

    expect(await within(row).findByText('Cancelado')).toBeInTheDocument()
    expect(sent).toEqual({ status: 'CANCELADO', cancellationReason: 'CLIENTE_DESISTIU' })
  })

  it('asks for a detail when the reason is "other"', async () => {
    server.use(
      signedInAs(ana),
      restaurants,
      http.get('/api/orders', () => HttpResponse.json(page([orderSummary()]))),
    )
    const { user } = renderAt(`/pedidos?restaurante=${pizzaria.id}&visao=lista`)

    const row = await screen.findByRole('row', { name: /00C0DE11/ })
    await user.click(within(row).getByRole('button', { name: 'Mais ações do pedido #00C0DE11' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Cancelar pedido' }))
    const dialog = await screen.findByRole('dialog')
    await choose({ user, label: 'Motivo', option: 'Outro motivo' })
    await user.click(within(dialog).getByRole('button', { name: 'Confirmar cancelamento' }))

    expect(
      await within(dialog).findByText('Descreva o motivo do cancelamento.'),
    ).toBeInTheDocument()
  })

  it('sends the person to login when the session ends during an action', async () => {
    const order = orderSummary()
    server.use(
      signedInAs(ana),
      restaurants,
      http.get('/api/orders', () => HttpResponse.json(page([order]))),
      http.patch(`/api/orders/${order.id}/status`, () =>
        HttpResponse.json({ detail: 'Faça login para continuar.' }, { status: 401 }),
      ),
    )
    const { user } = renderAt(`/pedidos?restaurante=${pizzaria.id}&visao=lista`)

    const row = await screen.findByRole('row', { name: /00C0DE11/ })
    await user.click(within(row).getByRole('button', { name: 'Iniciar preparo' }))

    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
  })

  it('clears the refusal message once a later move works', async () => {
    let order = orderSummary()
    let refuse = true
    server.use(
      signedInAs(ana),
      restaurants,
      http.get('/api/orders', () => HttpResponse.json(page([order]))),
      http.patch(`/api/orders/${order.id}/status`, () => {
        if (refuse) {
          refuse = false
          return HttpResponse.json({ detail: 'Tente de novo.' }, { status: 409 })
        }
        order = orderSummary({ status: 'EM_PREPARO', allowedNextStatuses: ['CANCELADO'] })
        return HttpResponse.json(orderDetails(order))
      }),
    )
    const { user } = renderAt(`/pedidos?restaurante=${pizzaria.id}&visao=lista`)

    const row = await screen.findByRole('row', { name: /00C0DE11/ })
    await user.click(within(row).getByRole('button', { name: 'Iniciar preparo' }))
    expect(await screen.findByText('Tente de novo.')).toBeInTheDocument()
    await user.click(within(row).getByRole('button', { name: 'Iniciar preparo' }))

    expect(await within(row).findByText('Em preparo')).toBeInTheDocument()
    expect(screen.queryByText('Tente de novo.')).not.toBeInTheDocument()
  })

  it('shows why the API refused a move', async () => {
    const order = orderSummary()
    server.use(
      signedInAs(ana),
      restaurants,
      http.get('/api/orders', () => HttpResponse.json(page([order]))),
      http.patch(`/api/orders/${order.id}/status`, () =>
        HttpResponse.json(
          {
            detail: 'Outra pessoa alterou este pedido agora há pouco. Recarregue e tente de novo.',
          },
          { status: 409 },
        ),
      ),
    )
    const { user } = renderAt(`/pedidos?restaurante=${pizzaria.id}&visao=lista`)

    const row = await screen.findByRole('row', { name: /00C0DE11/ })
    await user.click(within(row).getByRole('button', { name: 'Iniciar preparo' }))

    expect(
      await screen.findByText(
        'Outra pessoa alterou este pedido agora há pouco. Recarregue e tente de novo.',
      ),
    ).toBeInTheDocument()
  })
})
