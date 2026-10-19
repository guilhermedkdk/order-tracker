import type { RefObject } from 'react'
import { toast } from 'sonner'
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
} from '@/components/ui/dialog'
import { useRestoreDemo } from './api'

/**
 * The admin's way back to a clean demo, after visitors have played with the shared accounts. It
 * opens from the user menu, which closes before the dialog shows, so the open state lives outside
 * and focus goes back to `returnFocus` when it closes.
 */
export function RestoreDemoDialog({
  open,
  onOpenChange,
  returnFocus,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  returnFocus: RefObject<HTMLElement | null>
}) {
  const restore = useRestoreDemo()

  function confirm() {
    restore.mutate(undefined, {
      onSuccess: () => {
        onOpenChange(false)
        toast.success('Demonstração restaurada.')
      },
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) {
          restore.reset()
        }
      }}
    >
      <DialogContent
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          returnFocus.current?.focus()
        }}
      >
        <DialogHeader>
          <DialogTitle>Restaurar a demonstração?</DialogTitle>
          <DialogDescription>
            Os restaurantes e pedidos das contas de demonstração voltam ao estado inicial. Contas
            criadas pelo cadastro não são afetadas.
          </DialogDescription>
        </DialogHeader>
        {restore.isError && (
          <Alert variant="destructive">
            <AlertDescription>{restore.error.message}</AlertDescription>
          </Alert>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Voltar</Button>
          </DialogClose>
          <Button onClick={confirm} disabled={restore.isPending}>
            {restore.isPending ? 'Restaurando…' : 'Restaurar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
