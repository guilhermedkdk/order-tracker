import { toast } from 'sonner'
import { ApiError } from '@/lib/http'
import { useChangeStatus, type OrderActionTarget, type OrderStatus } from './api'
import { STATUS_LABEL } from './labels'

// One toast per order: the next outcome replaces a refusal instead of piling up under it.
const toastId = (order: OrderActionTarget) => `order-move-${order.id}`

/** Says in a toast that the order reached `status`: "Pedido #A1B2C3D4 em preparo." */
export function announceMove({
  order,
  status,
}: {
  order: OrderActionTarget
  status: OrderStatus
}): void {
  toast.success(`Pedido #${order.code} ${STATUS_LABEL[status].toLowerCase()}.`, {
    id: toastId(order),
  })
}

/**
 * Moves an order forward to a status that needs nothing else, telling how it went in a toast.
 * The promise always resolves; a refusal is shown, not thrown.
 */
export function useMoveOrder(): {
  move: (input: { order: OrderActionTarget; status: OrderStatus }) => Promise<void>
  isPending: boolean
} {
  const change = useChangeStatus()

  async function move({ order, status }: { order: OrderActionTarget; status: OrderStatus }) {
    try {
      await change.mutateAsync({ orderId: order.id, status })
      announceMove({ order, status })
    } catch (error) {
      // A 401 already sends the person to login; a toast on top would only add noise.
      if (error instanceof ApiError && error.status === 401) {
        return
      }
      toast.error(error instanceof ApiError ? error.message : 'Algo deu errado.', {
        id: toastId(order),
      })
    }
  }

  return { move, isPending: change.isPending }
}
