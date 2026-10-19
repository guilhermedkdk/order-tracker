import type { ReactNode } from 'react'
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

/** A select bound to a text field of a react-hook-form form. An empty value shows the placeholder. */
export function ControlledSelect<TValues extends FieldValues, TOutput>({
  control,
  name,
  id,
  placeholder,
  invalid,
  options,
  className,
}: {
  control: Control<TValues, unknown, TOutput>
  name: Path<TValues>
  id: string
  placeholder: string
  invalid: boolean
  options: readonly { value: string; label: ReactNode }[]
  className?: string
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Select
          value={typeof field.value === 'string' ? field.value : ''}
          onValueChange={field.onChange}
        >
          <SelectTrigger
            id={id}
            ref={field.ref}
            onBlur={field.onBlur}
            aria-invalid={invalid}
            className={cn('w-full', className)}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent position="popper">
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
  )
}
