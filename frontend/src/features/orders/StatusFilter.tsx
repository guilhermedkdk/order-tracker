import { Button } from '@/components/ui/button'
import { orderStatusSchema, type OrderStatus } from './api'
import { STATUS_LABEL } from './labels'

/** One toggle per status, plus "Todos". Exactly one is pressed. */
export function StatusFilter({
  value,
  onChange,
}: {
  value: OrderStatus | undefined
  onChange: (status: OrderStatus | undefined) => void
}) {
  return (
    <fieldset className="m-0 flex min-w-0 flex-wrap gap-2 border-0 p-0">
      <legend className="sr-only">Filtrar por status</legend>
      <Button
        size="sm"
        variant={value === undefined ? 'default' : 'outline'}
        aria-pressed={value === undefined}
        onClick={() => onChange(undefined)}
      >
        Todos
      </Button>
      {orderStatusSchema.options.map((status) => (
        <Button
          key={status}
          size="sm"
          variant={value === status ? 'default' : 'outline'}
          aria-pressed={value === status}
          onClick={() => onChange(status)}
        >
          {STATUS_LABEL[status]}
        </Button>
      ))}
    </fieldset>
  )
}
