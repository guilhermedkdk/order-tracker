import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, type ReactNode } from 'react'
import { useForm, useWatch, type FieldError as FormFieldError } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'
import { useSelectedRestaurant } from '@/features/restaurants/selection'
import { formatMoney } from '@/lib/format'
import { showApiError } from '@/lib/form-errors'
import { paymentMethodSchema, useCreateOrder } from './api'
import { ItemsFields } from './ItemsFields'
import { useCustomerAutofill } from './useCustomerAutofill'
import { PAYMENT_LABEL } from './labels'
import {
  apiFieldPaths,
  emptyOrder,
  orderFormSchema,
  previewTotals,
  STATES,
  type NewOrderBody,
  type OrderFormInput,
} from './order-form'

const CUSTOMER_HINT = {
  idle: undefined,
  found: 'Cliente encontrado: preenchemos os campos vazios com o último pedido.',
  new: 'Cliente novo neste restaurante.',
} as const

export function NewOrderPage() {
  const { selection, restaurants } = useSelectedRestaurant()
  const create = useCreateOrder()
  const navigate = useNavigate()
  const { search } = useLocation()
  const fixedRestaurant = selection.kind === 'one' ? selection.restaurant : undefined
  const form = useForm<OrderFormInput, unknown, NewOrderBody>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: emptyOrder(fixedRestaurant?.id ?? ''),
  })
  const { errors, isSubmitting } = form.formState
  const fixedRestaurantId = fixedRestaurant?.id
  // The header picker can change while the form is open; the order follows it.
  useEffect(() => {
    if (fixedRestaurantId) {
      form.setValue('restaurantId', fixedRestaurantId)
    }
  }, [fixedRestaurantId, form])
  const [items, deliveryFee, method] = useWatch({
    control: form.control,
    name: ['items', 'deliveryFee', 'payment.method'],
  })
  const totals = previewTotals({ items, deliveryFee })
  const customerLookup = useCustomerAutofill(form)

  const onSubmit = form.handleSubmit(async (body) => {
    try {
      await create.mutateAsync(body)
      navigate({ pathname: '/pedidos', search })
    } catch (error) {
      showApiError({ form, error, fields: apiFieldPaths(items.length) })
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4 py-4">
      <h1 className="font-heading text-2xl font-semibold">
        Novo pedido{fixedRestaurant ? ` em ${fixedRestaurant.name}` : ''}
      </h1>
      {errors.root && (
        <Alert variant="destructive">
          <AlertDescription>{errors.root.message}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-4">
          {!fixedRestaurant && (
            <Section title="Restaurante">
              <Labeled id="restaurant" label="Restaurante" error={errors.restaurantId}>
                <NativeSelect
                  id="restaurant"
                  className="w-full"
                  aria-invalid={!!errors.restaurantId}
                  {...form.register('restaurantId')}
                >
                  <NativeSelectOption value="">Escolha o restaurante</NativeSelectOption>
                  {restaurants.map((restaurant) => (
                    <NativeSelectOption key={restaurant.id} value={restaurant.id}>
                      {restaurant.name} · {restaurant.ownerName}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Labeled>
            </Section>
          )}

          <Section title="Cliente">
            <div className="grid gap-4 sm:grid-cols-2">
              <Labeled
                id="customer-phone"
                label="Telefone"
                error={errors.customer?.phone}
                description={CUSTOMER_HINT[customerLookup]}
              >
                <Input
                  id="customer-phone"
                  type="tel"
                  placeholder="(11) 98765-4321"
                  aria-invalid={!!errors.customer?.phone}
                  {...form.register('customer.phone')}
                />
              </Labeled>
              <Labeled id="customer-name" label="Nome do cliente" error={errors.customer?.name}>
                <Input
                  id="customer-name"
                  autoComplete="off"
                  aria-invalid={!!errors.customer?.name}
                  {...form.register('customer.name')}
                />
              </Labeled>
            </div>
          </Section>

          <Section title="Endereço de entrega">
            <div className="grid gap-4 sm:grid-cols-6">
              <Labeled
                id="cep"
                label="CEP"
                error={errors.deliveryAddress?.cep}
                className="sm:col-span-2"
              >
                <Input
                  id="cep"
                  inputMode="numeric"
                  placeholder="01310-100"
                  aria-invalid={!!errors.deliveryAddress?.cep}
                  {...form.register('deliveryAddress.cep')}
                />
              </Labeled>
              <Labeled
                id="street"
                label="Rua"
                error={errors.deliveryAddress?.street}
                className="sm:col-span-4"
              >
                <Input
                  id="street"
                  aria-invalid={!!errors.deliveryAddress?.street}
                  {...form.register('deliveryAddress.street')}
                />
              </Labeled>
              <Labeled
                id="number"
                label="Número"
                error={errors.deliveryAddress?.number}
                className="sm:col-span-2"
              >
                <Input
                  id="number"
                  aria-invalid={!!errors.deliveryAddress?.number}
                  {...form.register('deliveryAddress.number')}
                />
              </Labeled>
              <Labeled
                id="complement"
                label="Complemento"
                error={errors.deliveryAddress?.complement}
                className="sm:col-span-4"
              >
                <Input
                  id="complement"
                  aria-invalid={!!errors.deliveryAddress?.complement}
                  {...form.register('deliveryAddress.complement')}
                />
              </Labeled>
              <Labeled
                id="neighborhood"
                label="Bairro"
                error={errors.deliveryAddress?.neighborhood}
                className="sm:col-span-2"
              >
                <Input
                  id="neighborhood"
                  aria-invalid={!!errors.deliveryAddress?.neighborhood}
                  {...form.register('deliveryAddress.neighborhood')}
                />
              </Labeled>
              <Labeled
                id="city"
                label="Cidade"
                error={errors.deliveryAddress?.city}
                className="sm:col-span-3"
              >
                <Input
                  id="city"
                  aria-invalid={!!errors.deliveryAddress?.city}
                  {...form.register('deliveryAddress.city')}
                />
              </Labeled>
              <Labeled
                id="state"
                label="UF"
                error={errors.deliveryAddress?.state}
                className="sm:col-span-1"
              >
                <NativeSelect
                  id="state"
                  className="w-full"
                  aria-invalid={!!errors.deliveryAddress?.state}
                  {...form.register('deliveryAddress.state')}
                >
                  <NativeSelectOption value="">--</NativeSelectOption>
                  {STATES.map((state) => (
                    <NativeSelectOption key={state} value={state}>
                      {state}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Labeled>
            </div>
          </Section>

          <Section title="Itens">
            <ItemsFields form={form} />
          </Section>

          <Section title="Observações">
            <Labeled
              id="notes"
              label="Observações para o restaurante ou o entregador"
              error={errors.notes}
            >
              <Textarea
                id="notes"
                rows={2}
                aria-invalid={!!errors.notes}
                {...form.register('notes')}
              />
            </Labeled>
          </Section>
        </div>

        <div className="flex flex-col gap-4 lg:sticky lg:top-4 lg:self-start">
          <Section title="Pagamento">
            <FieldGroup>
              <Labeled id="delivery-fee" label="Taxa de entrega" error={errors.deliveryFee}>
                <Input
                  id="delivery-fee"
                  inputMode="decimal"
                  placeholder="0,00"
                  aria-invalid={!!errors.deliveryFee}
                  {...form.register('deliveryFee')}
                />
              </Labeled>
              <Labeled
                id="payment-method"
                label="Forma de pagamento"
                error={errors.payment?.method}
              >
                <NativeSelect
                  id="payment-method"
                  className="w-full"
                  aria-invalid={!!errors.payment?.method}
                  {...form.register('payment.method')}
                >
                  <NativeSelectOption value="">Escolha</NativeSelectOption>
                  {paymentMethodSchema.options.map((option) => (
                    <NativeSelectOption key={option} value={option}>
                      {PAYMENT_LABEL[option]}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Labeled>
              {method === 'DINHEIRO' && (
                <Labeled id="change-for" label="Troco para" error={errors.payment?.changeFor}>
                  <Input
                    id="change-for"
                    inputMode="decimal"
                    placeholder="Deixe vazio se não precisar"
                    aria-invalid={!!errors.payment?.changeFor}
                    {...form.register('payment.changeFor')}
                  />
                </Labeled>
              )}
              <dl className="grid grid-cols-2 gap-1 border-t pt-3 text-sm">
                <dt className="text-muted-foreground">Itens</dt>
                <dd className="text-right tabular-nums">{formatMoney(totals.subtotal)}</dd>
                <dt className="text-muted-foreground">Entrega</dt>
                <dd className="text-right tabular-nums">{formatMoney(totals.fee)}</dd>
                <dt className="font-medium">Total</dt>
                <dd className="text-right font-semibold tabular-nums">
                  {formatMoney(totals.total)}
                </dd>
              </dl>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Registrando…' : 'Registrar pedido'}
              </Button>
            </FieldGroup>
          </Section>
        </div>
      </div>
    </form>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{title}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function Labeled({
  id,
  label,
  error,
  description,
  className,
  children,
}: {
  id: string
  label: string
  error: FormFieldError | undefined
  description?: string
  className?: string
  children: ReactNode
}) {
  return (
    <Field data-invalid={!!error} className={className}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {children}
      {description && <FieldDescription>{description}</FieldDescription>}
      <FieldError errors={[error]} />
    </Field>
  )
}
