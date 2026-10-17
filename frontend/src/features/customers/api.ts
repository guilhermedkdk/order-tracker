import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { api, ApiError } from '@/lib/http'

const customerSchema = z.object({
  name: z.string(),
  phone: z.string(),
  lastAddress: z.object({
    cep: z.string(),
    street: z.string(),
    number: z.string(),
    complement: z.string().nullable(),
    neighborhood: z.string(),
    city: z.string(),
    state: z.string(),
  }),
})

export type KnownCustomer = z.infer<typeof customerSchema>

/**
 * The restaurant's customer with this phone, `null` when there is none. Waits until the phone has
 * the 10 or 11 digits of a full number.
 */
export function useCustomerLookup({
  restaurantId,
  phone,
}: {
  restaurantId: string
  phone: string
}) {
  const digits = phone.replace(/\D/g, '')
  return useQuery({
    queryKey: ['customers', restaurantId, digits],
    queryFn: async (): Promise<KnownCustomer | null> => {
      const search = new URLSearchParams({ restaurantId, phone: digits })
      try {
        return await api({ path: `/customers?${search.toString()}`, schema: customerSchema })
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          return null
        }
        throw error
      }
    },
    enabled: restaurantId !== '' && /^\d{10,11}$/.test(digits),
    staleTime: 60_000,
  })
}
