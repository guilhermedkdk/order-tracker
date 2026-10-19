import { useEffect } from 'react'
import { useWatch, type UseFormReturn } from 'react-hook-form'
import { useCustomerLookup } from '@/features/customers/api'
import type { Autofill } from './autofill'
import type { NewOrderBody, OrderFormInput } from './order-form'

/**
 * Looks the typed phone up in the restaurant's customer base and fills the name and address with
 * the customer's last order. A corrected phone replaces what the previous customer filled; what the
 * person typed stays.
 */
export function useCustomerAutofill({
  form,
  autofill,
}: {
  form: UseFormReturn<OrderFormInput, unknown, NewOrderBody>
  autofill: Autofill
}): 'idle' | 'found' | 'new' {
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
    autofill.fill('customer.name', customer.name)
    // The address goes with its CEP: once the person types a CEP, the address is theirs.
    if (!autofill.untouched('deliveryAddress.cep')) {
      return
    }
    const { lastAddress: address } = customer
    autofill.fill('deliveryAddress.cep', address.cep)
    autofill.fill('deliveryAddress.street', address.street)
    autofill.fill('deliveryAddress.number', address.number)
    autofill.fill('deliveryAddress.complement', address.complement ?? '')
    autofill.fill('deliveryAddress.neighborhood', address.neighborhood)
    autofill.fill('deliveryAddress.city', address.city)
    autofill.fill('deliveryAddress.state', address.state)
  }, [customer, autofill])

  if (customer === undefined) {
    return 'idle'
  }
  return customer ? 'found' : 'new'
}
