import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'
import { showApiError } from '@/lib/form-errors'
import { cancellationReasonSchema, useChangeStatus, type OrderActionTarget } from './api'
import { CANCELLATION_REASON_LABEL } from './labels'

// Mirrors the API rules so the dialog answers at once; the API still checks them.
const cancelSchema = z
  .object({
    cancellationReason: z
      .string()
      .min(1, 'Informe o motivo do cancelamento.')
      .pipe(cancellationReasonSchema),
    cancellationDetail: z.string().trim().max(300, 'O detalhe vai até 300 caracteres.'),
  })
  .refine((value) => value.cancellationReason !== 'OUTRO' || value.cancellationDetail !== '', {
    path: ['cancellationDetail'],
    message: 'Descreva o motivo do cancelamento.',
  })

type CancelInput = z.input<typeof cancelSchema>
type CancelOutput = z.output<typeof cancelSchema>

export function CancelOrderDialog({ order }: { order: OrderActionTarget }) {
  const [open, setOpen] = useState(false)
  const change = useChangeStatus()
  const form = useForm<CancelInput, unknown, CancelOutput>({
    resolver: zodResolver(cancelSchema),
    defaultValues: { cancellationReason: '', cancellationDetail: '' },
  })
  const { errors, isSubmitting } = form.formState

  const onSubmit = form.handleSubmit(async ({ cancellationReason, cancellationDetail }) => {
    try {
      await change.mutateAsync({
        orderId: order.id,
        status: 'CANCELADO',
        cancellationReason,
        cancellationDetail: cancellationDetail || undefined,
      })
      setOpen(false)
    } catch (error) {
      showApiError({ form, error, fields: ['cancellationReason', 'cancellationDetail'] })
    }
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) {
          form.reset()
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="text-destructive">
          Cancelar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Cancelar o pedido #{order.code}</DialogTitle>
            <DialogDescription>
              O cancelamento é definitivo e fica registrado no histórico do pedido.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            {errors.root && (
              <Alert variant="destructive">
                <AlertDescription>{errors.root.message}</AlertDescription>
              </Alert>
            )}
            <Field data-invalid={!!errors.cancellationReason}>
              <FieldLabel htmlFor="cancellation-reason">Motivo</FieldLabel>
              <NativeSelect
                id="cancellation-reason"
                className="w-full"
                aria-invalid={!!errors.cancellationReason}
                {...form.register('cancellationReason')}
              >
                <NativeSelectOption value="">Escolha o motivo</NativeSelectOption>
                {cancellationReasonSchema.options.map((reason) => (
                  <NativeSelectOption key={reason} value={reason}>
                    {CANCELLATION_REASON_LABEL[reason]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <FieldError errors={[errors.cancellationReason]} />
            </Field>
            <Field data-invalid={!!errors.cancellationDetail}>
              <FieldLabel htmlFor="cancellation-detail">Detalhe</FieldLabel>
              <Textarea
                id="cancellation-detail"
                rows={3}
                aria-invalid={!!errors.cancellationDetail}
                {...form.register('cancellationDetail')}
              />
              <FieldDescription>Opcional, a não ser com "Outro motivo".</FieldDescription>
              <FieldError errors={[errors.cancellationDetail]} />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Voltar
              </Button>
            </DialogClose>
            <Button type="submit" variant="destructive" disabled={isSubmitting}>
              Confirmar cancelamento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
