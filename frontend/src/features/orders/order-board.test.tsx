import { screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { ana, burger, orderDetails, orderSummary, pizzaria, signedInAs } from '@/test/fixtures'
import { renderAt } from '@/test/render'
import { server } from '@/test/server'

type Summary = ReturnType<typeof orderSummary>

// Answers like the API: the orders of the requested status, or all of them without one. `totals`
// overrides how many the API says a status has, as when it spans more than one page.
function boardApi(orders: () => Summary[], totals: Record<string, number> = {}) {
  return http.get('/api/orders', ({ request }) => {
    const status = new URL(request.url).searchParams.get('status')
    const content = orders().filter((order) => status === null || order.status === status)
    return HttpResponse.json({
      content,
      page: 0,
      size: 20,
      totalElements: (status && totals[status]) ?? content.length,
      totalPages: 1,
    })
  })
}

const restaurants = http.get('/api/restaurants', () => HttpResponse.json([burger, pizzaria]))

describe('order board', () => {
  it('opens on the board, each order in the column of its status with the column total', async () => {
    const preparing = orderSummary({
      id: '0199f0a0-0000-7000-8000-00000000beef',
      code: '0000BEEF',
      customerName: 'João Pereira',
      status: 'EM_PREPARO',
      allowedNextStatuses: ['SAIU_PARA_ENTREGA', 'CANCELADO'],
    })
    server.use(
      signedInAs(ana),
      restaurants,
      boardApi(() => [orderSummary(), preparing], { EM_PREPARO: 7 }),
    )

    renderAt(`/pedidos?restaurante=${pizzaria.id}`)

    const received = await screen.findByRole('region', { name: 'Recebido' })
    expect(
      await within(received).findByRole('article', { name: 'Pedido #00C0DE11' }),
    ).toBeInTheDocument()
    const inPreparation = screen.getByRole('region', { name: 'Em preparo' })
    expect(within(inPreparation).getByText('João Pereira')).toBeInTheDocument()
    expect(
      within(inPreparation).getByRole('heading', { name: 'Em preparo, 7 pedidos' }),
    ).toBeInTheDocument()
  })

  it('moves a card to the next column with its button', async () => {
    let order = orderSummary()
    let sent: unknown = null
    server.use(
      signedInAs(ana),
      restaurants,
      boardApi(() => [order]),
      http.patch(`/api/orders/${order.id}/status`, async ({ request }) => {
        sent = await request.json()
        order = orderSummary({
          status: 'EM_PREPARO',
          allowedNextStatuses: ['SAIU_PARA_ENTREGA', 'CANCELADO'],
        })
        return HttpResponse.json(orderDetails(order))
      }),
    )
    const { user } = renderAt(`/pedidos?restaurante=${pizzaria.id}`)

    const received = await screen.findByRole('region', { name: 'Recebido' })
    const card = await within(received).findByRole('article', { name: 'Pedido #00C0DE11' })
    await user.click(within(card).getByRole('button', { name: 'Iniciar preparo' }))

    const inPreparation = screen.getByRole('region', { name: 'Em preparo' })
    expect(
      await within(inPreparation).findByRole('article', { name: 'Pedido #00C0DE11' }),
    ).toBeInTheDocument()
    expect(within(received).queryByRole('article')).not.toBeInTheDocument()
    expect(await screen.findByText('Pedido #00C0DE11 em preparo.')).toBeInTheDocument()
    expect(sent).toEqual({ status: 'EM_PREPARO' })
  })

  it('takes a column with more orders than it shows to the list of that status', async () => {
    const delivered = orderSummary({ status: 'ENTREGUE', allowedNextStatuses: [] })
    server.use(
      signedInAs(ana),
      restaurants,
      boardApi(() => [delivered], { ENTREGUE: 32 }),
    )
    const { user, router } = renderAt(`/pedidos?restaurante=${pizzaria.id}`)

    const column = await screen.findByRole('region', { name: 'Entregue' })
    await user.click(await within(column).findByRole('link', { name: 'Ver todos os 32' }))

    expect(
      await screen.findByRole('button', { name: 'Entregue', pressed: true }),
    ).toBeInTheDocument()
    expect(screen.getByRole('row', { name: /00C0DE11/ })).toBeInTheDocument()
    const search = new URLSearchParams(router.state.location.search)
    expect(Object.fromEntries(search)).toEqual({
      restaurante: pizzaria.id,
      visao: 'lista',
      status: 'ENTREGUE',
    })
  })

  it('switches between the board and the list, keeping the choice in the URL', async () => {
    server.use(
      signedInAs(ana),
      restaurants,
      boardApi(() => [orderSummary()]),
    )
    const { user, router } = renderAt(`/pedidos?restaurante=${pizzaria.id}`)

    await user.click(await screen.findByRole('tab', { name: 'Lista' }))

    expect(await screen.findByRole('row', { name: /00C0DE11/ })).toBeInTheDocument()
    expect(router.state.location.search).toContain('visao=lista')

    await user.click(screen.getByRole('tab', { name: 'Kanban' }))

    expect(await screen.findByRole('region', { name: 'Recebido' })).toBeInTheDocument()
    expect(router.state.location.search).not.toContain('visao')
  })
})
