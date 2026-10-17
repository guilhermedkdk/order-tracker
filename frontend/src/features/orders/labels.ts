import type { CancellationReason, OrderStatus, PaymentMethod } from './api'

// Display text only. Which transitions exist is the API's call (allowedNextStatuses).

export const STATUS_LABEL: Record<OrderStatus, string> = {
  RECEBIDO: 'Recebido',
  EM_PREPARO: 'Em preparo',
  SAIU_PARA_ENTREGA: 'Saiu para entrega',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
}

/** The button that moves an order into each status. */
export const ACTION_LABEL: Record<OrderStatus, string> = {
  RECEBIDO: 'Receber',
  EM_PREPARO: 'Iniciar preparo',
  SAIU_PARA_ENTREGA: 'Saiu para entrega',
  ENTREGUE: 'Marcar como entregue',
  CANCELADO: 'Cancelar',
}

export const CANCELLATION_REASON_LABEL: Record<CancellationReason, string> = {
  CLIENTE_DESISTIU: 'Cliente desistiu',
  CLIENTE_NAO_ENCONTRADO: 'Cliente não encontrado',
  ITEM_INDISPONIVEL: 'Item indisponível',
  FORA_DA_AREA_DE_ENTREGA: 'Fora da área de entrega',
  PROBLEMA_NO_PAGAMENTO: 'Problema no pagamento',
  OUTRO: 'Outro motivo',
}

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  PIX: 'Pix',
  CARTAO_CREDITO: 'Cartão de crédito',
  CARTAO_DEBITO: 'Cartão de débito',
  DINHEIRO: 'Dinheiro',
}
