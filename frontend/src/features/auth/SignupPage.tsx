import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate } from 'react-router'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { showApiError } from '@/lib/form-errors'
import { useMe, useSignup } from './api'
import { AuthLayout } from './AuthLayout'
import { signupSchema, type SignupInput } from './schemas'

export function SignupPage() {
  const me = useMe()
  const signup = useSignup()
  const navigate = useNavigate()
  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', password: '' },
  })
  const { errors, isSubmitting } = form.formState

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await signup.mutateAsync(values)
      navigate('/', { replace: true })
    } catch (error) {
      showApiError({ form, error, fields: ['name', 'email', 'password'] })
    }
  })

  if (me.data) {
    return <Navigate to="/" replace />
  }

  return (
    <AuthLayout
      title="Criar conta"
      description="Cadastre-se para registrar os pedidos dos seus restaurantes."
    >
      <form onSubmit={onSubmit} noValidate>
        <FieldGroup>
          {errors.root && (
            <Alert variant="destructive">
              <AlertDescription>{errors.root.message}</AlertDescription>
            </Alert>
          )}
          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="name">Nome</FieldLabel>
            <Input
              id="name"
              autoComplete="name"
              aria-invalid={!!errors.name}
              {...form.register('name')}
            />
            <FieldError errors={[errors.name]} />
          </Field>
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
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              {...form.register('password')}
            />
            <FieldDescription>De 8 a 72 caracteres.</FieldDescription>
            <FieldError errors={[errors.password]} />
          </Field>
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? 'Criando conta…' : 'Criar conta'}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Já tem conta?{' '}
            <Link to="/entrar" className="text-foreground underline underline-offset-4">
              Entrar
            </Link>
          </p>
        </FieldGroup>
      </form>
    </AuthLayout>
  )
}
