import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { api } from '@/lib/http'

const restaurantSchema = z.object({ id: z.string(), name: z.string(), ownerName: z.string() })

export type Restaurant = z.infer<typeof restaurantSchema>

const restaurantsQueryKey = ['restaurants'] as const

/** The restaurants the signed-in user can see, by name. */
export function useRestaurants() {
  return useQuery({
    queryKey: restaurantsQueryKey,
    queryFn: () => api({ path: '/restaurants', schema: z.array(restaurantSchema) }),
  })
}

export function useCreateRestaurant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { name: string }) =>
      api({ path: '/restaurants', method: 'POST', body: input, schema: restaurantSchema }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: restaurantsQueryKey }),
  })
}
