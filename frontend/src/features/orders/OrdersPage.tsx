import { Plus } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { Button } from '@/components/ui/button'
import { useSelectedRestaurant } from '@/features/restaurants/selection'
import { OrderTable } from './OrderTable'

export function OrdersPage() {
  const { selection } = useSelectedRestaurant()
  const { search } = useLocation()
  const restaurantId = selection.kind === 'one' ? selection.restaurant.id : undefined
  const title =
    selection.kind === 'one'
      ? `Pedidos de ${selection.restaurant.name}`
      : 'Pedidos de todos os restaurantes'

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">{title}</h1>
        <Button asChild size="lg">
          <Link to={{ pathname: '/pedidos/novo', search }}>
            <Plus />
            Novo pedido
          </Link>
        </Button>
      </header>
      <OrderTable restaurantId={restaurantId} showRestaurant={selection.kind === 'all'} />
    </section>
  )
}
