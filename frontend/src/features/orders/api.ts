import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { api } from '@/lib/http'
import type { NewOrderBody } from './order-form'

export const orderStatusSchema = z.enum([
  'RECEBIDO',
  'EM_PREPARO',
  'SAIU_PARA_ENTREGA',
  'ENTREGUE',
  'CANCELADO',
])

export const cancellationReasonSchema = z.enum([
  'CLIENTE_DESISTIU',
  'CLIENTE_NAO_ENCONTRADO',
  'ITEM_INDISPONIVEL',
  'FORA_DA_AREA_DE_ENTREGA',
  'PROBLEMA_NO_PAGAMENTO',
  'OUTRO',
])

export const paymentMethodSchema = z.enum(['PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'DINHEIRO'])

export type OrderStatus = z.infer<typeof orderStatusSchema>
export type CancellationReason = z.infer<typeof cancellationReasonSchema>
export type PaymentMethod = z.infer<typeof paymentMethodSchema>

const orderSummarySchema = z.object({
  id: z.string(),
  code: z.string(),
  restaurantId: z.string(),
  restaurantName: z.string(),
  status: orderStatusSchema,
  allowedNextStatuses: z.array(orderStatusSchema),
  customerName: z.string(),
  neighborhood: z.string(),
  total: z.number(),
  createdAt: z.string(),
})

const orderPageSchema = z.object({
  content: z.array(orderSummarySchema),
  page: z.number(),
  size: z.number(),
  totalElements: z.number(),
  totalPages: z.number(),
})

const orderSchema = orderSummarySchema.omit({ customerName: true, neighborhood: true }).extend({
  customer: z.object({ name: z.string(), phone: z.string() }),
  deliveryAddress: z.object({
    cep: z.string(),
    street: z.string(),
    number: z.string(),
    complement: z.string().nullable(),
    neighborhood: z.string(),
    city: z.string(),
    state: z.string(),
  }),
  items: z.array(z.object({ name: z.string(), quantity: z.number(), unitPrice: z.number() })),
  subtotal: z.number(),
  deliveryFee: z.number(),
  payment: z.object({ method: paymentMethodSchema, changeFor: z.number().nullable() }),
  notes: z.string().nullable(),
})

export type OrderSummary = z.infer<typeof orderSummarySchema>

const ordersKey = ['orders'] as const

/** The newest orders of one restaurant, or of every visible one when `restaurantId` is absent. */
export function useOrders({ restaurantId }: { restaurantId?: string }) {
  return useQuery({
    queryKey: [...ordersKey, 'list', { restaurantId }],
    queryFn: () => {
      const search = restaurantId ? `?restaurantId=${encodeURIComponent(restaurantId)}` : ''
      return api({ path: `/orders${search}`, schema: orderPageSchema })
    },
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: NewOrderBody) =>
      api({ path: '/orders', method: 'POST', body, schema: orderSchema }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ordersKey }),
  })
}

export type StatusChangeInput = {
  orderId: string
  status: OrderStatus
  cancellationReason?: CancellationReason
  cancellationDetail?: string
}

export function useChangeStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ orderId, ...body }: StatusChangeInput) =>
      api({ path: `/orders/${orderId}/status`, method: 'PATCH', body, schema: orderSchema }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ordersKey }),
  })
}
