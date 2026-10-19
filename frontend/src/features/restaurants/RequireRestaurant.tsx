import { Navigate, Outlet } from 'react-router'
import { useSelectedRestaurant } from './selection'

/** Sends an owner without any restaurant to create the first one before anything else. */
export function RequireRestaurant() {
  const { selection } = useSelectedRestaurant()

  if (selection.kind === 'loading') {
    return <p className="py-8 text-sm text-muted-foreground">Carregando…</p>
  }
  if (selection.kind === 'none') {
    return <Navigate to="/restaurantes/novo" replace />
  }
  return <Outlet />
}
