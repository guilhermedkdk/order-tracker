import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { ana, noSession, signedInAs } from '@/test/fixtures'
import { renderAt } from '@/test/render'
import { server } from '@/test/server'

const noRestaurants = http.get('/api/restaurants', () => HttpResponse.json([]))

describe('authentication', () => {
  it('sends a visitor without a session to the login screen', async () => {
    server.use(noSession)

    renderAt('/')

    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
  })

  it('keeps the person signed in when the access token expired', async () => {
    let renewed = false
    server.use(
      http.get('/api/auth/me', () =>
        renewed
          ? HttpResponse.json(ana)
          : HttpResponse.json({ detail: 'Faça login para continuar.' }, { status: 401 }),
      ),
      http.post('/api/auth/refresh', () => {
        renewed = true
        return new HttpResponse(null, { status: 204 })
      }),
      noRestaurants,
    )

    renderAt('/')

    expect(
      await screen.findByRole('heading', { name: 'Crie seu primeiro restaurante' }),
    ).toBeInTheDocument()
  })

  it('offers to try again when the server does not answer', async () => {
    let up = false
    server.use(
      http.get('/api/auth/me', () => (up ? HttpResponse.json(ana) : HttpResponse.error())),
      noRestaurants,
    )
    const { user } = renderAt('/')

    expect(
      await screen.findByRole('heading', { name: 'Não conseguimos falar com o servidor' }),
    ).toBeInTheDocument()
    up = true
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }))

    expect(
      await screen.findByRole('heading', { name: 'Crie seu primeiro restaurante' }),
    ).toBeInTheDocument()
  })

  it('logs in and lands inside the app', async () => {
    server.use(
      noSession,
      noRestaurants,
      http.post('/api/auth/login', () => HttpResponse.json(ana)),
    )
    const { user } = renderAt('/')

    await user.type(await screen.findByLabelText('E-mail'), 'ana@example.com')
    await user.type(screen.getByLabelText('Senha'), 'segredo123')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(
      await screen.findByRole('heading', { name: 'Crie seu primeiro restaurante' }),
    ).toBeInTheDocument()
  })

  it('shows why the login failed', async () => {
    server.use(
      noSession,
      http.post('/api/auth/login', () =>
        HttpResponse.json({ detail: 'E-mail ou senha inválidos.' }, { status: 401 }),
      ),
    )
    const { user } = renderAt('/entrar')

    await user.type(await screen.findByLabelText('E-mail'), 'ana@example.com')
    await user.type(screen.getByLabelText('Senha'), 'errada')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('E-mail ou senha inválidos.')).toBeInTheDocument()
  })

  it('puts the API field error next to its field on signup', async () => {
    server.use(
      noSession,
      http.post('/api/auth/signup', () =>
        HttpResponse.json(
          {
            detail: 'Confira os campos destacados.',
            errors: [{ field: 'password', message: 'A senha é longa demais.' }],
          },
          { status: 400 },
        ),
      ),
    )
    const { user } = renderAt('/cadastro')

    await user.type(await screen.findByLabelText('Nome'), 'Ana Souza')
    await user.type(screen.getByLabelText('E-mail'), 'ana@example.com')
    await user.type(screen.getByLabelText('Senha'), 'é'.repeat(40))
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByText('A senha é longa demais.')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha')).toHaveAttribute('aria-invalid', 'true')
  })

  it('logs out back to the login screen', async () => {
    server.use(
      signedInAs(ana),
      noRestaurants,
      http.post('/api/auth/logout', () => new HttpResponse(null, { status: 204 })),
    )
    const { user } = renderAt('/')

    await user.click(await screen.findByRole('button', { name: 'Ana Souza' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Sair' }))

    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
  })

  it('stays signed in and says why when signing out fails', async () => {
    server.use(
      signedInAs(ana),
      noRestaurants,
      http.post('/api/auth/logout', () => HttpResponse.error()),
    )
    const { user } = renderAt('/')

    await user.click(await screen.findByRole('button', { name: 'Ana Souza' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Sair' }))

    expect(
      await screen.findByText('Não foi possível falar com o servidor. Tente de novo.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ana Souza' })).toBeInTheDocument()
  })
})
