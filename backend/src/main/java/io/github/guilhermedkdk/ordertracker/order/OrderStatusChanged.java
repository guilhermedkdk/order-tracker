package io.github.guilhermedkdk.ordertracker.order;

import java.util.UUID;

/**
 * An order reached a new status, its creation included, as {@code RECEBIDO}. Published inside the
 * transaction that saved it; listeners that act after the commit only ever see saved orders.
 */
public record OrderStatusChanged(UUID orderId, UUID restaurantId, OrderStatus status) {

    static OrderStatusChanged of(Order order) {
        return new OrderStatusChanged(order.id(), order.restaurantId(), order.status());
    }
}
