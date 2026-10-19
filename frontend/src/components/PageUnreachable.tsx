import { LogoMark } from '@/components/Logo'
import { Button } from '@/components/ui/button'

/** The whole screen when the API does not answer, with a way to ask again. */
export function PageUnreachable({ onRetry, retrying }: { onRetry: () => void; retrying: boolean }) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-5 px-6 text-center">
      <LogoMark className="size-10" />
      <div className="flex max-w-sm flex-col gap-1.5">
        <h1 className="font-heading text-lg font-semibold tracking-tight">
          Não conseguimos falar com o servidor
        </h1>
        <p className="text-sm text-muted-foreground">
          Ele pode estar fora do ar ou ainda acordando. Tente de novo em alguns instantes.
        </p>
      </div>
      <Button onClick={onRetry} disabled={retrying}>
        {retrying ? 'Tentando…' : 'Tentar de novo'}
      </Button>
    </main>
  )
}
