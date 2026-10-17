import type { FieldValues, Path, UseFormReturn } from 'react-hook-form'
import { ApiError } from './http'

const FALLBACK = 'Algo deu errado. Tente de novo.'

/**
 * Shows an API failure on the form: each field error next to its field, anything else at the top
 * of the form.
 */
export function showApiError<T extends FieldValues, Output>({
  form,
  error,
  fields,
}: {
  form: UseFormReturn<T, unknown, Output>
  error: unknown
  fields: readonly Path<T>[]
}): void {
  if (!(error instanceof ApiError)) {
    form.setError('root', { message: FALLBACK })
    return
  }
  let placed = false
  for (const fieldError of error.fieldErrors) {
    // The API writes list fields as items[0].quantity; react-hook-form names them items.0.quantity.
    const path = fieldError.field.replace(/\[(\d+)\]/g, '.$1')
    const field = fields.find((name) => name === path)
    if (field) {
      form.setError(field, { message: fieldError.message })
      placed = true
    }
  }
  if (!placed) {
    form.setError('root', { message: error.message })
  }
}
