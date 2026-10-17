import { useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { api } from '@/lib/http'

/** The public demo accounts. Their password is in the README, on purpose. */
export const DEMO_PASSWORD = 'demo1234'
export const DEMO_ADMIN_EMAIL = 'admin@example.com'
export const DEMO_OWNER_EMAIL = 'rafael@example.com'

/** Recreates the demo data. Everything on screen may have changed, so every query reloads. */
export function useRestoreDemo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api({ path: '/demo/restore', method: 'POST', schema: z.undefined() }),
    onSuccess: () => queryClient.invalidateQueries(),
  })
}
