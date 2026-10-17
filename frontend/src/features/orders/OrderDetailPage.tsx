import { ArrowLeft } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCep, formatDateTime, formatMoney, formatPhone } from '@/lib/format'
import { useOrder, type Order } from './api'
import { CANCELLATION_REASON_LABEL, PAYMENT_LABEL, STATUS_LABEL } from './labels'
import { StatusActions } from './StatusActions'
import { StatusBadge } from './StatusBadge'

export function OrderDetailPage() {
  const { id = '' } = useParams()
  const { search } = useLocation()
  const order = useOrder(id)
  const [actionError, setActionError] = useState<string | null>(null)

  return (
    <section className="flex flex-col gap-4 py-4">
      <Link
        to={{ pathname: '/pedidos', search }}
        className="flex items-center gap-1 self-start text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Pedidos
      </Link>

      {order.isPending && <p className="text-muted-foreground">Carregando pedido…</p>}
      {order.isError && <p className="text-destructive">{order.error.message}</p>}
      {order.data && (
        <>
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <h1 className="font-heading text-2xl font-semibold">Pedido #{order.data.code}</h1>
                <StatusBadge status={order.data.status} />
              </div>
              <p className="text-sm text-muted-foreground">
                {order.data.restaurantName} · recebido em {formatDateTime(order.data.createdAt)}
              </p>
            </div>
            <StatusActions order={order.data} onOutcome={setActionError} />
          </header>
          {actionError && (
            <Alert variant="destructive">
              <AlertDescription>{actionError}</AlertDescription>
            </Alert>
          )}
          <OrderDetails order={order.data} />
        </>
      )}
    </section>
  )
}

function OrderDetails({ order }: { order: Order }) {
  const { customer, deliveryAddress: address, payment } = order
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Section title="Cliente">
            <p className="font-medium">{customer.name}</p>
            <p className="text-muted-foreground">{formatPhone(customer.phone)}</p>
          </Section>
          <Section title="Endereço de entrega">
            <p>
              {address.street}, {address.number}
              {address.complement ? ` - ${address.complement}` : ''}
            </p>
            <p className="text-muted-foreground">
              {address.neighborhood}, {address.city} - {address.state} · {formatCep(address.cep)}
            </p>
          </Section>
        </div>

        <Section title="Itens">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Qtd.</TableHead>
                <TableHead className="text-right">Preço</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{item.quantity}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(item.unitPrice)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(item.unitPrice * item.quantity)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3}>Itens</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMoney(order.subtotal)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={3}>Entrega</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMoney(order.deliveryFee)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={3} className="font-semibold">
                  Total
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {formatMoney(order.total)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </Section>

        <div className="grid gap-4 sm:grid-cols-2">
          <Section title="Pagamento">
            <p>{PAYMENT_LABEL[payment.method]}</p>
            {payment.changeFor !== null && (
              <p className="text-muted-foreground">
                Troco para {formatMoney(payment.changeFor)} (levar{' '}
                {formatMoney(payment.changeFor - order.total)})
              </p>
            )}
          </Section>
          {order.notes && (
            <Section title="Observações">
              <p className="whitespace-pre-line">{order.notes}</p>
            </Section>
          )}
        </div>
      </div>

      <Section title="Linha do tempo">
        <ol aria-label="Linha do tempo" className="flex flex-col gap-4 border-l pl-4">
          {order.statusHistory.map((change, index) => (
            <li key={index} className="relative flex flex-col gap-0.5">
              <span
                aria-hidden="true"
                className="absolute top-1.5 -left-[1.3rem] size-2 rounded-full bg-foreground"
              />
              <span className="font-medium">{STATUS_LABEL[change.status]}</span>
              <span className="text-sm text-muted-foreground">
                {formatDateTime(change.changedAt)} · {change.authorName}
              </span>
              {change.cancellationReason && (
                <span className="text-sm">
                  {CANCELLATION_REASON_LABEL[change.cancellationReason]}
                  {change.cancellationDetail ? `: ${change.cancellationDetail}` : ''}
                </span>
              )}
            </li>
          ))}
        </ol>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{title}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">{children}</CardContent>
    </Card>
  )
}
