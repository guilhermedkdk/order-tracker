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
import { cn } from '@/lib/utils'
import type { OrderActionTarget } from './api'
import { CancelOrderDialog } from './CancelOrderDialog'
import { ACTION_LABEL } from './labels'
import { useMoveOrder } from './useMoveOrder'

/**
 * The next status the API allows, as a button, and cancelling, which asks for a reason. The `row`
 * and `card` layouts keep to one line by tucking cancelling and the details link into a "⋯" menu,
 * and `card` stretches the next step across the card; `buttons` shows cancelling beside it.
 */
export function StatusActions({
  order,
  layout,
}: {
  order: OrderActionTarget
  layout: 'row' | 'card' | 'buttons'
}) {
  const { move, isPending } = useMoveOrder()
  // A list has one of these per order, so the dialog and its form mount on the first cancel only.
  const [dialog, setDialog] = useState<'unmounted' | 'open' | 'closed'>('unmounted')
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
          className={cn(layout === 'card' && 'flex-1')}
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
          onClick={() => setDialog('open')}
        >
          Cancelar pedido
        </Button>
      )}
      {layout !== 'buttons' && (
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
                <DropdownMenuItem variant="destructive" onSelect={() => setDialog('open')}>
                  <XCircle />
                  Cancelar pedido
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {canCancel && dialog !== 'unmounted' && (
        <CancelOrderDialog
          order={order}
          open={dialog === 'open'}
          onOpenChange={(open) => setDialog(open ? 'open' : 'closed')}
          returnFocus={opener}
        />
      )}
    </div>
  )
}
