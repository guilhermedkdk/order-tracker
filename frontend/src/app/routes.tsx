import type { RouteObject } from 'react-router'
import { LoginPage } from '@/features/auth/LoginPage'
import { RequireAuth } from '@/features/auth/RequireAuth'
import { SignupPage } from '@/features/auth/SignupPage'
import { NewRestaurantPage } from '@/features/restaurants/NewRestaurantPage'
import { RequireRestaurant } from '@/features/restaurants/RequireRestaurant'
import { AppShell } from './AppShell'
import { HomePage } from './HomePage'

/** Every screen of the app. The browser router in `main.tsx` and the tests both use this list. */
export const routes: RouteObject[] = [
  { path: '/entrar', Component: LoginPage },
  { path: '/cadastro', Component: SignupPage },
  {
    Component: RequireAuth,
    children: [
      {
        Component: AppShell,
        children: [
          { path: '/restaurantes/novo', Component: NewRestaurantPage },
          { Component: RequireRestaurant, children: [{ index: true, Component: HomePage }] },
        ],
      },
    ],
  },
]
