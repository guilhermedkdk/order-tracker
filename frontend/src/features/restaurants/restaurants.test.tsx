import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { admin, ana, signedInAs } from '@/test/fixtures'
import { renderAt } from '@/test/render'
import { choose } from '@/test/select'
import { server } from '@/test/server'

const burger = {
  id: '0199f0a0-0000-7000-8000-0000000000b2',
  name: 'Burger da Vila',
  ownerName: 'Bruno Lima',
}
const pizzaria = {
  id: '0199f0a0-0000-7000-8000-0000000000a1',
  name: 'Pizzaria Bella',
  ownerName: 'Ana Souza',
}

describe('restaurants', () => {
  it('asks a new owner for the first restaurant and then shows it', async () => {
    const restaurants: (typeof pizzaria)[] = []
    server.use(
      signedInAs(ana),
      http.get('/api/restaurants', () => HttpResponse.json(restaurants)),
      http.post('/api/restaurants', () => {
        restaurants.push(pizzaria)
        return HttpResponse.json(pizzaria, { status: 201 })
      }),
    )
    const { user } = renderAt('/')

    expect(
      await screen.findByRole('heading', { name: 'Crie seu primeiro restaurante' }),
    ).toBeInTheDocument()
    await user.type(screen.getByLabelText('Nome do restaurante'), 'Pizzaria Bella')
    await user.click(screen.getByRole('button', { name: 'Criar restaurante' }))

    expect(
      await screen.findByRole('heading', { name: 'Pedidos de Pizzaria Bella' }),
    ).toBeInTheDocument()
  })

  it('lets an owner switch between their restaurants', async () => {
    server.use(
      signedInAs(ana),
      http.get('/api/restaurants', () => HttpResponse.json([burger, pizzaria])),
    )
    const { user } = renderAt('/')

    expect(
      await screen.findByRole('heading', { name: 'Pedidos de Burger da Vila' }),
    ).toBeInTheDocument()
    await choose({ user, label: 'Restaurante selecionado', option: 'Pizzaria Bella' })

    expect(
      await screen.findByRole('heading', { name: 'Pedidos de Pizzaria Bella' }),
    ).toBeInTheDocument()
  })

  it('starts the admin on every restaurant, with each owner named', async () => {
    server.use(
      signedInAs(admin),
      http.get('/api/restaurants', () => HttpResponse.json([burger, pizzaria])),
    )
    const { user } = renderAt('/')

    expect(
      await screen.findByRole('heading', { name: 'Pedidos de todos os restaurantes' }),
    ).toBeInTheDocument()
    await choose({ user, label: 'Restaurante selecionado', option: /Pizzaria Bella.*Ana Souza/ })

    expect(
      await screen.findByRole('heading', { name: 'Pedidos de Pizzaria Bella' }),
    ).toBeInTheDocument()
  })
})
