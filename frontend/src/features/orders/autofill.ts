import { useState } from 'react'
import type { Path, UseFormReturn } from 'react-hook-form'
import type { NewOrderBody, OrderFormInput } from './order-form'

type Form = UseFormReturn<OrderFormInput, unknown, NewOrderBody>

/** The order form fields that the customer base and the CEP fill. */
export type AutofillField = Extract<
  Path<OrderFormInput>,
  'customer.name' | `deliveryAddress.${string}`
>

export type Autofill = {
  /** Whether the person left the field alone: it is empty or still holds what was filled into it. */
  untouched: (field: AutofillField) => boolean
  /** Puts the value into the field, unless the person changed it. */
  fill: (field: AutofillField, value: string) => void
}

/**
 * What the customer base and the CEP put into the order form, shared by both, so each one replaces
 * what the other filled but never what the person typed.
 */
export function useAutofill(form: Form): Autofill {
  // Stable for the form's life, so effects that fill do not run again on every render.
  const [autofill] = useState(() => createAutofill(form))
  return autofill
}

function createAutofill(form: Form): Autofill {
  const filled: Partial<Record<AutofillField, string>> = {}

  function untouched(field: AutofillField) {
    const current = form.getValues(field)
    return current.trim() === '' || current === filled[field]
  }

  return {
    untouched,
    fill(field, value) {
      if (untouched(field)) {
        form.setValue(field, value, {
          shouldDirty: true,
          shouldValidate: form.formState.isSubmitted,
        })
        filled[field] = value
      }
    },
  }
}
