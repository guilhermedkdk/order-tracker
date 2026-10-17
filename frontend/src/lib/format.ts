const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

const dateTime = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})

/** "R$ 1.234,56". */
export function formatMoney(value: number): string {
  return money.format(value)
}

/** "(11) 98765-4321" for 11 digits, "(11) 3333-4444" for 10. Other lengths come back as they are. */
export function formatPhone(digits: string): string {
  const match = /^(\d{2})(\d{4,5})(\d{4})$/.exec(digits)
  return match ? `(${match[1]}) ${match[2]}-${match[3]}` : digits
}

/** "01310-100". */
export function formatCep(digits: string): string {
  return /^\d{8}$/.test(digits) ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits
}

/** The API sends UTC instants; people read them in São Paulo time, such as "17/10, 15:30". */
export function formatDateTime(isoInstant: string): string {
  return dateTime.format(new Date(isoInstant))
}
