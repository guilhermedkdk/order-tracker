import { useSelectedRestaurant } from '@/features/restaurants/selection'

// Placeholder until the order list lands in the next step.
export function HomePage() {
  const { selection } = useSelectedRestaurant()
  const title =
    selection.kind === 'one'
      ? `Pedidos de ${selection.restaurant.name}`
      : 'Pedidos de todos os restaurantes'

  return (
    <section className="flex flex-col gap-1 py-8">
      <h1 className="font-heading text-2xl font-semibold">{title}</h1>
      <p className="text-muted-foreground">Os pedidos aparecem aqui em breve.</p>
    </section>
  )
}
