import { Ellipsis, Eye, XCircle } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { OrderActionTarget } from './api'
import { CancelOrderDialog } from './CancelOrderDialog'
import { ACTION_LABEL } from './labels'
import { useMoveOrder } from './useMoveOrder'

/**
 * The next status the API allows, as a button, and cancelling, which asks for a reason. The `menu`
 * layout, for list rows and board cards, keeps one line by tucking cancelling and the details link
 * into a "⋯" menu; `buttons` shows cancelling beside the next step.
 */
export function StatusActions({
  order,
  layout,
}: {
  order: OrderActionTarget
  layout: 'menu' | 'buttons'
}) {
  const { move, isPending } = useMoveOrder()
  const [cancelling, setCancelling] = useState(false)
  const opener = useRef<HTMLButtonElement>(null)
  const { search } = useLocation()
  const forward = order.allowedNextStatuses.filter((status) => status !== 'CANCELADO')
  const canCancel = order.allowedNextStatuses.includes('CANCELADO')

  return (
    <div className="flex items-center justify-end gap-1.5">
      {forward.map((status) => (
        <Button
          key={status}
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => move({ order, status })}
        >
          {ACTION_LABEL[status]}
        </Button>
      ))}
      {layout === 'buttons' && canCancel && (
        <Button
          ref={opener}
          size="sm"
          variant="ghost"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => setCancelling(true)}
        >
          Cancelar pedido
        </Button>
      )}
      {layout === 'menu' && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              ref={opener}
              size="icon-sm"
              variant="ghost"
              aria-label={`Mais ações do pedido #${order.code}`}
            >
              <Ellipsis />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem asChild>
              <Link to={{ pathname: `/pedidos/${order.id}`, search }}>
                <Eye />
                Ver detalhes
              </Link>
            </DropdownMenuItem>
            {canCancel && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={() => setCancelling(true)}>
                  <XCircle />
                  Cancelar pedido
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {canCancel && (
        <CancelOrderDialog
          order={order}
          open={cancelling}
          onOpenChange={setCancelling}
          returnFocus={opener}
        />
      )}
    </div>
  )
}
