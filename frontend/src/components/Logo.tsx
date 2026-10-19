import { cn } from '@/lib/utils'

/**
 * The product mark: a route from where the order starts to where it is delivered. `inverted` is for
 * dark backgrounds.
 */
export function LogoMark({
  className,
  inverted = false,
}: {
  className?: string
  inverted?: boolean
}) {
  const box = inverted ? 'fill-background' : 'fill-foreground'
  const route = inverted ? 'stroke-foreground' : 'stroke-background'
  const start = inverted ? 'fill-foreground' : 'fill-background'
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={cn('size-7', className)}>
      <rect width="32" height="32" rx="8" className={box} />
      <path
        d="M9.5 22H14a4 4 0 0 0 4-4v-4a4 4 0 0 1 4-4h.5"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={route}
      />
      <circle cx="9.5" cy="22" r="2.75" className={start} />
      <circle cx="22.5" cy="10" r="3.25" strokeWidth="2.5" className={cn(box, route)} />
    </svg>
  )
}

/** The mark with the product name beside it. */
export function Logo({
  className,
  nameClassName,
  inverted = false,
}: {
  className?: string
  nameClassName?: string
  inverted?: boolean
}) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <LogoMark inverted={inverted} />
      <span
        className={cn('font-heading text-[0.95rem] font-semibold tracking-tight', nameClassName)}
      >
        Rastreador de pedidos
      </span>
    </span>
  )
}
