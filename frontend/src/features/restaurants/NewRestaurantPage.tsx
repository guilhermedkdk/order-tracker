import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { z } from 'zod'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { showApiError } from '@/lib/form-errors'
import { useCreateRestaurant, useRestaurants } from './api'

const restaurantSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'O nome deve ter entre 2 e 100 caracteres.')
    .max(100, 'O nome deve ter entre 2 e 100 caracteres.'),
})

type RestaurantInput = z.infer<typeof restaurantSchema>

export function NewRestaurantPage() {
  const restaurants = useRestaurants()
  const create = useCreateRestaurant()
  const navigate = useNavigate()
  const form = useForm<RestaurantInput>({
    resolver: zodResolver(restaurantSchema),
    defaultValues: { name: '' },
  })
  const { errors, isSubmitting } = form.formState
  const isFirst = restaurants.data?.length === 0

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const restaurant = await create.mutateAsync(values)
      navigate(`/?restaurante=${restaurant.id}`, { replace: true })
    } catch (error) {
      showApiError({ form, error, fields: ['name'] })
    }
  })

  return (
    <Card className="mx-auto mt-8 max-w-md">
      <CardHeader>
        <CardTitle>
          <h1>{isFirst ? 'Crie seu primeiro restaurante' : 'Novo restaurante'}</h1>
        </CardTitle>
        <CardDescription>
          Os pedidos ficam separados por restaurante. Você pode criar outros depois.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} noValidate>
          <FieldGroup>
            {errors.root && (
              <Alert variant="destructive">
                <AlertDescription>{errors.root.message}</AlertDescription>
              </Alert>
            )}
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="restaurant-name">Nome do restaurante</FieldLabel>
              <Input id="restaurant-name" aria-invalid={!!errors.name} {...form.register('name')} />
              <FieldError errors={[errors.name]} />
            </Field>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Criando…' : 'Criar restaurante'}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
