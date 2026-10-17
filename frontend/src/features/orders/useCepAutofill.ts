import { useRef, useState, type ChangeEvent } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { lookupCep, type CepAddress } from '@/lib/viacep'
import type { NewOrderBody, OrderFormInput } from './order-form'

type Form = UseFormReturn<OrderFormInput, unknown, NewOrderBody>
export type CepStatus = 'idle' | 'loading' | 'found' | 'not-found' | 'failed'

const FIELDS = {
  street: 'deliveryAddress.street',
  neighborhood: 'deliveryAddress.neighborhood',
  city: 'deliveryAddress.city',
  state: 'deliveryAddress.state',
} as const satisfies Record<keyof CepAddress, string>

/**
 * Fills the address from ViaCEP when the person types a CEP. It runs from the CEP field's own
 * change, so an address filled from the customer base is not looked up again. A field is filled
 * only while it is empty or still holds the previous CEP's answer: what was typed is kept.
 */
export function useCepAutofill(form: Form): {
  status: CepStatus
  onCepChange: (event: ChangeEvent<HTMLInputElement>) => void
} {
  const [status, setStatus] = useState<CepStatus>('idle')
  const latest = useRef('')
  const lastFilled = useRef<Partial<CepAddress>>({})

  function apply(address: CepAddress) {
    for (const key of Object.keys(FIELDS) as (keyof CepAddress)[]) {
      const field = FIELDS[key]
      const current = form.getValues(field)
      const untouched = current.trim() === '' || current === lastFilled.current[key]
      if (untouched && address[key] !== '') {
        form.setValue(field, address[key], { shouldDirty: true })
      }
    }
    lastFilled.current = address
  }

  function onCepChange(event: ChangeEvent<HTMLInputElement>) {
    const digits = event.target.value.replace(/\D/g, '')
    latest.current = digits
    if (digits.length !== 8) {
      setStatus('idle')
      return
    }
    setStatus('loading')
    lookupCep(digits).then(
      (address) => {
        if (latest.current !== digits) {
          return
        }
        if (address) {
          apply(address)
        }
        setStatus(address ? 'found' : 'not-found')
      },
      () => {
        if (latest.current === digits) {
          setStatus('failed')
        }
      },
    )
  }

  return { status, onCepChange }
}
