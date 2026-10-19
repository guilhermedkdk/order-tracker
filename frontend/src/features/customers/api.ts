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

/** Every customer lookup in the cache. A new order changes what they answer. */
export const customersKey = ['customers'] as const

/**
 * The restaurant's customer with this phone, `null` when there is none. Waits for a full number: 11
 * digits for a mobile, which starts with 9 after the area code, and 10 for a landline.
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
    queryKey: [...customersKey, restaurantId, digits],
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
    enabled: restaurantId !== '' && /^(\d{2}9\d{8}|\d{2}[2-8]\d{7})$/.test(digits),
    staleTime: 60_000,
  })
}
