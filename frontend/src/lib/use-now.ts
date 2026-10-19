import { useEffect, useState } from 'react'

/** The current time, refreshed every `intervalMs`, for texts such as "há 5 min" to keep up. */
export function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(timer)
  }, [intervalMs])
  return now
}
