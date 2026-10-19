import type { OrderPage, OrderSummary, OrderStatus } from './api'

/**
 * What dropping `order` on the `target` column does. Only the order's next statuses accept it, and
 * cancelling still needs the reason, so that column asks for it instead of moving.
 */
export function resolveDrop({
  order,
  target,
}: {
  order: Pick<OrderSummary, 'allowedNextStatuses'>
  target: OrderStatus
}): 'move' | 'ask-reason' | 'ignore' {
  if (!order.allowedNextStatuses.includes(target)) {
    return 'ignore'
  }
  return target === 'CANCELADO' ? 'ask-reason' : 'move'
}

export type BoardColumn = { status: OrderStatus; cards: OrderSummary[]; total: number }

/**
 * The board's columns from each status's first page. A move still waiting for the API (`pending`,
 * order id to target status) already shows in its new column, and both totals count it there.
 * Right after a change the columns reload at different times and may both hold the order; it
 * shows once, where the first column has it, until the other catches up.
 */
export function arrangeBoard({
  columns,
  pending,
}: {
  columns: { status: OrderStatus; page: OrderPage | undefined }[]
  pending: ReadonlyMap<string, OrderStatus>
}): BoardColumn[] {
  const orders = new Map<string, OrderSummary>()
  for (const order of columns.flatMap(({ page }) => page?.content ?? [])) {
    if (!orders.has(order.id)) {
      orders.set(order.id, order)
    }
  }
  const placed = (id: string) => pending.get(id) ?? orders.get(id)?.status

  return columns.map(({ status, page }) => {
    const loaded = page?.content ?? []
    const loadedIds = new Set(loaded.map((order) => order.id))
    const cards = [...orders.values()]
      .filter((order) => placed(order.id) === status)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    const movedOut = loaded.filter((order) => placed(order.id) !== status).length
    const movedIn = cards.filter((order) => !loadedIds.has(order.id)).length
    return { status, cards, total: (page?.totalElements ?? 0) - movedOut + movedIn }
  })
}
