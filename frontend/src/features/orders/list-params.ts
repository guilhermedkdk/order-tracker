import { useSearchParams } from 'react-router'
import { z } from 'zod'
import { orderStatusSchema, type OrderStatus } from './api'

const VIEW = 'visao'
const STATUS = 'status'
const PAGE = 'pagina'

export const orderViewSchema = z.enum(['lista', 'kanban'])
export type OrderView = z.infer<typeof orderViewSchema>

/**
 * The view, the status filter and the page of the orders, kept in the URL next to
 * `?restaurante=`. The list is the default view, so only the board shows in the URL. Pages are
 * counted from 1 here, as people read them; the API counts from 0.
 */
export function useOrderListParams(): {
  view: OrderView
  status: OrderStatus | undefined
  page: number
  setView: (view: OrderView) => void
  setStatus: (status: OrderStatus | undefined) => void
  setPage: (page: number, options?: { replace?: boolean }) => void
} {
  const [params, setParams] = useSearchParams()
  const view = orderViewSchema.safeParse(params.get(VIEW)).data ?? 'lista'
  const status = orderStatusSchema.safeParse(params.get(STATUS)).data
  const requestedPage = Number(params.get(PAGE))
  const page = Number.isInteger(requestedPage) && requestedPage >= 1 ? requestedPage : 1

  return {
    view,
    status,
    page,
    setView: (next) =>
      setParams((current) => {
        const updated = new URLSearchParams(current)
        if (next === 'kanban') {
          updated.set(VIEW, next)
        } else {
          updated.delete(VIEW)
        }
        // The board shows every status at once and has no pages.
        updated.delete(STATUS)
        updated.delete(PAGE)
        return updated
      }),
    setStatus: (next) =>
      setParams((current) => {
        const updated = new URLSearchParams(current)
        if (next) {
          updated.set(STATUS, next)
        } else {
          updated.delete(STATUS)
        }
        // Page 3 of one filter means nothing in another.
        updated.delete(PAGE)
        return updated
      }),
    setPage: (next, options) =>
      setParams(
        (current) => {
          const updated = new URLSearchParams(current)
          updated.set(PAGE, String(next))
          return updated
        },
        { replace: options?.replace },
      ),
  }
}

/** The search of the list where a new order shows: the same restaurant and view, every status, first page. */
export function newestSearchFor(current: URLSearchParams): string {
  const next = new URLSearchParams(current)
  next.delete(STATUS)
  next.delete(PAGE)
  return `?${next.toString()}`
}

/** The search of the list filtered by `status`, keeping the selected restaurant from `current`. */
export function listSearchFor({
  current,
  status,
}: {
  current: URLSearchParams
  status: OrderStatus
}): string {
  const next = new URLSearchParams(current)
  next.delete(VIEW)
  next.set(STATUS, status)
  next.delete(PAGE)
  return `?${next.toString()}`
}
