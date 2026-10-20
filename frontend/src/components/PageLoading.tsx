import { useEffect, useState } from 'react'
import { LogoMark } from '@/components/Logo'

// The free API host sleeps when idle and takes a minute or two to wake; past this, say so.
const SLOW_MS = 4000

/** The whole screen while the session loads, which on a cold start means waiting for the API. */
export function PageLoading() {
  const [slow, setSlow] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), SLOW_MS)
    return () => clearTimeout(timer)
  }, [])

  return (
    <main
      aria-busy="true"
      className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center"
    >
      <LogoMark className="size-10 animate-pulse" />
      <p className="text-sm text-muted-foreground">Carregando…</p>
      {slow && (
        <p className="max-w-xs text-sm text-muted-foreground">
          O servidor da demonstração estava em repouso e está acordando. Isso pode levar um ou dois
          minutos.
        </p>
      )}
    </main>
  )
}
