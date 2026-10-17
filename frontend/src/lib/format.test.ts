import { describe, expect, it } from 'vitest'
import { formatCep, formatDateTime, formatMoney, formatPhone } from './format'

// Intl puts a no-break space after "R$"; compare with plain spaces.
const plain = (text: string) => text.replace(/ /g, ' ')

describe('format', () => {
  it('writes money in reais', () => {
    expect(plain(formatMoney(1234.5))).toBe('R$ 1.234,50')
  })

  it('reads UTC instants in São Paulo time', () => {
    expect(formatDateTime('2026-10-17T18:30:00Z')).toBe('17/10, 15:30')
  })

  it('masks mobile and landline phones', () => {
    expect(formatPhone('11987654321')).toBe('(11) 98765-4321')
    expect(formatPhone('1133334444')).toBe('(11) 3333-4444')
  })

  it('masks the CEP', () => {
    expect(formatCep('01310100')).toBe('01310-100')
  })
})
