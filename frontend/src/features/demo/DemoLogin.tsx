import { Button } from '@/components/ui/button'
import { FieldSeparator } from '@/components/ui/field'
import { useLogin } from '@/features/auth/api'
import { ApiError } from '@/lib/http'
import { DEMO_ADMIN_EMAIL, DEMO_OWNER_EMAIL, DEMO_PASSWORD } from './api'

/** One-click sign-in with the public demo accounts, for whoever is evaluating the app. */
export function DemoLogin({
  onLoggedIn,
  onError,
}: {
  onLoggedIn: () => void
  onError: (message: string) => void
}) {
  const login = useLogin()

  function enterAs(email: string) {
    login.mutate(
      { email, password: DEMO_PASSWORD },
      {
        onSuccess: onLoggedIn,
        onError: (error) => onError(error instanceof ApiError ? error.message : 'Algo deu errado.'),
      },
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <FieldSeparator>ou use uma conta de demonstração</FieldSeparator>
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={login.isPending}
          onClick={() => enterAs(DEMO_OWNER_EMAIL)}
        >
          Entrar como dono
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={login.isPending}
          onClick={() => enterAs(DEMO_ADMIN_EMAIL)}
        >
          Entrar como admin
        </Button>
      </div>
    </div>
  )
}
