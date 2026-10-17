import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useSelectedRestaurant } from '@/features/restaurants/selection'
import { formatDateTime, formatMoney } from '@/lib/format'
import { useOrders } from './api'
import { StatusActions } from './StatusActions'
import { StatusBadge } from './StatusBadge'

export function OrdersPage() {
  const { selection } = useSelectedRestaurant()
  const { search } = useLocation()
  const restaurantId = selection.kind === 'one' ? selection.restaurant.id : undefined
  const showRestaurant = selection.kind === 'all'
  const orders = useOrders({ restaurantId })
  const [actionError, setActionError] = useState<string | null>(null)
  const title =
    selection.kind === 'one'
      ? `Pedidos de ${selection.restaurant.name}`
      : 'Pedidos de todos os restaurantes'

  return (
    <section className="flex flex-col gap-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold">{title}</h1>
        <Button asChild>
          <Link to={{ pathname: '/pedidos/novo', search }}>Novo pedido</Link>
        </Button>
      </div>

      {actionError && (
        <Alert variant="destructive">
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}
      {orders.isPending && <p className="text-muted-foreground">Carregando pedidos…</p>}
      {orders.isError && <p className="text-destructive">{orders.error.message}</p>}
      {orders.data && orders.data.content.length === 0 && (
        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          Nenhum pedido ainda. Os novos aparecem aqui.
        </p>
      )}
      {orders.data && orders.data.content.length > 0 && (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                {showRestaurant && <TableHead>Restaurante</TableHead>}
                <TableHead>Cliente</TableHead>
                <TableHead>Bairro</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Horário</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.data.content.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs">#{order.code}</TableCell>
                  {showRestaurant && <TableCell>{order.restaurantName}</TableCell>}
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell>{order.neighborhood}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(order.total)}
                  </TableCell>
                  <TableCell className="tabular-nums">{formatDateTime(order.createdAt)}</TableCell>
                  <TableCell>
                    <StatusBadge status={order.status} />
                  </TableCell>
                  <TableCell>
                    <StatusActions order={order} onError={setActionError} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {orders.data.totalElements > orders.data.content.length && (
            <p className="text-sm text-muted-foreground">
              Mostrando os {orders.data.content.length} mais recentes de {orders.data.totalElements}{' '}
              pedidos.
            </p>
          )}
        </>
      )}
    </section>
  )
}
