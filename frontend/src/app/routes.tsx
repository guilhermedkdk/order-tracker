import { redirect, type RouteObject } from 'react-router'
import { LoginPage } from '@/features/auth/LoginPage'
import { RequireAuth } from '@/features/auth/RequireAuth'
import { SignupPage } from '@/features/auth/SignupPage'
import { NewOrderPage } from '@/features/orders/NewOrderPage'
import { OrderDetailPage } from '@/features/orders/OrderDetailPage'
import { OrdersPage } from '@/features/orders/OrdersPage'
import { NewRestaurantPage } from '@/features/restaurants/NewRestaurantPage'
import { RequireRestaurant } from '@/features/restaurants/RequireRestaurant'
import { AppShell } from './AppShell'

/** Every screen of the app. The browser router in `main.tsx` and the tests both use this list. */
export const routes: RouteObject[] = [
  // "/" is the order list; ?restaurante= comes along.
  { path: '/', loader: ({ request }) => redirect(`/pedidos${new URL(request.url).search}`) },
  { path: '/entrar', Component: LoginPage },
  { path: '/cadastro', Component: SignupPage },
  {
    Component: RequireAuth,
    children: [
      {
        Component: AppShell,
        children: [
          { path: '/restaurantes/novo', Component: NewRestaurantPage },
          {
            Component: RequireRestaurant,
            children: [
              { path: '/pedidos', Component: OrdersPage },
              { path: '/pedidos/novo', Component: NewOrderPage },
              { path: '/pedidos/:id', Component: OrderDetailPage },
            ],
          },
        ],
      },
    ],
  },
]
