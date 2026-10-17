import { Outlet, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { useLogout, useMe } from '@/features/auth/api'

/** The frame around every signed-in screen: product name, who is signed in and the way out. */
export function AppShell() {
  const me = useMe()
  const logout = useLogout()
  const navigate = useNavigate()

  async function signOut() {
    await logout.mutateAsync()
    navigate('/entrar', { replace: true })
  }

  return (
    <div className="min-h-svh">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
          <span className="font-heading font-semibold">Rastreador de pedidos</span>
          <div className="flex items-center gap-3 text-sm">
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
