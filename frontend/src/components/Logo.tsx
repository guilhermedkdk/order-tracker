import { cn } from '@/lib/utils'

/** The product mark: a route from where the order starts to where it is delivered. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={cn('size-7', className)}>
      <rect width="32" height="32" rx="8" fill="currentColor" />
      <path
        d="M9.5 22H14a4 4 0 0 0 4-4v-4a4 4 0 0 1 4-4h.5"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9.5" cy="22" r="2.75" fill="white" />
      <circle cx="22.5" cy="10" r="3.25" fill="currentColor" stroke="white" strokeWidth="2.5" />
    </svg>
  )
}

/** The mark with the product name beside it. */
export function Logo({ className, nameClassName }: { className?: string; nameClassName?: string }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <LogoMark />
      <span
        className={cn('font-heading text-[0.95rem] font-semibold tracking-tight', nameClassName)}
      >
        Rastreador de pedidos
      </span>
    </span>
  )
}
