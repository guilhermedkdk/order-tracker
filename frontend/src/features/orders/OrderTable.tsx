import { Inbox } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDateTime, formatMoney } from '@/lib/format'
import { useOrders } from './api'
import { useOrderListParams } from './list-params'
import { Pagination } from './Pagination'
import { StatusActions } from './StatusActions'
import { StatusBadge } from './StatusBadge'
import { StatusFilter } from './StatusFilter'

/**
 * The list view: the status filter, one line per order and the pages. Columns have fixed widths,
 * so changing the filter or the page never moves them.
 */
export function OrderTable({
  restaurantId,
  showRestaurant,
}: {
  restaurantId: string | undefined
  showRestaurant: boolean
}) {
  const { status, page, setStatus, setPage } = useOrderListParams()
  const orders = useOrders({ restaurantId, status, page })
  const { search } = useLocation()

  return (
    <div className="flex flex-col gap-4">
      <StatusFilter value={status} onChange={setStatus} />

      {orders.isPending && <TableSkeleton />}
      {orders.isError && <p className="text-destructive">{orders.error.message}</p>}
      {orders.data && orders.data.content.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-14 text-center">
          <Inbox className="size-8 text-muted-foreground/60" />
          <p className="font-medium">
            {status ? 'Nenhum pedido com esse status.' : 'Nenhum pedido ainda.'}
          </p>
          <p className="text-sm text-muted-foreground">
            {status ? 'Escolha outro status acima.' : 'Os novos aparecem aqui.'}
          </p>
        </div>
      )}
      {orders.data && orders.data.content.length > 0 && (
        <>
          <div className="overflow-hidden rounded-xl border bg-card">
            <Table className="min-w-[66rem] table-fixed">
              <TableHeader className="bg-muted/50 [&_th]:text-xs [&_th]:font-medium [&_th]:text-muted-foreground">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-28 pl-4">Pedido</TableHead>
                  {showRestaurant && <TableHead className="w-44">Restaurante</TableHead>}
                  <TableHead>Cliente</TableHead>
                  <TableHead className="w-36">Bairro</TableHead>
                  <TableHead className="w-24 text-right">Total</TableHead>
                  <TableHead className="w-30 pl-5">Horário</TableHead>
                  <TableHead className="w-38">Status</TableHead>
                  <TableHead className="w-54 pr-4 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.data.content.map((order) => (
                  // The order code's link covers the whole row; the actions sit above it.
                  <TableRow key={order.id} className="relative h-13">
                    <TableCell className="pl-4 font-mono text-xs">
                      <Link
                        to={{ pathname: `/pedidos/${order.id}`, search }}
                        className="rounded-sm outline-none after:absolute after:inset-0 focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        #{order.code}
                      </Link>
                    </TableCell>
                    {showRestaurant && (
                      <TableCell className="truncate" title={order.restaurantName}>
                        {order.restaurantName}
                      </TableCell>
                    )}
                    <TableCell className="truncate font-medium" title={order.customerName}>
                      {order.customerName}
                    </TableCell>
                    <TableCell
                      className="truncate text-muted-foreground"
                      title={order.neighborhood}
                    >
                      {order.neighborhood}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(order.total)}
                    </TableCell>
                    <TableCell className="pl-5 text-muted-foreground tabular-nums">
                      {formatDateTime(order.createdAt)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="relative z-10 pr-4">
                      <StatusActions order={order} layout="menu" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Pagination
            page={page}
            totalPages={orders.data.totalPages}
            totalElements={orders.data.totalElements}
            onChange={setPage}
          />
        </>
      )}
    </div>
  )
}

function TableSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-px overflow-hidden rounded-xl border">
      <span className="sr-only">Carregando pedidos…</span>
      <Skeleton className="h-10 rounded-none" />
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="flex h-13 items-center gap-6 px-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 flex-1" />
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-7 w-32" />
        </div>
      ))}
    </div>
  )
}
