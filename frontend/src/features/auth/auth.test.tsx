import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { renderAt } from '@/test/render'
import { server } from '@/test/server'

const ana = {
  id: '0199f0a0-0000-7000-8000-000000000001',
  name: 'Ana Souza',
  email: 'ana@example.com',
  role: 'DONO',
  demo: false,
}

const noSession = http.get('/api/auth/me', () =>
  HttpResponse.json({ detail: 'Faça login para continuar.' }, { status: 401 }),
)

describe('authentication', () => {
  it('sends a visitor without a session to the login screen', async () => {
    server.use(noSession)

    renderAt('/')

    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
  })

  it('logs in and lands on the home screen', async () => {
    server.use(
      noSession,
      http.post('/api/auth/login', () => HttpResponse.json(ana)),
    )
    const { user } = renderAt('/')

    await user.type(await screen.findByLabelText('E-mail'), 'ana@example.com')
    await user.type(screen.getByLabelText('Senha'), 'segredo123')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('heading', { name: 'Olá, Ana Souza' })).toBeInTheDocument()
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
      http.get('/api/auth/me', () => HttpResponse.json(ana)),
      http.post('/api/auth/logout', () => new HttpResponse(null, { status: 204 })),
    )
    const { user } = renderAt('/')

    await user.click(await screen.findByRole('button', { name: 'Sair' }))

    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
  })
})
