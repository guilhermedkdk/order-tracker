import { screen } from '@testing-library/react'
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

const restaurants = http.get('/api/restaurants', () => HttpResponse.json([pizzaria]))

async function fillRequiredFields(user: ReturnType<typeof renderAt>['user']) {
  await user.type(await screen.findByLabelText('Nome do cliente'), 'Maria Silva')
  await user.type(screen.getByLabelText('Telefone'), '(11) 98765-4321')
  await user.type(screen.getByLabelText('CEP'), '01310-100')
  await user.type(screen.getByLabelText('Rua'), 'Av. Paulista')
  await user.type(screen.getByLabelText('Número'), '1000')
  await user.type(screen.getByLabelText('Bairro'), 'Bela Vista')
  await user.type(screen.getByLabelText('Cidade'), 'São Paulo')
  await choose({ user, label: 'UF', option: 'SP' })
  await user.type(screen.getByLabelText('Item 1'), 'Pizza margherita')
  await user.clear(screen.getByLabelText('Quantidade do item 1'))
  await user.type(screen.getByLabelText('Quantidade do item 1'), '2')
  await user.type(screen.getByLabelText('Preço do item 1'), '45,90')
  await user.type(screen.getByLabelText('Taxa de entrega'), '7,00')
}

// Filling the whole form key by key, as a person does, takes seconds in jsdom.
describe('new order', { timeout: 15_000 }, () => {
  it('registers an order, previewing the total, and goes back to the list', async () => {
    const orders: ReturnType<typeof orderSummary>[] = []
    let sent: unknown = null
    server.use(
      signedInAs(ana),
      restaurants,
      http.get('/api/orders', () => HttpResponse.json(page(orders))),
      http.post('/api/orders', async ({ request }) => {
        sent = await request.json()
        const created = orderSummary()
        orders.push(created)
        return HttpResponse.json(orderDetails(created), { status: 201 })
      }),
    )
    const { user } = renderAt(`/pedidos/novo?restaurante=${pizzaria.id}`)

    await fillRequiredFields(user)
    await choose({ user, label: 'Forma de pagamento', option: 'Pix' })

    expect(screen.getByText('R$ 98,80')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Registrar pedido' }))

    expect(await screen.findByRole('row', { name: /00C0DE11/ })).toBeInTheDocument()
    expect(sent).toEqual({
      restaurantId: pizzaria.id,
      customer: { name: 'Maria Silva', phone: '11987654321' },
      deliveryAddress: {
        cep: '01310100',
        street: 'Av. Paulista',
        number: '1000',
        complement: '',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
      },
      items: [{ name: 'Pizza margherita', quantity: 2, unitPrice: 45.9 }],
      deliveryFee: 7,
      payment: { method: 'PIX' },
      notes: '',
    })
  })

  it('shows the API message next to the nested field it is about', async () => {
    server.use(
      signedInAs(ana),
      restaurants,
      http.post('/api/orders', () =>
        HttpResponse.json(
          {
            detail: 'Confira os campos destacados.',
            errors: [
              { field: 'payment.changeFor', message: 'O troco precisa ser para R$ 98,80 ou mais.' },
            ],
          },
          { status: 400 },
        ),
      ),
    )
    const { user } = renderAt(`/pedidos/novo?restaurante=${pizzaria.id}`)

    await fillRequiredFields(user)
    await choose({ user, label: 'Forma de pagamento', option: 'Dinheiro' })
    await user.type(screen.getByLabelText('Troco para'), '50,00')
    await user.click(screen.getByRole('button', { name: 'Registrar pedido' }))

    expect(
      await screen.findByText('O troco precisa ser para R$ 98,80 ou mais.'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Troco para')).toHaveAttribute('aria-invalid', 'true')
  })

  it('sends the order to the restaurant picked in the header, even after switching', async () => {
    let sent: { restaurantId?: string } | null = null
    server.use(
      signedInAs(ana),
      http.get('/api/restaurants', () => HttpResponse.json([burger, pizzaria])),
      http.get('/api/orders', () => HttpResponse.json(page([]))),
      http.post('/api/orders', async ({ request }) => {
        sent = (await request.json()) as { restaurantId?: string }
        return HttpResponse.json(orderDetails(orderSummary()), { status: 201 })
      }),
    )
    const { user } = renderAt(`/pedidos/novo?restaurante=${pizzaria.id}`)

    await fillRequiredFields(user)
    await choose({ user, label: 'Forma de pagamento', option: 'Pix' })
    await choose({ user, label: 'Restaurante selecionado', option: 'Burger da Vila' })
    await user.click(screen.getByRole('button', { name: 'Registrar pedido' }))

    await screen.findByText('Nenhum pedido ainda.')
    expect(sent).toMatchObject({ restaurantId: burger.id })
  })

  it('names each restaurant with its owner when the admin picks one', async () => {
    server.use(
      signedInAs(admin),
      http.get('/api/restaurants', () =>
        HttpResponse.json([burger, { ...burger, id: 'outro-burger', ownerName: 'Ana Souza' }]),
      ),
    )
    const { user } = renderAt('/pedidos/novo')

    await screen.findByRole('combobox', { name: 'Restaurante' })
    await choose({ user, label: 'Restaurante', option: /Burger da Vila.*Ana Souza/ })

    expect(screen.getByRole('combobox', { name: 'Restaurante' })).toHaveTextContent(
      'Burger da Vila · Ana Souza',
    )
  })

  it('adds and removes items, updating the total', async () => {
    server.use(signedInAs(ana), restaurants)
    const { user } = renderAt(`/pedidos/novo?restaurante=${pizzaria.id}`)

    await fillRequiredFields(user)
    await user.click(screen.getByRole('button', { name: 'Adicionar item' }))
    await user.type(screen.getByLabelText('Item 2'), 'Refrigerante 2 L')
    await user.type(screen.getByLabelText('Preço do item 2'), '12,50')

    expect(screen.getByText('R$ 111,30')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Remover item 2' }))
    expect(screen.getByText('R$ 98,80')).toBeInTheDocument()
  })
})
