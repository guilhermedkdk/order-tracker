import { ArrowLeft } from 'lucide-react'
import { Link, useLocation } from 'react-router'

/** The way back to the orders, with the restaurant and the view the person came from. */
export function BackToOrders() {
  const { search } = useLocation()
  return (
    <Link
      to={{ pathname: '/pedidos', search }}
      className="-ml-1 flex items-center gap-1.5 self-start rounded-md px-1 py-0.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-4" />
      Pedidos
    </Link>
  )
}
