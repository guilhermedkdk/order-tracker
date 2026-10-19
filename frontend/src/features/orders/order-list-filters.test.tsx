import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { ana, burger, orderSummary, pizzaria, signedInAs } from '@/test/fixtures'
import { renderAt } from '@/test/render'
import { choose } from '@/test/select'
import { server } from '@/test/server'

type Requested = { status: string | null; page: string | null; restaurantId: string | null }

// Answers 45 orders in pages of 20 and records what each request asked for.
function ordersApi(requests: Requested[]) {
  return http.get('/api/orders', ({ request }) => {
    const params = new URL(request.url).searchParams
    const page = Number(params.get('page') ?? 0)
    requests.push({
      status: params.get('status'),
      page: params.get('page'),
      restaurantId: params.get('restaurantId'),
    })
    return HttpResponse.json({
      content: [orderSummary({ code: `PAGINA${page + 1}0` })],
      page,
      size: 20,
      totalElements: 45,
      totalPages: 3,
    })
  })
}

const setup = (requests: Requested[]) =>
  server.use(
    signedInAs(ana),
    http.get('/api/restaurants', () => HttpResponse.json([burger, pizzaria])),
    ordersApi(requests),
  )

describe('order list filters', () => {
  it('filters by status from the status chips', async () => {
    const requests: Requested[] = []
    setup(requests)
    const { user, router } = renderAt(`/pedidos?restaurante=${pizzaria.id}`)

    await user.click(await screen.findByRole('button', { name: 'Em preparo' }))

    expect(
      await screen.findByRole('button', { name: 'Em preparo', pressed: true }),
    ).toBeInTheDocument()
    expect(requests.at(-1)).toEqual({ status: 'EM_PREPARO', page: '0', restaurantId: pizzaria.id })
    expect(router.state.location.search).toContain('status=EM_PREPARO')
  })

  it('pages through the list and stops at the last page', async () => {
    const requests: Requested[] = []
    setup(requests)
    const { user } = renderAt(`/pedidos?restaurante=${pizzaria.id}`)

    expect(await screen.findByText('Página 1 de 3 · 45 pedidos')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Próxima' }))
    await user.click(await screen.findByRole('button', { name: 'Próxima' }))

    expect(await screen.findByText('Página 3 de 3 · 45 pedidos')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Próxima' })).toBeDisabled()
    expect(requests.at(-1)?.page).toBe('2')
  })

  it('goes back to the first page when the status or the restaurant changes', async () => {
    const requests: Requested[] = []
    setup(requests)
    const { user } = renderAt(`/pedidos?restaurante=${pizzaria.id}&pagina=3`)

    expect(await screen.findByText('Página 3 de 3 · 45 pedidos')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Entregue' }))
    expect(await screen.findByText('Página 1 de 3 · 45 pedidos')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Próxima' }))
    await screen.findByText('Página 2 de 3 · 45 pedidos')
    await choose({ user, label: 'Restaurante', option: 'Burger da Vila' })

    expect(await screen.findByText('Página 1 de 3 · 45 pedidos')).toBeInTheDocument()
    expect(requests.at(-1)).toEqual({ status: 'ENTREGUE', page: '0', restaurantId: burger.id })
  })
})
