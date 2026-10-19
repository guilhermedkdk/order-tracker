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
// Their 401 is about the credentials sent, not an access token that expired.
const NO_RENEWAL = new Set(['/auth/login', '/auth/signup', '/auth/refresh', '/auth/logout'])

/**
 * Calls the API on this same origin, which keeps the session cookies first-party, and parses the
 * answer with `schema`. Writes carry the CSRF token the API handed out in a cookie. A 401 renews the
 * session once and repeats the request, so an expired access token never reaches the screen.
 */
export async function api<T>(request: ApiRequest<T>): Promise<T> {
  let response = await send(request)
  if (response.status === 401 && !NO_RENEWAL.has(request.path) && (await renewSession())) {
    response = await send(request)
  }
  if (!response.ok) {
    throw await toApiError(response)
  }
  const payload: unknown = response.status === 204 ? undefined : await response.json()
  return request.schema.parse(payload)
}

/**
 * Listens to a server-sent event stream on this origin, with the session cookies like any call. The
 * browser reconnects by itself when the connection falls, and `onReconnect` runs once it is back,
 * since events may have been missed. When the API refuses the stream, as after the access token
 * expired, the session is renewed and the stream opens again once. Returns what stops it.
 */
export function listen({
  path,
  events,
  onReconnect,
}: {
  path: `/${string}`
  events: Record<string, () => void>
  onReconnect: () => void
}): () => void {
  let source: EventSource | null = null
  let opened = false
  let renewed = false

  function connect() {
    const current = new EventSource(apiUrl(path))
    source = current
    current.addEventListener('open', () => {
      if (opened) {
        onReconnect()
      }
      opened = true
      renewed = false
    })
    for (const [type, handler] of Object.entries(events)) {
      current.addEventListener(type, handler)
    }
    current.addEventListener('error', () => {
      // A refusal after a fresh renewal is not about the session; trying again would only loop.
      if (current.readyState !== EventSource.CLOSED || source !== current || renewed) {
        return
      }
      renewed = true
      void renewSession().then((ok) => {
        if (ok && source === current) {
          connect()
        }
      })
    })
  }

  connect()
  return () => {
    source?.close()
    source = null
  }
}

let renewal: Promise<boolean> | null = null

// Requests that fail together wait for the same renewal, so the refresh token turns over once.
function renewSession(): Promise<boolean> {
  renewal ??= send({ path: '/auth/refresh', method: 'POST' })
    .then(
      (response) => response.ok,
      () => false,
    )
    .finally(() => {
      renewal = null
    })
  return renewal
}

async function send({
  path,
  method = 'GET',
  body,
}: Omit<ApiRequest<unknown>, 'schema'>): Promise<Response> {
  const headers = new Headers({ Accept: 'application/json' })
  if (body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }
  if (method !== 'GET') {
    const token = await csrfToken()
    // No token means the API never answered, as on a cold start past the proxy's limit. Sending the
    // write anyway would only earn a CSRF refusal nobody can act on.
    if (!token) {
      throw new ApiError({ status: 0, message: UNREACHABLE })
    }
    headers.set(CSRF_HEADER, token)
  }
  try {
    return await fetch(apiUrl(path), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'same-origin',
    })
  } catch {
    throw new ApiError({ status: 0, message: UNREACHABLE })
  }
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
