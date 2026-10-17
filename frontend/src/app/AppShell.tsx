import { Link, Outlet, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useLogout, useMe } from '@/features/auth/api'
import { RestoreDemoButton } from '@/features/demo/RestoreDemoButton'
import { RestaurantSelector } from '@/features/restaurants/RestaurantSelector'

/** The frame around every signed-in screen: product name, restaurant picker, who is signed in. */
export function AppShell() {
  const me = useMe()
  const logout = useLogout()
  const navigate = useNavigate()
  const isOwner = me.data?.role === 'DONO'
  const isAdmin = me.data?.role === 'ADMIN'

  async function signOut() {
    await logout.mutateAsync()
    navigate('/entrar', { replace: true })
  }

  return (
    <div className="min-h-svh">
      <header className="border-b">
        <div className="mx-auto flex min-h-14 max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-2">
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/" className="font-heading font-semibold">
              Rastreador de pedidos
            </Link>
            <RestaurantSelector />
            {isOwner && (
              <Button asChild variant="ghost" size="sm">
                <Link to="/restaurantes/novo">Novo restaurante</Link>
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm">
            {isAdmin && <RestoreDemoButton />}
            {me.data?.demo && <Badge variant="outline">Conta demo</Badge>}
            <span className="text-muted-foreground">{me.data?.name}</span>
            <Button variant="outline" size="sm" onClick={signOut} disabled={logout.isPending}>
              Sair
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-4">
        <Outlet />
      </main>
    </div>
  )
}
