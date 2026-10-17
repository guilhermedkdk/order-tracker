package io.github.guilhermedkdk.ordertracker.order;

import java.util.List;

/** The stage an order is in. Values follow the challenge statement, which is the API contract. */
public enum OrderStatus {
    RECEBIDO,
    EM_PREPARO,
    SAIU_PARA_ENTREGA,
    ENTREGUE,
    CANCELADO;

    /** One step forward, or cancel while the order is still in progress. Final statuses go nowhere. */
    public List<OrderStatus> next() {
        return switch (this) {
            case RECEBIDO -> List.of(EM_PREPARO, CANCELADO);
            case EM_PREPARO -> List.of(SAIU_PARA_ENTREGA, CANCELADO);
            case SAIU_PARA_ENTREGA -> List.of(ENTREGUE, CANCELADO);
            case ENTREGUE, CANCELADO -> List.of();
        };
    }
}
