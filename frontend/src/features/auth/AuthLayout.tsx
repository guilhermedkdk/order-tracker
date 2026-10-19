import type { ReactNode } from 'react'
import { Logo } from '@/components/Logo'
import { STATUS_LABEL } from '@/features/orders/labels'
import { StatusDot } from '@/features/orders/StatusBadge'

// A made-up order's way to the door, to show at a glance what the product does.
const SAMPLE_TIMELINE = [
  { status: 'RECEBIDO', at: '20:08' },
  { status: 'EM_PREPARO', at: '20:11' },
  { status: 'SAIU_PARA_ENTREGA', at: '20:34' },
  { status: 'ENTREGUE', at: '20:52' },
] as const

/** The frame of the login and signup screens: the product on the left, the form on the right. */
export function AuthLayout({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <div className="flex min-h-svh">
      <aside className="hidden w-[44%] max-w-xl flex-col justify-between bg-foreground p-10 text-background lg:flex">
        <Logo inverted />
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-3">
            <p className="font-heading text-3xl leading-tight font-semibold tracking-tight">
              Do recebimento à entrega, cada pedido no seu lugar.
            </p>
            <p className="max-w-sm text-background/60">
              Registre os pedidos dos seus restaurantes e acompanhe cada um, do preparo até a porta
              do cliente.
            </p>
          </div>
          <div className="max-w-xs rounded-xl bg-background/6 p-5 ring-1 ring-background/10">
            <p className="font-mono text-xs text-background/50">#2AF8FD32 · Marina Alves</p>
            <ol className="mt-4 flex flex-col gap-3 border-l border-background/15 pl-4">
              {SAMPLE_TIMELINE.map(({ status, at }) => (
                <li key={status} className="relative flex items-center justify-between text-sm">
                  <StatusDot
                    status={status}
                    className="absolute left-[-1.3rem] size-2 ring-4 ring-foreground"
                  />
                  <span>{STATUS_LABEL[status]}</span>
                  <span className="text-background/50 tabular-nums">{at}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <p className="text-xs text-background/40">Mini rastreador de pedidos de delivery</p>
      </aside>
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="flex w-full max-w-sm flex-col gap-8">
          <Logo className="lg:hidden" />
          <div className="flex flex-col gap-2">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          {children}
        </div>
      </main>
    </div>
  )
}
