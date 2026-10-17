import { useEffect } from 'react'
import { useWatch, type Path, type UseFormReturn } from 'react-hook-form'
import { useCustomerLookup } from '@/features/customers/api'
import type { NewOrderBody, OrderFormInput } from './order-form'

type Form = UseFormReturn<OrderFormInput, unknown, NewOrderBody>

/**
 * Looks the typed phone up in the restaurant's customer base and fills the name and address with
 * the customer's last order. Only empty fields are filled, so nothing typed is lost.
 */
export function useCustomerAutofill(form: Form): 'idle' | 'found' | 'new' {
  const [restaurantId, phone] = useWatch({
    control: form.control,
    name: ['restaurantId', 'customer.phone'],
  })
  const lookup = useCustomerLookup({ restaurantId, phone })
  const customer = lookup.data

  useEffect(() => {
    if (!customer) {
      return
    }
    const { lastAddress: address } = customer
    fillIfEmpty(form, 'customer.name', customer.name)
    fillIfEmpty(form, 'deliveryAddress.cep', address.cep)
    fillIfEmpty(form, 'deliveryAddress.street', address.street)
    fillIfEmpty(form, 'deliveryAddress.number', address.number)
    fillIfEmpty(form, 'deliveryAddress.complement', address.complement ?? '')
    fillIfEmpty(form, 'deliveryAddress.neighborhood', address.neighborhood)
    fillIfEmpty(form, 'deliveryAddress.city', address.city)
    fillIfEmpty(form, 'deliveryAddress.state', address.state)
  }, [customer, form])

  if (customer === undefined) {
    return 'idle'
  }
  return customer ? 'found' : 'new'
}

function fillIfEmpty(
  form: Form,
  field: Extract<Path<OrderFormInput>, `customer.${string}` | `deliveryAddress.${string}`>,
  value: string,
) {
  if (form.getValues(field).trim() === '') {
    form.setValue(field, value, { shouldDirty: true, shouldValidate: form.formState.isSubmitted })
  }
}
