import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { api, ApiError } from '@/lib/http'
import type { LoginInput, SignupInput } from './schemas'

const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.enum(['ADMIN', 'DONO']),
  demo: z.boolean(),
})

export type User = z.infer<typeof userSchema>

export const meQueryKey = ['auth', 'me'] as const

/** The signed-in user, or `null` when there is no session. */
export function useMe() {
  return useQuery({
    queryKey: meQueryKey,
    queryFn: fetchMe,
    staleTime: Infinity,
    retry: false,
  })
}

/**
 * Opens the session in the cache: whatever an earlier user left there is dropped, so nothing of
 * theirs shows while the new user's data loads.
 */
export function startSession(queryClient: QueryClient, user: User): void {
  queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== meQueryKey[0] })
  queryClient.setQueryData(meQueryKey, user)
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: LoginInput) =>
      api({ path: '/auth/login', method: 'POST', body: input, schema: userSchema }),
    onSuccess: (user) => startSession(queryClient, user),
  })
}

export function useSignup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SignupInput) =>
      api({ path: '/auth/signup', method: 'POST', body: input, schema: userSchema }),
    onSuccess: (user) => startSession(queryClient, user),
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api({ path: '/auth/logout', method: 'POST', schema: z.undefined() }),
    onSuccess: () => {
      queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== meQueryKey[0] })
      queryClient.setQueryData(meQueryKey, null)
    },
  })
}

async function fetchMe(): Promise<User | null> {
  try {
    return await api({ path: '/auth/me', schema: userSchema })
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null
    }
    throw error
  }
}
