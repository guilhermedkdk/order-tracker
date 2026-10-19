import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { ana, pizzaria, signedInAs } from '@/test/fixtures'
import { renderAt } from '@/test/render'
import { server } from '@/test/server'

const VIACEP = 'https://viacep.com.br/ws/:cep/json/'

const paulista = {
  cep: '01310-100',
  logradouro: 'Avenida Paulista',
  complemento: 'de 612 a 1510 - lado par',
  bairro: 'Bela Vista',
  localidade: 'São Paulo',
  uf: 'SP',
}

function setup(...handlers: Parameters<typeof server.use>) {
  server.use(
    signedInAs(ana),
    http.get('/api/restaurants', () => HttpResponse.json([pizzaria])),
    ...handlers,
  )
  return renderAt(`/pedidos/novo?restaurante=${pizzaria.id}`)
}

describe('CEP autofill', () => {
  it('fills street, neighborhood, city and UF from the CEP', async () => {
    const { user } = setup(
      http.get(VIACEP, ({ params }) =>
        params.cep === '01310100'
          ? HttpResponse.json(paulista)
          : HttpResponse.json({ erro: 'true' }),
      ),
    )

    await user.type(await screen.findByLabelText('CEP'), '01310-100')

    expect(await screen.findByDisplayValue('Avenida Paulista')).toBeInTheDocument()
    expect(screen.getByLabelText('Bairro')).toHaveValue('Bela Vista')
    expect(screen.getByLabelText('Cidade')).toHaveValue('São Paulo')
    expect(screen.getByRole('combobox', { name: 'UF' })).toHaveTextContent('SP')
    expect(screen.getByLabelText('Complemento')).toHaveValue('')
  })

  it('keeps a street typed while the CEP was loading', async () => {
    let answer: () => void = () => {}
    const { user } = setup(
      http.get(
        VIACEP,
        () =>
          new Promise<Response>((resolve) => (answer = () => resolve(HttpResponse.json(paulista)))),
      ),
    )

    await user.type(await screen.findByLabelText('CEP'), '01310100')
    await user.type(screen.getByLabelText('Rua'), 'Alameda Santos')
    answer()

    expect(await screen.findByDisplayValue('Bela Vista')).toBeInTheDocument()
    expect(screen.getByLabelText('Rua')).toHaveValue('Alameda Santos')
  })

  it('says when the CEP does not exist and leaves the address alone', async () => {
    const { user } = setup(http.get(VIACEP, () => HttpResponse.json({ erro: 'true' })))

    await user.type(await screen.findByLabelText('CEP'), '99999999')

    expect(await screen.findByText('CEP não encontrado. Preencha o endereço.')).toBeInTheDocument()
    expect(screen.getByLabelText('Rua')).toHaveValue('')
  })

  it('lets the person go on when ViaCEP is unreachable', async () => {
    const { user } = setup(http.get(VIACEP, () => HttpResponse.error()))

    await user.type(await screen.findByLabelText('CEP'), '01310100')

    expect(
      await screen.findByText('Não foi possível consultar o CEP. Preencha o endereço.'),
    ).toBeInTheDocument()
  })

  it('replaces an address from the customer base when a new CEP is typed', async () => {
    const { user } = setup(
      http.get(VIACEP, ({ params }) =>
        params.cep === '22041001'
          ? HttpResponse.json({
              cep: '22041-001',
              logradouro: 'Avenida Atlântica',
              bairro: 'Copacabana',
              localidade: 'Rio de Janeiro',
              uf: 'RJ',
            })
          : HttpResponse.json({ erro: 'true' }),
      ),
      http.get('/api/customers', () =>
        HttpResponse.json({
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
        }),
      ),
    )

    await user.type(await screen.findByLabelText('Telefone'), '11987654321')
    await screen.findByDisplayValue('Av. Paulista')
    await user.clear(screen.getByLabelText('CEP'))
    await user.type(screen.getByLabelText('CEP'), '22041-001')

    expect(await screen.findByDisplayValue('Avenida Atlântica')).toBeInTheDocument()
    expect(screen.getByLabelText('Bairro')).toHaveValue('Copacabana')
    expect(screen.getByLabelText('Cidade')).toHaveValue('Rio de Janeiro')
    expect(screen.getByRole('combobox', { name: 'UF' })).toHaveTextContent('RJ')
    // The number and complement were of the old address.
    expect(screen.getByLabelText('Número')).toHaveValue('')
    expect(screen.getByLabelText('Complemento')).toHaveValue('')
  })

  it('does not look the CEP up when the customer base fills it', async () => {
    let viaCepCalls = 0
    const { user } = setup(
      http.get(VIACEP, () => {
        viaCepCalls += 1
        return HttpResponse.json(paulista)
      }),
      http.get('/api/customers', () =>
        HttpResponse.json({
          name: 'Maria Silva',
          phone: '11987654321',
          lastAddress: {
            cep: '01310100',
            street: 'Av. Paulista',
            number: '1000',
            complement: null,
            neighborhood: 'Bela Vista',
            city: 'São Paulo',
            state: 'SP',
          },
        }),
      ),
    )

    await user.type(await screen.findByLabelText('Telefone'), '11987654321')

    expect(await screen.findByDisplayValue('Av. Paulista')).toBeInTheDocument()
    expect(viaCepCalls).toBe(0)
  })
})
