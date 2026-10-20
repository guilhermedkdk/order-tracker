package io.github.guilhermedkdk.ordertracker.order;

import java.util.UUID;

/**
 * An order was saved with a new status: on creation, with the status it has ({@code RECEBIDO}, or
 * further along for the demo's orders in the past), and on every status change. Published inside the
 * transaction that saved it; listeners that act after the commit only ever see saved orders.
 */
public record OrderStatusChanged(UUID orderId, UUID restaurantId, OrderStatus status) {

    static OrderStatusChanged of(Order order) {
        return new OrderStatusChanged(order.id(), order.restaurantId(), order.status());
    }
}
