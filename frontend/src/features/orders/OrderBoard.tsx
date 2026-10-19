import {
  DndContext,
  DragOverlay,
  MouseSensor,
  pointerWithin,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DraggableSyntheticListeners,
  type UniqueIdentifier,
} from '@dnd-kit/core'
import { useId, useState, type ReactNode, type SyntheticEvent } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateTime, formatElapsed, formatMoney } from '@/lib/format'
import { useNow } from '@/lib/use-now'
import { cn } from '@/lib/utils'
import { orderStatusSchema, useOrderBoard, type OrderStatus, type OrderSummary } from './api'
import { arrangeBoard, resolveDrop, type BoardColumn } from './board'
import { CancelOrderDialog } from './CancelOrderDialog'
import { STATUS_LABEL } from './labels'
import { listSearchFor } from './list-params'
import { StatusActions } from './StatusActions'
import { StatusDot } from './StatusBadge'
import { useMoveOrder } from './useMoveOrder'

/**
 * The board: one column per status with its newest orders. A card moves by its next-step button
 * or by dragging it to a column among its next statuses; dropping on "Cancelado" asks the reason.
 * A dragged card shows in its new column before the API answers.
 */
export function OrderBoard({
  restaurantId,
  showRestaurant,
}: {
  restaurantId: string | undefined
  showRestaurant: boolean
}) {
  const board = useOrderBoard({ restaurantId })
  const { move } = useMoveOrder()
  const [pending, setPending] = useState<ReadonlyMap<string, OrderStatus>>(() => new Map())
  const [dragged, setDragged] = useState<OrderSummary | null>(null)
  const [cancelling, setCancelling] = useState<OrderSummary | null>(null)
  const now = useNow()
  const sensors = useSensors(
    // A short move starts a drag with the mouse, so a plain click still opens the order.
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // On touch, a drag starts by holding the card; a swipe keeps scrolling the board.
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
  )
  const columns = arrangeBoard({ columns: board.columns, pending })
  const find = (id: UniqueIdentifier) =>
    columns.flatMap((column) => column.cards).find((order) => order.id === id)

  async function drop(event: DragEndEvent) {
    setDragged(null)
    const order = find(event.active.id)
    const target = orderStatusSchema.safeParse(event.over?.id).data
    if (!order || !target) {
      return
    }
    const outcome = resolveDrop({ order, target })
    switch (outcome) {
      case 'ignore':
        return
      case 'ask-reason':
        setCancelling(order)
        return
      case 'move':
        setPending((current) => new Map(current).set(order.id, target))
        await move({ order, status: target })
        setPending((current) => {
          // A later drag of the same card owns its place now.
          if (current.get(order.id) !== target) {
            return current
          }
          const next = new Map(current)
          next.delete(order.id)
          return next
        })
        return
      default: {
        const exhaustive: never = outcome
        return exhaustive
      }
    }
  }

  if (board.isPending) {
    return <BoardSkeleton />
  }
  if (board.error) {
    return <p className="text-destructive">{board.error.message}</p>
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        accessibility={{ announcements: announcementsFor(find) }}
        onDragStart={(event) => setDragged(find(event.active.id) ?? null)}
        onDragCancel={() => setDragged(null)}
        onDragEnd={drop}
      >
        <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:snap-none lg:grid-cols-5 lg:overflow-visible lg:px-0">
          {columns.map((column) => (
            <BoardColumnView key={column.status} column={column} dragged={dragged}>
              {column.cards.map((order) => (
                <BoardCard
                  key={order.id}
                  order={order}
                  moving={pending.has(order.id)}
                  showRestaurant={showRestaurant}
                  now={now}
                />
              ))}
            </BoardColumnView>
          ))}
        </div>
        <DragOverlay dropAnimation={null}>
          {dragged && (
            <div className="rotate-2 cursor-grabbing rounded-lg border bg-card p-3 shadow-lg">
              <CardBody
                order={dragged}
                code={<span>#{dragged.code}</span>}
                showRestaurant={showRestaurant}
                now={now}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>
      {cancelling && (
        <CancelOrderDialog
          order={cancelling}
          open
          onOpenChange={(open) => {
            if (!open) {
              setCancelling(null)
            }
          }}
        />
      )}
    </>
  )
}

function BoardColumnView({
  column,
  dragged,
  children,
}: {
  column: BoardColumn
  dragged: OrderSummary | null
  children: ReactNode
}) {
  // Every column is a drop target; the drop itself decides whether the move is allowed.
  const { setNodeRef, isOver } = useDroppable({ id: column.status })
  const [params] = useSearchParams()
  const titleId = useId()
  const accepts = dragged?.allowedNextStatuses.includes(column.status) ?? false
  const isOrigin = dragged?.status === column.status
  const hidden = column.total - column.cards.length

  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        'flex w-[78vw] max-w-72 shrink-0 snap-start flex-col rounded-xl bg-muted/70 transition-opacity lg:w-auto lg:max-w-none',
        dragged && !accepts && !isOrigin && 'opacity-50',
      )}
    >
      <h2
        aria-label={`${STATUS_LABEL[column.status]}, ${column.total} ${column.total === 1 ? 'pedido' : 'pedidos'}`}
        className="flex items-center gap-2 px-3 pt-3 pb-2 text-sm font-medium"
      >
        <StatusDot status={column.status} className="size-2" />
        <span id={titleId}>{STATUS_LABEL[column.status]}</span>
        <span className="ml-auto rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground tabular-nums">
          {column.total}
        </span>
      </h2>
      <ol
        ref={setNodeRef}
        className={cn(
          'mx-1.5 mb-1.5 flex min-h-32 flex-1 flex-col gap-2 rounded-lg p-1.5 outline-2 outline-transparent transition-colors lg:max-h-[calc(100svh-15.5rem)] lg:overflow-y-auto',
          accepts && 'outline-foreground/15 outline-dashed',
          accepts && isOver && 'bg-background/60 outline-foreground/40',
        )}
      >
        {children}
        {column.cards.length === 0 && (
          <li className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-foreground/10 py-8 text-xs text-muted-foreground">
            Nenhum pedido
          </li>
        )}
      </ol>
      {hidden > 0 && (
        <Link
          to={{
            pathname: '/pedidos',
            search: listSearchFor({ current: params, status: column.status }),
          }}
          className="mx-1.5 mb-1.5 rounded-lg px-2 py-1.5 text-center text-xs font-medium text-muted-foreground transition-colors hover:bg-background/60 hover:text-foreground"
        >
          Ver todos os {column.total}
        </Link>
      )}
    </section>
  )
}

