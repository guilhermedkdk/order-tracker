import { cn } from '@/lib/utils'
import type { OrderStatus } from './api'
import { STATUS_LABEL } from './labels'

// Color is the only thing that tells the statuses apart at a glance; everything else stays neutral.
const STATUS_TONE: Record<OrderStatus, { badge: string; dot: string }> = {
  RECEBIDO: { badge: 'bg-sky-50 text-sky-800 ring-sky-600/20', dot: 'bg-sky-500' },
  EM_PREPARO: { badge: 'bg-amber-50 text-amber-800 ring-amber-600/25', dot: 'bg-amber-500' },
  SAIU_PARA_ENTREGA: {
    badge: 'bg-violet-50 text-violet-800 ring-violet-600/20',
    dot: 'bg-violet-500',
  },
  ENTREGUE: { badge: 'bg-emerald-50 text-emerald-800 ring-emerald-600/20', dot: 'bg-emerald-500' },
  CANCELADO: { badge: 'bg-zinc-100 text-zinc-600 ring-zinc-500/20', dot: 'bg-zinc-400' },
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset',
        STATUS_TONE[status].badge,
      )}
    >
      <StatusDot status={status} />
      {STATUS_LABEL[status]}
    </span>
  )
}

/** The status color alone, for column headers and the timeline. */
export function StatusDot({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('size-1.5 shrink-0 rounded-full', STATUS_TONE[status].dot, className)}
    />
  )
}
