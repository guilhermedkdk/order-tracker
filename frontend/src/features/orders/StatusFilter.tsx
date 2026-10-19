import { orderStatusSchema, type OrderStatus } from './api'
import { STATUS_LABEL } from './labels'
import { StatusDot } from './StatusBadge'

const OPTIONS = [undefined, ...orderStatusSchema.options]

/** One toggle per status, plus "Todos". Exactly one is pressed. */
export function StatusFilter({
  value,
  onChange,
}: {
  value: OrderStatus | undefined
  onChange: (status: OrderStatus | undefined) => void
}) {
  return (
    <fieldset className="m-0 flex w-fit max-w-full min-w-0 flex-wrap gap-1 rounded-lg border-0 bg-muted p-1">
      <legend className="sr-only">Filtrar por status</legend>
      {OPTIONS.map((status) => (
        <button
          key={status ?? 'todos'}
          type="button"
          aria-pressed={value === status}
          onClick={() => onChange(status)}
          className="flex h-7 items-center gap-1.5 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 aria-pressed:bg-background aria-pressed:text-foreground aria-pressed:shadow-sm"
        >
          {status && <StatusDot status={status} />}
          {status ? STATUS_LABEL[status] : 'Todos'}
        </button>
      ))}
    </fieldset>
  )
}
