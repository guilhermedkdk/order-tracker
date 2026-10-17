import { z } from 'zod'

const fieldErrorSchema = z.object({ field: z.string(), message: z.string() })

const problemSchema = z.object({
  detail: z.string().optional(),
  errors: z.array(fieldErrorSchema).optional(),
})

export type FieldError = z.infer<typeof fieldErrorSchema>

/** An error answer from the API, with the per-field messages when the request was invalid. */
export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: FieldError[]

  constructor({
    status,
    message,
    fieldErrors = [],
  }: {
    status: number
    message: string
    fieldErrors?: FieldError[]
  }) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

type Method = 'GET' | 'POST' | 'PATCH'

type ApiRequest<T> = {
  path: `/${string}`
  method?: Method
  body?: unknown
  schema: z.ZodType<T>
}

const CSRF_COOKIE = 'XSRF-TOKEN'
const CSRF_HEADER = 'X-XSRF-TOKEN'
const UNREACHABLE = 'Não foi possível falar com o servidor. Tente de novo.'

/**
 * Calls the API on this same origin, which keeps the session cookie first-party, and parses the
 * answer with `schema`. Writes carry the CSRF token the API handed out in a cookie.
 */
export async function api<T>({ path, method = 'GET', body, schema }: ApiRequest<T>): Promise<T> {
  const headers = new Headers({ Accept: 'application/json' })
  if (body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }
  if (method !== 'GET') {
    const token = await csrfToken()
    if (token) {
      headers.set(CSRF_HEADER, token)
    }
  }

  let response: Response
  try {
    response = await fetch(apiUrl(path), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'same-origin',
    })
  } catch {
    throw new ApiError({ status: 0, message: UNREACHABLE })
  }

  if (!response.ok) {
    throw await toApiError(response)
  }
  const payload: unknown = response.status === 204 ? undefined : await response.json()
  return schema.parse(payload)
}

function apiUrl(path: string): URL {
  return new URL(`/api${path}`, window.location.origin)
}

async function csrfToken(): Promise<string | undefined> {
  const existing = readCookie(CSRF_COOKIE)
  if (existing) {
    return existing
  }
  // Any answer from the API sets the cookie, including a 401 from /auth/me.
  await fetch(apiUrl('/auth/me'), { credentials: 'same-origin' }).catch(() => undefined)
  return readCookie(CSRF_COOKIE)
}

function readCookie(name: string): string | undefined {
  const entry = document.cookie.split('; ').find((cookie) => cookie.startsWith(`${name}=`))
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : undefined
}

async function toApiError(response: Response): Promise<ApiError> {
  const parsed = problemSchema.safeParse(await response.json().catch(() => undefined))
  if (!parsed.success) {
    return new ApiError({ status: response.status, message: UNREACHABLE })
  }
  return new ApiError({
    status: response.status,
    message: parsed.data.detail ?? UNREACHABLE,
    fieldErrors: parsed.data.errors ?? [],
  })
}
