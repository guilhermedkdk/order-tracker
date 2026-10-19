import { ChevronDown, LogOut, RotateCcw, Store } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useLogout, type User } from '@/features/auth/api'
import { RestoreDemoDialog } from '@/features/demo/RestoreDemoDialog'

/** Who is signed in, and what they can do from anywhere: new restaurant, restore the demo, sign out. */
export function UserMenu({ user }: { user: User }) {
  const logout = useLogout()
  const navigate = useNavigate()
  const [restoring, setRestoring] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)

  async function signOut() {
    await logout.mutateAsync()
    navigate('/entrar', { replace: true })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button ref={trigger} variant="ghost" className="h-9 gap-2 px-1.5 sm:pr-2.5">
            <span
              aria-hidden="true"
              className="flex size-7 items-center justify-center rounded-full bg-foreground text-[0.7rem] font-semibold text-background"
            >
              {initials(user.name)}
            </span>
            <span className="sr-only sm:not-sr-only">{user.name}</span>
            <ChevronDown className="text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel className="flex flex-col gap-0.5 py-1.5">
            <span className="text-sm font-medium text-foreground">{user.name}</span>
            <span className="truncate text-xs font-normal">{user.email}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {user.role === 'DONO' && (
            <DropdownMenuItem asChild>
              <Link to="/restaurantes/novo">
                <Store />
                Novo restaurante
              </Link>
            </DropdownMenuItem>
          )}
          {user.role === 'ADMIN' && (
            <DropdownMenuItem onSelect={() => setRestoring(true)}>
              <RotateCcw />
              Restaurar demonstração
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={logout.isPending} onSelect={signOut}>
            <LogOut />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {user.role === 'ADMIN' && (
        <RestoreDemoDialog open={restoring} onOpenChange={setRestoring} returnFocus={trigger} />
      )}
    </>
  )
}

// "Ana Souza" → "AS"; a single name gives its first letter.
function initials(name: string): string {
  const words = name.trim().split(/\s+/)
  const first = words[0]?.[0] ?? ''
  const last = words.length > 1 ? (words.at(-1)?.[0] ?? '') : ''
  return (first + last).toUpperCase()
}
