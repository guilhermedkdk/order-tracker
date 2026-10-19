import { Link, Outlet, useSearchParams } from 'react-router'
import { Logo } from '@/components/Logo'
import { Badge } from '@/components/ui/badge'
import { Toaster } from '@/components/ui/sonner'
import { useMe } from '@/features/auth/api'
import { useOrderUpdates } from '@/features/orders/api'
import { RestaurantSelector } from '@/features/restaurants/RestaurantSelector'
import { UserMenu } from './UserMenu'

/**
 * The frame around every signed-in screen: product name, restaurant picker, who is signed in. It also
 * keeps the orders current while any of those screens is open.
 */
export function AppShell() {
  const me = useMe()
  useOrderUpdates()
  const [params] = useSearchParams()
  const restaurant = params.get('restaurante')
  const home = restaurant ? `/pedidos?restaurante=${encodeURIComponent(restaurant)}` : '/pedidos'

  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:gap-5 sm:px-6">
          <Link to={home} aria-label="Rastreador de pedidos" className="shrink-0 rounded-lg">
            <Logo nameClassName="hidden md:inline" />
          </Link>
          <span aria-hidden="true" className="hidden h-6 w-px bg-border md:block" />
          <RestaurantSelector />
          <div className="ml-auto flex shrink-0 items-center gap-2">
            {me.data?.demo && (
              <Badge variant="outline" className="hidden sm:inline-flex">
                Conta demo
              </Badge>
            )}
            {me.data && <UserMenu user={me.data} />}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>
      <Toaster position="bottom-right" />
    </div>
  )
}
