import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { meQueryKey } from '@/features/auth/api'
import { ApiError } from '@/lib/http'

/** One cache per app. A 401 from any query or mutation means the session ended, which sends the person to login. */
export function createQueryClient(): QueryClient {
  const endSessionOn401 = (error: Error) => {
    if (error instanceof ApiError && error.status === 401) {
      queryClient.setQueryData(meQueryKey, null)
    }
  }
  const queryClient: QueryClient = new QueryClient({
    queryCache: new QueryCache({ onError: endSessionOn401 }),
    mutationCache: new MutationCache({ onError: endSessionOn401 }),
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
    },
  })
  return queryClient
}
