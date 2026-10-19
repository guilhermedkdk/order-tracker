import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { server } from '@/test/server'
import { api, ApiError } from './http'

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

  it('rejects an answer that does not match the expected shape', async () => {
    server.use(http.get('/api/things', () => HttpResponse.json({ unexpected: true })))

    const failure = api({ path: '/things', schema: z.object({ name: z.string() }) })

    await expect(failure).rejects.toThrow(z.ZodError)
  })
})
