import { Columns3, List, Plus } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSelectedRestaurant } from '@/features/restaurants/selection'
import { orderViewSchema, useOrderListParams } from './list-params'
import { OrderBoard } from './OrderBoard'
import { OrderTable } from './OrderTable'

export function OrdersPage() {
  const { selection } = useSelectedRestaurant()
  const { search } = useLocation()
  const { view, setView } = useOrderListParams()
  const restaurantId = selection.kind === 'one' ? selection.restaurant.id : undefined
  const showRestaurant = selection.kind === 'all'
  const title =
    selection.kind === 'one'
      ? `Pedidos de ${selection.restaurant.name}`
      : 'Pedidos de todos os restaurantes'

  return (
    <Tabs
      value={view}
      onValueChange={(value) => {
        const next = orderViewSchema.safeParse(value).data
        if (next) {
          setView(next)
        }
      }}
      className="gap-6"
    >
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">{title}</h1>
        <div className="flex items-center gap-3">
          <TabsList aria-label="Visão dos pedidos" className="h-9">
            <TabsTrigger value="lista" className="px-3">
              <List />
              Lista
            </TabsTrigger>
            <TabsTrigger value="kanban" className="px-3">
              <Columns3 />
              Kanban
            </TabsTrigger>
          </TabsList>
          <Button asChild size="lg">
            <Link to={{ pathname: '/pedidos/novo', search }}>
              <Plus />
              Novo pedido
            </Link>
          </Button>
        </div>
      </header>
      <TabsContent value="lista">
        <OrderTable restaurantId={restaurantId} showRestaurant={showRestaurant} />
      </TabsContent>
      <TabsContent value="kanban">
        <OrderBoard restaurantId={restaurantId} showRestaurant={showRestaurant} />
      </TabsContent>
    </Tabs>
  )
}
