import { Store } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useMe } from '@/features/auth/api'
import { ALL_RESTAURANTS, useSelectedRestaurant } from './selection'

/** The header picker for the selected restaurant. The admin also gets "all" and each owner's name. */
export function RestaurantSelector() {
  const me = useMe()
  const { selection, restaurants, select } = useSelectedRestaurant()
  const isAdmin = me.data?.role === 'ADMIN'

  if (selection.kind === 'loading' || selection.kind === 'none') {
    return null
  }
  const value = selection.kind === 'one' ? selection.restaurant.id : ALL_RESTAURANTS
  // The trigger shows just the name; the owner beside it only helps while choosing.
  const shown = selection.kind === 'one' ? selection.restaurant.name : 'Todos os restaurantes'

  return (
    <Select value={value} onValueChange={select}>
      <SelectTrigger aria-label="Restaurante" className="h-9 w-full max-w-64 min-w-0 gap-2">
        <Store className="text-muted-foreground" />
        <SelectValue className="flex-1 text-left">
          <span className="truncate">{shown}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent position="popper" align="start" className="min-w-64">
        {isAdmin && (
          <>
            <SelectItem value={ALL_RESTAURANTS}>Todos os restaurantes</SelectItem>
            <SelectSeparator />
          </>
        )}
        {restaurants.map((restaurant) => (
          <SelectItem key={restaurant.id} value={restaurant.id}>
            {restaurant.name}
            {isAdmin && <span className="text-muted-foreground"> · {restaurant.ownerName}</span>}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
