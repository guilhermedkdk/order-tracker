import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { z } from 'zod'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { DemoLogin } from '@/features/demo/DemoLogin'
import { showApiError } from '@/lib/form-errors'
import { useLogin, useMe } from './api'
import { AuthCard } from './AuthCard'
import { loginSchema, type LoginInput } from './schemas'

const redirectSchema = z.object({ from: z.string().startsWith('/') })

export function LoginPage() {
  const me = useMe()
  const login = useLogin()
  const navigate = useNavigate()
  const location = useLocation()
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })
  const { errors, isSubmitting } = form.formState
  const target = redirectSchema.safeParse(location.state).data?.from ?? '/'

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await login.mutateAsync(values)
      navigate(target, { replace: true })
    } catch (error) {
      showApiError({ form, error, fields: ['email', 'password'] })
    }
  })

  if (me.data) {
    return <Navigate to={target} replace />
  }

  return (
    <AuthCard title="Entrar" description="Acompanhe os pedidos dos seus restaurantes.">
      <form onSubmit={onSubmit} noValidate>
        <FieldGroup>
          {errors.root && (
            <Alert variant="destructive">
              <AlertDescription>{errors.root.message}</AlertDescription>
            </Alert>
          )}
          <Field data-invalid={!!errors.email}>
            <FieldLabel htmlFor="email">E-mail</FieldLabel>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={!!errors.email}
              {...form.register('email')}
            />
            <FieldError errors={[errors.email]} />
          </Field>
          <Field data-invalid={!!errors.password}>
            <FieldLabel htmlFor="password">Senha</FieldLabel>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              {...form.register('password')}
            />
            <FieldError errors={[errors.password]} />
          </Field>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Entrando…' : 'Entrar'}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Ainda não tem conta?{' '}
            <Link to="/cadastro" className="text-foreground underline underline-offset-4">
              Cadastre-se
            </Link>
          </p>
        </FieldGroup>
      </form>
      <div className="mt-6">
        <DemoLogin
          onLoggedIn={() => navigate(target, { replace: true })}
          onError={(message) => form.setError('root', { message })}
        />
      </div>
    </AuthCard>
  )
}