function BoardCard({
  order,
  moving,
  showRestaurant,
  now,
}: {
  order: OrderSummary
  moving: boolean
  showRestaurant: boolean
  now: Date
}) {
  const { search } = useLocation()
  const { setNodeRef, listeners, isDragging } = useDraggable({
    id: order.id,
    disabled: moving || order.allowedNextStatuses.length === 0,
  })

  return (
    <li
      ref={setNodeRef}
      {...fromCardOnly(listeners)}
      // Lets a swipe that starts on a card still scroll; the touch sensor waits for a hold.
      style={{ touchAction: 'manipulation' }}
      className={cn(isDragging && 'opacity-40', moving && 'animate-pulse')}
    >
      <article
        aria-label={`Pedido #${order.code}`}
        className="relative flex flex-col gap-3 rounded-lg border bg-card p-3 shadow-xs transition-[border-color,box-shadow] hover:border-foreground/20 hover:shadow-sm"
      >
        <CardBody
          order={order}
          code={
            // Covers the whole card, so a click anywhere opens the order. Not draggable by the
            // browser, which would otherwise start its own drag of the link.
            <Link
              to={{ pathname: `/pedidos/${order.id}`, search }}
              draggable={false}
              className="rounded-sm outline-none after:absolute after:inset-0 after:rounded-lg focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              #{order.code}
            </Link>
          }
          showRestaurant={showRestaurant}
          now={now}
        />
        {!moving && order.allowedNextStatuses.length > 0 && (
          <div className="relative z-10">
            <StatusActions order={order} layout="card" />
          </div>
        )}
      </article>
    </li>
  )
}

// A menu or dialog opened from a card renders elsewhere in the page, yet its events bubble to the
// card through React. Only a press on the card itself starts a drag.
function fromCardOnly(listeners: DraggableSyntheticListeners): DraggableSyntheticListeners {
  if (!listeners) {
    return undefined
  }
  return Object.fromEntries(
    Object.entries(listeners).map(([name, handler]) => [
      name,
      (event: SyntheticEvent<HTMLElement>) => {
        if (event.target instanceof Node && event.currentTarget.contains(event.target)) {
          handler(event)
        }
      },
    ]),
  )
}

function CardBody({
  order,
  code,
  showRestaurant,
  now,
}: {
  order: OrderSummary
  code: ReactNode
  showRestaurant: boolean
  now: Date
}) {
  const finished = order.allowedNextStatuses.length === 0
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs text-muted-foreground">{code}</span>
        <span className="text-sm font-semibold tabular-nums">{formatMoney(order.total)}</span>
      </div>
      <p className="truncate font-medium">{order.customerName}</p>
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span
          className="truncate"
          title={showRestaurant ? `${order.neighborhood} · ${order.restaurantName}` : undefined}
        >
          {order.neighborhood}
          {showRestaurant && ` · ${order.restaurantName}`}
        </span>
        <span className="shrink-0 tabular-nums" title={formatDateTime(order.createdAt)}>
          {finished
            ? formatDateTime(order.createdAt)
            : formatElapsed({ since: order.createdAt, now })}
        </span>
      </div>
    </div>
  )
}

function BoardSkeleton() {
  return (
    <div aria-busy="true" className="flex gap-3 overflow-hidden lg:grid lg:grid-cols-5">
      <span className="sr-only">Carregando pedidos…</span>
      {orderStatusSchema.options.map((status) => (
        <div
          key={status}
          className="flex w-[78vw] max-w-72 shrink-0 flex-col gap-2 rounded-xl bg-muted/70 p-3 lg:w-auto lg:max-w-none"
        >
          <Skeleton className="h-4 w-24 bg-background" />
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-24 bg-background" />
          ))}
        </div>
      ))}
    </div>
  )
}

// dnd-kit reads these to screen readers; its defaults are in English and name cards by id.
function announcementsFor(find: (id: UniqueIdentifier) => OrderSummary | undefined): Announcements {
  const card = (id: UniqueIdentifier) => {
    const order = find(id)
    return order ? `Pedido #${order.code}` : 'Pedido'
  }
  const column = (id: UniqueIdentifier | undefined) => {
    const status = orderStatusSchema.safeParse(id).data
    return status ? STATUS_LABEL[status] : 'nenhuma coluna'
  }
  return {
    onDragStart: ({ active }) => `${card(active.id)} pego.`,
    onDragOver: ({ active, over }) => `${card(active.id)} sobre ${column(over?.id)}.`,
    onDragEnd: ({ active, over }) => `${card(active.id)} solto em ${column(over?.id)}.`,
    onDragCancel: ({ active }) => `${card(active.id)} voltou para o lugar.`,
  }
}
