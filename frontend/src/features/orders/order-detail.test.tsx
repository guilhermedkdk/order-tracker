import { screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { ana, orderDetails, orderSummary, page, pizzaria, signedInAs } from '@/test/fixtures'
import { renderAt } from '@/test/render'
import { server } from '@/test/server'

const restaurants = http.get('/api/restaurants', () => HttpResponse.json([pizzaria]))
const received = {
  status: 'RECEBIDO',
  changedAt: '2026-10-17T18:00:00Z',
  authorId: ana.id,
  authorName: 'Ana Souza',
  cancellationReason: null,
  cancellationDetail: null,
}

function detailsAt(path: string) {
  return `/pedidos/${orderSummary().id}${path}`
}

describe('order detail', () => {
  it('shows items, totals, the change to bring and the status timeline', async () => {
    const cancelled = {
      ...orderDetails(orderSummary({ status: 'CANCELADO', allowedNextStatuses: [] })),
      payment: { method: 'DINHEIRO', changeFor: 100 },
      statusHistory: [
        received,
        { ...received, status: 'EM_PREPARO', changedAt: '2026-10-17T18:08:00Z' },
        {
          ...received,
          status: 'CANCELADO',
          changedAt: '2026-10-17T18:15:00Z',
          cancellationReason: 'ITEM_INDISPONIVEL',
          cancellationDetail: 'Acabou a mussarela',
        },
      ],
    }
    server.use(
      signedInAs(ana),
      restaurants,
      http.get(`/api/orders/${cancelled.id}`, () => HttpResponse.json(cancelled)),
    )

    renderAt(detailsAt(''))

    expect(await screen.findByRole('heading', { name: 'Pedido #00C0DE11' })).toBeInTheDocument()
    expect(screen.getByText('Pizza margherita')).toBeInTheDocument()
    expect(screen.getByText('(11) 98765-4321')).toBeInTheDocument()
    expect(screen.getByText('Troco para R$ 100,00 (levar R$ 1,20)')).toBeInTheDocument()
    const timeline = screen.getByRole('list', { name: 'Linha do tempo' })
    const steps = within(timeline).getAllByRole('listitem')
    expect(steps).toHaveLength(3)
    expect(steps[0]).toHaveTextContent('Recebido')
    expect(steps[0]).toHaveTextContent('17/10, 15:00')
    expect(steps[0]).toHaveTextContent('Ana Souza')
    expect(steps[2]).toHaveTextContent('Item indisponível: Acabou a mussarela')
  })

  it('moves the order forward from the detail page', async () => {
    let order = { ...orderDetails(orderSummary()), statusHistory: [received] }
    server.use(
      signedInAs(ana),
      restaurants,
      http.get(`/api/orders/${order.id}`, () => HttpResponse.json(order)),
      http.patch(`/api/orders/${order.id}/status`, () => {
        order = {
          ...orderDetails(
            orderSummary({ status: 'EM_PREPARO', allowedNextStatuses: ['SAIU_PARA_ENTREGA'] }),
          ),
          statusHistory: [received, { ...received, status: 'EM_PREPARO' }],
        }
        return HttpResponse.json(order)
      }),
    )
    const { user } = renderAt(detailsAt(''))

    await user.click(await screen.findByRole('button', { name: 'Iniciar preparo' }))

    const timeline = screen.getByRole('list', { name: 'Linha do tempo' })
    expect(await within(timeline).findByText('Em preparo')).toBeInTheDocument()
  })

  it('opens from the order code in the list', async () => {
    const order = { ...orderDetails(orderSummary()), statusHistory: [received] }
    server.use(
      signedInAs(ana),
      restaurants,
      http.get('/api/orders', () => HttpResponse.json(page([orderSummary()]))),
      http.get(`/api/orders/${order.id}`, () => HttpResponse.json(order)),
    )
    const { user } = renderAt(`/pedidos?restaurante=${pizzaria.id}`)

    await user.click(await screen.findByRole('link', { name: '#00C0DE11' }))

    expect(await screen.findByRole('heading', { name: 'Pedido #00C0DE11' })).toBeInTheDocument()
  })
})
