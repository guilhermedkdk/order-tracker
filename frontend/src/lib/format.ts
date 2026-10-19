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

/** How long ago `since` was, as a kitchen reads it: "agora", "há 12 min", "há 2 h", "há 3 dias". */
export function formatElapsed({ since, now }: { since: string; now: Date }): string {
  const minutes = Math.floor((now.getTime() - Date.parse(since)) / 60_000)
  if (minutes < 1) {
    return 'agora'
  }
  if (minutes < 60) {
    return `há ${minutes} min`
  }
  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `há ${hours} h`
  }
  const days = Math.floor(hours / 24)
  return `há ${days} ${days === 1 ? 'dia' : 'dias'}`
}
