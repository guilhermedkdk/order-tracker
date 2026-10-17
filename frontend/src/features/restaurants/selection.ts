import { useSearchParams } from 'react-router'
import { useMe } from '@/features/auth/api'
import { useRestaurants, type Restaurant } from './api'

export const ALL_RESTAURANTS = 'todos'

/** Which restaurant the screens show. `all` exists only for the admin; `none` for an owner without any. */
export type Selection =
  { kind: 'loading' } | { kind: 'none' } | { kind: 'all' } | { kind: 'one'; restaurant: Restaurant }

/**
 * The selected restaurant lives in the URL (`?restaurante=`), so a reload or a shared link keeps
 * it. Without a valid one, the admin sees all restaurants and an owner sees the first.
 */
export function useSelectedRestaurant(): {
  selection: Selection
  restaurants: Restaurant[]
  select: (value: string) => void
} {
  const me = useMe()
  const restaurants = useRestaurants()
  const [params, setParams] = useSearchParams()

  function select(value: string) {
    setParams((current) => {
      const next = new URLSearchParams(current)
      next.set('restaurante', value)
      // Another restaurant has other pages; start from the first.
      next.delete('pagina')
      return next
    })
  }

  if (!me.data || !restaurants.data) {
    return { selection: { kind: 'loading' }, restaurants: [], select }
  }
  const list = restaurants.data
  const isAdmin = me.data.role === 'ADMIN'
  const wanted = params.get('restaurante')
  const match = list.find((restaurant) => restaurant.id === wanted)

  if (match) {
    return { selection: { kind: 'one', restaurant: match }, restaurants: list, select }
  }
  if (isAdmin) {
    return { selection: { kind: 'all' }, restaurants: list, select }
  }
  const [first] = list
  return {
    selection: first ? { kind: 'one', restaurant: first } : { kind: 'none' },
    restaurants: list,
    select,
  }
}
