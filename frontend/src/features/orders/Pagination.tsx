import { Button } from '@/components/ui/button'

/** Previous and next around "Página 2 de 3 · 45 pedidos". Pages are counted from 1. */
export function Pagination({
  page,
  totalPages,
  totalElements,
  onChange,
}: {
  page: number
  totalPages: number
  totalElements: number
  onChange: (page: number) => void
}) {
  return (
    <nav aria-label="Páginas" className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">
        Página {page} de {Math.max(totalPages, 1)} · {totalElements}{' '}
        {totalElements === 1 ? 'pedido' : 'pedidos'}
      </p>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          Anterior
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          Próxima
        </Button>
      </div>
    </nav>
  )
}
