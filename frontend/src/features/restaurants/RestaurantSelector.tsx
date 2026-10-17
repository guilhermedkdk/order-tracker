import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
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

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="restaurant-selector" className="sr-only">
        Restaurante
      </label>
      <NativeSelect
        id="restaurant-selector"
        size="sm"
        value={value}
        onChange={(event) => select(event.target.value)}
      >
        {isAdmin && (
          <NativeSelectOption value={ALL_RESTAURANTS}>Todos os restaurantes</NativeSelectOption>
        )}
        {restaurants.map((restaurant) => (
          <NativeSelectOption key={restaurant.id} value={restaurant.id}>
            {isAdmin ? `${restaurant.name} · ${restaurant.ownerName}` : restaurant.name}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  )
}
