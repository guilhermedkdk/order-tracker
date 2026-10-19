import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { openStream, openStreamCount } from '@/test/event-source'
import { server } from '@/test/server'
import { api, ApiError, listen } from './http'

describe('api', () => {
  it('echoes the CSRF cookie in the header of every write', async () => {
    document.cookie = 'XSRF-TOKEN=token-123'
    let received: string | null = null
    server.use(
      http.post('/api/things', ({ request }) => {
        received = request.headers.get('X-XSRF-TOKEN')
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await api({ path: '/things', method: 'POST', body: {}, schema: z.undefined() })

    expect(received).toBe('token-123')
  })

  it('does not send a write without the CSRF token, and says the server did not answer', async () => {
    document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    let sent = false
    server.use(
      // As when the API takes too long to wake and the proxy gives up: no cookie comes back.
      http.get('/api/auth/me', () => new HttpResponse(null, { status: 504 })),
      http.post('/api/things', () => {
        sent = true
        return new HttpResponse(null, { status: 204 })
      }),
    )

    const failure = api({ path: '/things', method: 'POST', body: {}, schema: z.undefined() })

    await expect(failure).rejects.toEqual(
      new ApiError({ status: 0, message: 'Não foi possível falar com o servidor. Tente de novo.' }),
    )
    expect(sent).toBe(false)
  })

  it('turns Problem Details into an ApiError with the field messages', async () => {
    server.use(
      http.post('/api/things', () =>
        HttpResponse.json(
          {
            detail: 'Confira os campos destacados.',
            errors: [{ field: 'name', message: 'Informe o nome.' }],
          },
          { status: 400 },
        ),
      ),
    )
    document.cookie = 'XSRF-TOKEN=token-123'

    const failure = api({ path: '/things', method: 'POST', body: {}, schema: z.undefined() })

    await expect(failure).rejects.toEqual(
      new ApiError({
        status: 400,
        message: 'Confira os campos destacados.',
        fieldErrors: [{ field: 'name', message: 'Informe o nome.' }],
      }),
    )
  })

  it('renews an expired session once and repeats every request that failed', async () => {
    document.cookie = 'XSRF-TOKEN=token-123'
    let renewals = 0
    server.use(
      http.post('/api/auth/refresh', () => {
        renewals += 1
        return new HttpResponse(null, { status: 204 })
      }),
      http.get('/api/things', () =>
        renewals > 0
          ? HttpResponse.json({ name: 'coisa' })
          : HttpResponse.json({ detail: 'Faça login para continuar.' }, { status: 401 }),
      ),
    )
    const schema = z.object({ name: z.string() })

    const answers = await Promise.all([
      api({ path: '/things', schema }),
      api({ path: '/things', schema }),
    ])

    expect(answers).toEqual([{ name: 'coisa' }, { name: 'coisa' }])
    expect(renewals).toBe(1)
  })

  it('answers the 401 when the session cannot be renewed', async () => {
    document.cookie = 'XSRF-TOKEN=token-123'
    server.use(
      http.get('/api/things', () =>
        HttpResponse.json({ detail: 'Faça login para continuar.' }, { status: 401 }),
      ),
    )

    const failure = api({ path: '/things', schema: z.undefined() })

    await expect(failure).rejects.toMatchObject({ status: 401 })
  })

  it('renews the session when the API refuses a stream, and opens the stream again', async () => {
    document.cookie = 'XSRF-TOKEN=token-123'
    let renewals = 0
    server.use(
      http.post('/api/auth/refresh', () => {
        renewals += 1
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const stop = listen({ path: '/things/stream', events: {}, onReconnect: () => {} })
    const refused = openStream('/things/stream')

    refused.refuse()

    await vi.waitFor(() => expect(openStreamCount()).toBe(1))
    expect(openStream('/things/stream')).not.toBe(refused)
    expect(renewals).toBe(1)
    stop()
  })

  it('rejects an answer that does not match the expected shape', async () => {
    server.use(http.get('/api/things', () => HttpResponse.json({ unexpected: true })))

    const failure = api({ path: '/things', schema: z.object({ name: z.string() }) })

    await expect(failure).rejects.toThrow(z.ZodError)
  })
})
