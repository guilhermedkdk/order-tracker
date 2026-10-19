import { Navigate, Outlet, useLocation } from 'react-router'
import { PageLoading } from '@/components/PageLoading'
import { useMe } from './api'

/** Lets the nested routes render only with a session; otherwise sends the person to login. */
export function RequireAuth() {
  const me = useMe()
  const location = useLocation()

  if (me.isPending) {
    return <PageLoading />
  }
  if (me.isError) {
    return <p className="p-6 text-destructive">{me.error.message}</p>
  }
  if (me.data === null) {
    return <Navigate to="/entrar" replace state={{ from: location.pathname + location.search }} />
  }
  return <Outlet />
}
