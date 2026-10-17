import { useSearchParams } from 'react-router'
import { orderStatusSchema, type OrderStatus } from './api'

const STATUS = 'status'
const PAGE = 'pagina'

/**
 * The status filter and the page of the order list, kept in the URL next to `?restaurante=`. Pages
 * are counted from 1 here, as people read them; the API counts from 0.
 */
export function useOrderListParams(): {
  status: OrderStatus | undefined
  page: number
  setStatus: (status: OrderStatus | undefined) => void
  setPage: (page: number) => void
} {
  const [params, setParams] = useSearchParams()
  const status = orderStatusSchema.safeParse(params.get(STATUS)).data
  const requestedPage = Number(params.get(PAGE))
  const page = Number.isInteger(requestedPage) && requestedPage >= 1 ? requestedPage : 1

  return {
    status,
    page,
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
    setPage: (next) =>
      setParams((current) => {
        const updated = new URLSearchParams(current)
        updated.set(PAGE, String(next))
        return updated
      }),
  }
}
