import { useMe } from '@/features/auth/api'

// Placeholder until the order list lands in the next step.
export function HomePage() {
  const me = useMe()
  return (
    <section className="flex flex-col gap-1 py-8">
      <h1 className="font-heading text-2xl font-semibold">Olá, {me.data?.name}</h1>
      <p className="text-muted-foreground">Os pedidos aparecem aqui em breve.</p>
    </section>
  )
}
