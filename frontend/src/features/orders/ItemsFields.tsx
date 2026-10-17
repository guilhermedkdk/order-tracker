import { Plus, Trash2 } from 'lucide-react'
import { useFieldArray, type UseFormReturn } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { emptyItem, type NewOrderBody, type OrderFormInput } from './order-form'

/** The order's item rows, which can be added and removed. At least one always stays. */
export function ItemsFields({
  form,
}: {
  form: UseFormReturn<OrderFormInput, unknown, NewOrderBody>
}) {
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' })
  const errors = form.formState.errors.items

  return (
    <div className="flex flex-col gap-3">
      {fields.map((field, index) => {
        const number = index + 1
        const itemErrors = errors?.[index]
        return (
          <div key={field.id} className="grid grid-cols-[1fr_5rem_7rem_auto] items-start gap-2">
            <Field data-invalid={!!itemErrors?.name}>
              <FieldLabel htmlFor={`item-${index}-name`}>Item {number}</FieldLabel>
              <Input
                id={`item-${index}-name`}
                aria-invalid={!!itemErrors?.name}
                {...form.register(`items.${index}.name`)}
              />
              <FieldError errors={[itemErrors?.name]} />
            </Field>
            <Field data-invalid={!!itemErrors?.quantity}>
              <FieldLabel htmlFor={`item-${index}-quantity`}>Qtd.</FieldLabel>
              <Input
                id={`item-${index}-quantity`}
                aria-label={`Quantidade do item ${number}`}
                inputMode="numeric"
                aria-invalid={!!itemErrors?.quantity}
                {...form.register(`items.${index}.quantity`)}
              />
              <FieldError errors={[itemErrors?.quantity]} />
            </Field>
            <Field data-invalid={!!itemErrors?.unitPrice}>
              <FieldLabel htmlFor={`item-${index}-price`}>Preço (R$)</FieldLabel>
              <Input
                id={`item-${index}-price`}
                aria-label={`Preço do item ${number}`}
                inputMode="decimal"
                placeholder="0,00"
                aria-invalid={!!itemErrors?.unitPrice}
                {...form.register(`items.${index}.unitPrice`)}
              />
              <FieldError errors={[itemErrors?.unitPrice]} />
            </Field>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mt-6"
              aria-label={`Remover item ${number}`}
              disabled={fields.length === 1}
              onClick={() => remove(index)}
            >
              <Trash2 />
            </Button>
          </div>
        )
      })}
      <FieldError
        errors={[errors?.root, errors?.message ? { message: errors.message } : undefined]}
      />
      <Button
        type="button"
        variant="outline"
        className="self-start"
        onClick={() => append(emptyItem)}
      >
        <Plus />
        Adicionar item
      </Button>
    </div>
  )
}
