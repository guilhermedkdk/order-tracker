import { QueryCache, QueryClient } from '@tanstack/react-query'
import { meQueryKey } from '@/features/auth/api'
import { ApiError } from '@/lib/http'

/** One cache per app. A 401 from any query means the session ended, which sends the person to login. */
export function createQueryClient(): QueryClient {
  const queryClient: QueryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        if (error instanceof ApiError && error.status === 401) {
          queryClient.setQueryData(meQueryKey, null)
        }
      },
    }),
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
    },
  })
  return queryClient
}
