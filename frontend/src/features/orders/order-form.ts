import type { Path } from 'react-hook-form'
import { z } from 'zod'
import { paymentMethodSchema } from './api'

export const STATES = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
] as const

const DECIMAL = /^\d+([.,]\d{1,2})?$/

function digits(text: string): string {
  return text.replace(/\D/g, '')
}

/** "45,90" or "45.90" to 45.9; anything else to NaN. */
export function parseDecimal(text: string): number {
  const trimmed = text.trim()
  return DECIMAL.test(trimmed) ? Number(trimmed.replace(',', '.')) : Number.NaN
}

function money({ message, max }: { message: string; max: number }) {
  return z
    .string()
    .trim()
    .regex(DECIMAL, message)
    .transform(parseDecimal)
    .refine((value) => value <= max, message)
}

const required = (message: string, max: number) =>
  z.string().trim().min(1, message).max(max, `Use no máximo ${max} caracteres.`)

// The API repeats every rule; these only answer before the round trip.
export const orderFormSchema = z
  .object({
    restaurantId: z.string().min(1, 'Escolha o restaurante.'),
    customer: z.object({
      name: z.string().trim().min(2, 'O nome deve ter entre 2 e 100 caracteres.').max(100),
      phone: z
        .string()
        .transform(digits)
        .pipe(z.string().regex(/^\d{10,11}$/, 'Informe o telefone com DDD, com 10 ou 11 dígitos.')),
    }),
    deliveryAddress: z.object({
      cep: z
        .string()
        .transform(digits)
        .pipe(z.string().regex(/^\d{8}$/, 'O CEP tem 8 dígitos.')),
      street: required('Informe a rua.', 150),
      number: required('Informe o número.', 20),
      complement: z.string().trim().max(100, 'O complemento vai até 100 caracteres.'),
      neighborhood: required('Informe o bairro.', 100),
      city: required('Informe a cidade.', 100),
      state: z.string().min(1, 'Informe a UF.'),
    }),
    items: z
      .array(
        z.object({
          name: required('Informe o item.', 100),
          quantity: z
            .string()
            .trim()
            .regex(/^\d{1,3}$/, 'A quantidade vai de 1 a 999.')
            .transform(Number)
            .refine((value) => value >= 1, 'A quantidade vai de 1 a 999.'),
          unitPrice: money({ message: 'Informe um preço como 45,90.', max: 99999.99 }).refine(
            (value) => value > 0,
            'O preço precisa ser maior que zero.',
          ),
        }),
      )
      .min(1, 'Adicione pelo menos um item.'),
    deliveryFee: z
      .string()
      .transform((text) => (text.trim() === '' ? '0' : text))
      .pipe(money({ message: 'Informe uma taxa como 7,00, até R$ 999,99.', max: 999.99 })),
    payment: z.object({
      method: z.string().min(1, 'Informe a forma de pagamento.').pipe(paymentMethodSchema),
      changeFor: z.string(),
    }),
    notes: z.string().trim().max(500, 'As observações vão até 500 caracteres.'),
  })
  .transform(({ payment, ...order }, ctx) => {
    if (payment.method !== 'DINHEIRO' || payment.changeFor.trim() === '') {
      return { ...order, payment: { method: payment.method } }
    }
    const changeFor = parseDecimal(payment.changeFor)
    if (Number.isNaN(changeFor)) {
      ctx.addIssue({
        code: 'custom',
        path: ['payment', 'changeFor'],
        message: 'Informe um valor como 100,00.',
      })
      return z.NEVER
    }
    return { ...order, payment: { method: payment.method, changeFor } }
  })

export type OrderFormInput = z.input<typeof orderFormSchema>
export type NewOrderBody = z.output<typeof orderFormSchema>

export const emptyItem = { name: '', quantity: '1', unitPrice: '' }

export function emptyOrder(restaurantId: string): OrderFormInput {
  return {
    restaurantId,
    customer: { name: '', phone: '' },
    deliveryAddress: {
      cep: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
    },
    items: [emptyItem],
    deliveryFee: '',
    payment: { method: '', changeFor: '' },
    notes: '',
  }
}

/** Subtotal and total as typed so far. Unfinished numbers count as zero; the API has the last word. */
export function previewTotals({
  items,
  deliveryFee,
}: Pick<OrderFormInput, 'items' | 'deliveryFee'>): {
  subtotal: number
  fee: number
  total: number
} {
  const subtotal = items.reduce((sum, item) => {
    const price = parseDecimal(item.unitPrice)
    const quantity = Number(item.quantity)
    return Number.isNaN(price) || !Number.isInteger(quantity) ? sum : sum + price * quantity
  }, 0)
  const fee =
    deliveryFee.trim() === '' || Number.isNaN(parseDecimal(deliveryFee))
      ? 0
      : parseDecimal(deliveryFee)
  return { subtotal, fee, total: subtotal + fee }
}

/** Every form field an API error can point at, given how many item rows the form has. */
export function apiFieldPaths(itemCount: number): Path<OrderFormInput>[] {
  const itemPaths = Array.from({ length: itemCount }, (_, index) => [
    `items.${index}.name` as const,
    `items.${index}.quantity` as const,
    `items.${index}.unitPrice` as const,
  ]).flat()
  return [
    'restaurantId',
    'customer.name',
    'customer.phone',
    'deliveryAddress.cep',
    'deliveryAddress.street',
    'deliveryAddress.number',
    'deliveryAddress.complement',
    'deliveryAddress.neighborhood',
    'deliveryAddress.city',
    'deliveryAddress.state',
    'items',
    ...itemPaths,
    'deliveryFee',
    'payment.method',
    'payment.changeFor',
    'notes',
  ]
}
