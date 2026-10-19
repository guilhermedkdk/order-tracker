import { useRef, useState, type ChangeEvent } from 'react'
import { lookupCep, type CepAddress } from '@/lib/viacep'
import type { Autofill } from './autofill'

export type CepStatus = 'idle' | 'loading' | 'found' | 'not-found' | 'failed'

/**
 * Fills the address from ViaCEP when the person types a CEP. It runs from the CEP field's own
 * change, so a CEP filled from the customer base is not looked up again. The answer replaces an
 * address filled before, from another CEP or the customer base, but never what the person typed.
 */
export function useCepAutofill(autofill: Autofill): {
  status: CepStatus
  onCepChange: (event: ChangeEvent<HTMLInputElement>) => void
} {
  const [status, setStatus] = useState<CepStatus>('idle')
  const latest = useRef('')

  function apply(address: CepAddress) {
    autofill.fill('deliveryAddress.street', address.street)
    autofill.fill('deliveryAddress.neighborhood', address.neighborhood)
    autofill.fill('deliveryAddress.city', address.city)
    autofill.fill('deliveryAddress.state', address.state)
    // A number or complement filled with an earlier address does not belong to this one.
    autofill.fill('deliveryAddress.number', '')
    autofill.fill('deliveryAddress.complement', '')
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
