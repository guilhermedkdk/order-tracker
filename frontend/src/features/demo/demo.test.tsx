import { screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { admin, ana, noSession, page, pizzaria, signedInAs } from '@/test/fixtures'
import { renderAt } from '@/test/render'
import { server } from '@/test/server'

const rafael = { ...ana, name: 'Rafael Costa', email: 'rafael@example.com', demo: true }
const demoAdmin = { ...admin, email: 'admin@example.com', demo: true }
const appData = [
  http.get('/api/restaurants', () => HttpResponse.json([pizzaria])),
  http.get('/api/orders', () => HttpResponse.json(page([]))),
]

describe('demo', () => {
  it('logs in as the demo owner with one click', async () => {
    let sent: unknown = null
    server.use(
      noSession,
      ...appData,
      http.post('/api/auth/login', async ({ request }) => {
        sent = await request.json()
        return HttpResponse.json(rafael)
      }),
    )
    const { user } = renderAt('/entrar')

    await user.click(await screen.findByRole('button', { name: 'Entrar como dono' }))

    expect(
      await screen.findByRole('heading', { name: 'Pedidos de Pizzaria Bella' }),
    ).toBeInTheDocument()
    expect(sent).toEqual({ email: 'rafael@example.com', password: 'demo1234' })
    expect(screen.getByText('Conta demo')).toBeInTheDocument()
  })

  it('lets the admin restore the demo after confirming', async () => {
    let restored = false
    server.use(
      signedInAs(demoAdmin),
      ...appData,
      http.post('/api/demo/restore', () => {
        restored = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { user } = renderAt('/pedidos')

    await user.click(await screen.findByRole('button', { name: 'Suporte' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Restaurar demonstração' }))
    const dialog = await screen.findByRole('dialog', { name: 'Restaurar a demonstração?' })
    await user.click(within(dialog).getByRole('button', { name: 'Restaurar' }))

    expect(await screen.findByText('Demonstração restaurada.')).toBeInTheDocument()
    expect(restored).toBe(true)
  })

  it('does not offer the restore to owners', async () => {
    server.use(signedInAs(rafael), ...appData)

    const { user } = renderAt('/pedidos')

    await user.click(await screen.findByRole('button', { name: 'Rafael Costa' }))

    expect(await screen.findByRole('menuitem', { name: 'Sair' })).toBeInTheDocument()
    expect(
      screen.queryByRole('menuitem', { name: 'Restaurar demonstração' }),
    ).not.toBeInTheDocument()
  })
})
