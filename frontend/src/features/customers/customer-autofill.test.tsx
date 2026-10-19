import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { ana, pizzaria, signedInAs } from '@/test/fixtures'
import { renderAt } from '@/test/render'
import { server } from '@/test/server'

const maria = {
  name: 'Maria Silva',
  phone: '11987654321',
  lastAddress: {
    cep: '01310100',
    street: 'Av. Paulista',
    number: '1000',
    complement: 'ap 12',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
  },
}

function setup(customers: Record<string, typeof maria>) {
  server.use(
    signedInAs(ana),
    http.get('/api/restaurants', () => HttpResponse.json([pizzaria])),
    http.get('/api/customers', ({ request }) => {
      const params = new URL(request.url).searchParams
      const found =
        params.get('restaurantId') === pizzaria.id && customers[params.get('phone') ?? '']
      return found
        ? HttpResponse.json(found)
        : HttpResponse.json({ detail: 'Cliente não encontrado.' }, { status: 404 })
    }),
  )
  return renderAt(`/pedidos/novo?restaurante=${pizzaria.id}`)
}

describe('customer autofill', () => {
  it('fills the name and the last address from a known phone', async () => {
    const { user } = setup({ '11987654321': maria })

    await user.type(await screen.findByLabelText('Telefone'), '(11) 98765-4321')

    expect(await screen.findByDisplayValue('Maria Silva')).toBeInTheDocument()
    expect(screen.getByLabelText('Rua')).toHaveValue('Av. Paulista')
    expect(screen.getByLabelText('Complemento')).toHaveValue('ap 12')
    expect(screen.getByRole('combobox', { name: 'UF' })).toHaveTextContent('SP')
    expect(screen.getByText(/Cliente encontrado/)).toBeInTheDocument()
  })

  it('keeps what was already typed', async () => {
    const { user } = setup({ '11987654321': maria })

    await user.type(await screen.findByLabelText('Nome do cliente'), 'Mariana')
    await user.type(screen.getByLabelText('Telefone'), '11987654321')

    expect(await screen.findByDisplayValue('Av. Paulista')).toBeInTheDocument()
    expect(screen.getByLabelText('Nome do cliente')).toHaveValue('Mariana')
  })

  it('fills nothing for a phone the restaurant does not know', async () => {
    const { user } = setup({})

    await user.type(await screen.findByLabelText('Telefone'), '11911112222')

    expect(await screen.findByText('Cliente novo neste restaurante.')).toBeInTheDocument()
    expect(screen.getByLabelText('Rua')).toHaveValue('')
  })
})
