import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, type ReactNode } from 'react'
import { useForm, useWatch, type FieldError as FormFieldError } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { ControlledSelect } from '@/components/ControlledSelect'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useSelectedRestaurant } from '@/features/restaurants/selection'
import { formatMoney } from '@/lib/format'
import { showApiError } from '@/lib/form-errors'
import { paymentMethodSchema, useCreateOrder } from './api'
import { BackToOrders } from './BackToOrders'
import { ItemsFields } from './ItemsFields'
import { useCepAutofill } from './useCepAutofill'
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

const CEP_HINT = {
  idle: undefined,
  loading: 'Buscando o endereço…',
  found: undefined,
  'not-found': 'CEP não encontrado. Preencha o endereço.',
  failed: 'Não foi possível consultar o CEP. Preencha o endereço.',
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
  const cep = useCepAutofill(form)

  const onSubmit = form.handleSubmit(async (body) => {
    try {
      const order = await create.mutateAsync(body)
      toast.success(`Pedido #${order.code} registrado.`)
      navigate({ pathname: '/pedidos', search })
    } catch (error) {
      showApiError({ form, error, fields: apiFieldPaths(items.length) })
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <BackToOrders />
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Novo pedido{fixedRestaurant ? ` em ${fixedRestaurant.name}` : ''}
          </h1>
          <p className="text-sm text-muted-foreground">
            O total ao lado é uma prévia; o que vale é o calculado ao registrar.
          </p>
        </div>
      </header>
      {errors.root && (
        <Alert variant="destructive">
          <AlertDescription>{errors.root.message}</AlertDescription>
        </Alert>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="flex flex-col gap-6">
          {!fixedRestaurant && (
            <Section title="Restaurante">
              <Labeled id="restaurant" label="Restaurante" hideLabel error={errors.restaurantId}>
                <ControlledSelect
                  control={form.control}
                  name="restaurantId"
                  id="restaurant"
                  placeholder="Escolha o restaurante"
                  invalid={!!errors.restaurantId}
                  options={restaurants.map((restaurant) => ({
                    value: restaurant.id,
                    label: (
                      <>
                        {restaurant.name}
                        <span className="text-muted-foreground"> · {restaurant.ownerName}</span>
                      </>
                    ),
                  }))}
                />
              </Labeled>
            </Section>
          )}

          <Section
            title="Cliente"
            description="Pelo telefone, quem já pediu neste restaurante é preenchido sozinho."
          >
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

          <Section
            title="Endereço de entrega"
            description="O CEP preenche rua, bairro, cidade e UF."
          >
            <div className="grid gap-4 sm:grid-cols-6">
              <Labeled
                id="cep"
                label="CEP"
                error={errors.deliveryAddress?.cep}
                description={CEP_HINT[cep.status]}
                className="sm:col-span-2"
              >
                <Input
                  id="cep"
                  inputMode="numeric"
                  placeholder="01310-100"
                  aria-invalid={!!errors.deliveryAddress?.cep}
                  {...form.register('deliveryAddress.cep', { onChange: cep.onCepChange })}
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
                <ControlledSelect
                  control={form.control}
                  name="deliveryAddress.state"
                  id="state"
                  placeholder="--"
                  invalid={!!errors.deliveryAddress?.state}
                  options={STATES.map((state) => ({ value: state, label: state }))}
                />
              </Labeled>
            </div>
          </Section>

          <Section title="Itens">
            <ItemsFields form={form} />
          </Section>

          <Section title="Observações" description="Opcional, para o restaurante ou o entregador.">
            <Labeled id="notes" label="Observações" hideLabel error={errors.notes}>
              <Textarea
                id="notes"
                rows={2}
                aria-invalid={!!errors.notes}
                {...form.register('notes')}
              />
            </Labeled>
          </Section>
        </div>

        <div className="flex flex-col gap-6 lg:sticky lg:top-24">
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
                <ControlledSelect
                  control={form.control}
                  name="payment.method"
                  id="payment-method"
                  placeholder="Escolha"
                  invalid={!!errors.payment?.method}
                  options={paymentMethodSchema.options.map((option) => ({
                    value: option,
                    label: PAYMENT_LABEL[option],
                  }))}
                />
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
              <dl className="grid grid-cols-2 gap-x-2 gap-y-1.5 border-t pt-4 text-sm">
                <dt className="text-muted-foreground">Itens</dt>
                <dd className="text-right tabular-nums">{formatMoney(totals.subtotal)}</dd>
                <dt className="text-muted-foreground">Entrega</dt>
                <dd className="text-right tabular-nums">{formatMoney(totals.fee)}</dd>
                <dt className="self-end pt-1 font-medium">Total</dt>
                <dd className="pt-1 text-right text-lg font-semibold tabular-nums">
                  {formatMoney(totals.total)}
                </dd>
              </dl>
              <div className="flex flex-col gap-2">
                <Button type="submit" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? 'Registrando…' : 'Registrar pedido'}
                </Button>
                <Button asChild variant="ghost" size="lg">
                  <Link to={{ pathname: '/pedidos', search }}>Cancelar</Link>
                </Button>
              </div>
            </FieldGroup>
          </Section>
        </div>
      </div>
    </form>
  )
}

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{title}</h2>
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function Labeled({
  id,
  label,
  error,
  hideLabel = false,
  description,
  className,
  children,
}: {
  id: string
  label: string
  // For a field alone in a section whose title already says what it is.
  hideLabel?: boolean
  error: FormFieldError | undefined
  description?: string
  className?: string
  children: ReactNode
}) {
  return (
    <Field data-invalid={!!error} className={className}>
      <FieldLabel htmlFor={id} className={hideLabel ? 'sr-only' : undefined}>
        {label}
      </FieldLabel>
      {children}
      {description && <FieldDescription>{description}</FieldDescription>}
      <FieldError errors={[error]} />
    </Field>
  )
}
