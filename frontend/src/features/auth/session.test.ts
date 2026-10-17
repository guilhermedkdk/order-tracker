import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { ana } from '@/test/fixtures'
import { meQueryKey, startSession } from './api'

describe('startSession', () => {
  it("drops the previous user's cached data and keeps only the new user", () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(['restaurants'], [{ id: 'de-outra-pessoa' }])
    queryClient.setQueryData(['orders', 'list', {}], { content: [] })

    startSession(queryClient, { ...ana, role: 'DONO' })

    expect(queryClient.getQueryData(['restaurants'])).toBeUndefined()
    expect(queryClient.getQueryData(['orders', 'list', {}])).toBeUndefined()
    expect(queryClient.getQueryData(meQueryKey)).toMatchObject({ email: 'ana@example.com' })
  })
})
