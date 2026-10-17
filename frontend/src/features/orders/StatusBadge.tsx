import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { OrderStatus } from './api'
import { STATUS_LABEL } from './labels'

const STATUS_STYLE: Record<OrderStatus, string> = {
  RECEBIDO: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200',
  EM_PREPARO: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  SAIU_PARA_ENTREGA: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200',
  ENTREGUE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  CANCELADO: 'bg-muted text-muted-foreground line-through',
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant="secondary" className={cn('font-medium', STATUS_STYLE[status])}>
      {STATUS_LABEL[status]}
    </Badge>
  )
}
