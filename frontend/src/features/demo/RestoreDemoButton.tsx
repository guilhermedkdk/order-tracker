import { useEffect, useState } from 'react'
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
import { useRestoreDemo } from './api'

const DONE_MESSAGE_MS = 4000

/** The admin's way back to a clean demo, after visitors have played with the shared accounts. */
export function RestoreDemoButton() {
  const [open, setOpen] = useState(false)
  const [done, setDone] = useState(false)
  const restore = useRestoreDemo()

  useEffect(() => {
    if (!done) {
      return
    }
    const timer = setTimeout(() => setDone(false), DONE_MESSAGE_MS)
    return () => clearTimeout(timer)
  }, [done])

  function confirm() {
    restore.mutate(undefined, {
      onSuccess: () => {
        setOpen(false)
        setDone(true)
      },
    })
  }

  return (
    <div className="flex items-center gap-2">
      {done && (
        <output className="text-sm text-emerald-700 dark:text-emerald-300">
          Demonstração restaurada.
        </output>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm">
            Restaurar demonstração
          </Button>
        </DialogTrigger>
        <DialogContent>
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
    </div>
  )
}
