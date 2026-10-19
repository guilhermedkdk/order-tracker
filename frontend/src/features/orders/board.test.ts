import { describe, expect, it } from 'vitest'
import type { OrderPage, OrderStatus, OrderSummary } from './api'
import { arrangeBoard, resolveDrop } from './board'

function order(overrides: Partial<OrderSummary> = {}): OrderSummary {
  return {
    id: 'pedido-1',
    code: 'AAAA0001',
    restaurantId: 'pizzaria',
    restaurantName: 'Pizzaria Bella',
    status: 'RECEBIDO',
    allowedNextStatuses: ['EM_PREPARO', 'CANCELADO'],
    customerName: 'Maria Silva',
    neighborhood: 'Bela Vista',
    total: 98.8,
    createdAt: '2026-10-17T18:30:00Z',
    ...overrides,
  }
}

function pageOf(content: OrderSummary[], totalElements = content.length): OrderPage {
  return { content, page: 0, size: 20, totalElements, totalPages: 1 }
}

// Each status's first page, as the board loads them; a status left out has no orders.
function columns(pages: Partial<Record<OrderStatus, OrderPage>>) {
  const statuses: OrderStatus[] = [
    'RECEBIDO',
    'EM_PREPARO',
    'SAIU_PARA_ENTREGA',
    'ENTREGUE',
    'CANCELADO',
  ]
  return statuses.map((status) => ({ status, page: pages[status] ?? pageOf([]) }))
}

describe('dropping a card on a column', () => {
  it('moves the order only to a column among its next statuses', () => {
    const received = order()

    expect(resolveDrop({ order: received, target: 'EM_PREPARO' })).toBe('move')
    expect(resolveDrop({ order: received, target: 'SAIU_PARA_ENTREGA' })).toBe('ignore')
    expect(resolveDrop({ order: received, target: 'RECEBIDO' })).toBe('ignore')
  })

  it('asks for the reason instead of moving when the column is the cancelled one', () => {
    expect(resolveDrop({ order: order(), target: 'CANCELADO' })).toBe('ask-reason')
    expect(
      resolveDrop({
        order: order({ status: 'ENTREGUE', allowedNextStatuses: [] }),
        target: 'CANCELADO',
      }),
    ).toBe('ignore')
  })
})

describe('arranging the board', () => {
  it('shows each order in its status column, with the total the API counted', () => {
    const received = order()
    const preparing = order({ id: 'pedido-2', code: 'AAAA0002', status: 'EM_PREPARO' })

    const board = arrangeBoard({
      columns: columns({ RECEBIDO: pageOf([received]), EM_PREPARO: pageOf([preparing], 23) }),
      pending: new Map(),
    })

    expect(
      board.map(({ status, cards, total }) => [status, cards.map((c) => c.code), total]),
    ).toEqual([
      ['RECEBIDO', ['AAAA0001'], 1],
      ['EM_PREPARO', ['AAAA0002'], 23],
      ['SAIU_PARA_ENTREGA', [], 0],
      ['ENTREGUE', [], 0],
      ['CANCELADO', [], 0],
    ])
  })

  it('shows a move still on its way in the new column, newest first, with both totals adjusted', () => {
    const moving = order({ createdAt: '2026-10-17T18:30:00Z' })
    const older = order({
      id: 'pedido-2',
      code: 'AAAA0002',
      status: 'EM_PREPARO',
      createdAt: '2026-10-17T18:00:00Z',
    })
    const newer = order({
      id: 'pedido-3',
      code: 'AAAA0003',
      status: 'EM_PREPARO',
      createdAt: '2026-10-17T18:45:00Z',
    })

    const board = arrangeBoard({
      columns: columns({
        RECEBIDO: pageOf([moving], 4),
        EM_PREPARO: pageOf([newer, older], 9),
      }),
      pending: new Map([['pedido-1', 'EM_PREPARO']]),
    })

    expect(board[0]).toMatchObject({ status: 'RECEBIDO', cards: [], total: 3 })
    expect(board[1]?.cards.map((c) => c.code)).toEqual(['AAAA0003', 'AAAA0001', 'AAAA0002'])
    expect(board[1]?.total).toBe(10)
  })

  it('shows an order once while its old and new columns reload at different times', () => {
    const stale = order()
    const fresh = order({ status: 'EM_PREPARO', allowedNextStatuses: ['SAIU_PARA_ENTREGA'] })

    const board = arrangeBoard({
      columns: columns({ RECEBIDO: pageOf([stale]), EM_PREPARO: pageOf([fresh]) }),
      pending: new Map(),
    })

    expect(board.flatMap((column) => column.cards)).toHaveLength(1)
    expect(board.reduce((sum, column) => sum + column.total, 0)).toBe(1)
  })
})
