import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/http'
import { useChangeStatus, type OrderSummary } from './api'
import { CancelOrderDialog } from './CancelOrderDialog'
import { ACTION_LABEL } from './labels'

/**
 * One button per status the API says the order can move to. Cancelling opens a dialog, since it
 * needs a reason.
 */
export function StatusActions({
  order,
  onError,
}: {
  order: OrderSummary
  onError: (message: string) => void
}) {
  const change = useChangeStatus()
  const forward = order.allowedNextStatuses.filter((status) => status !== 'CANCELADO')

  return (
    <div className="flex flex-wrap justify-end gap-2">
      {forward.map((status) => (
        <Button
          key={status}
          size="sm"
          variant="outline"
          disabled={change.isPending}
          onClick={() =>
            change.mutate(
              { orderId: order.id, status },
              {
                onError: (error) =>
                  onError(error instanceof ApiError ? error.message : 'Algo deu errado.'),
              },
            )
          }
        >
          {ACTION_LABEL[status]}
        </Button>
      ))}
      {order.allowedNextStatuses.includes('CANCELADO') && <CancelOrderDialog order={order} />}
    </div>
  )
}
