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

/** The API sends UTC instants; people read them in São Paulo time, such as "17/10, 15:30". */
export function formatDateTime(isoInstant: string): string {
  return dateTime.format(new Date(isoInstant))
}
