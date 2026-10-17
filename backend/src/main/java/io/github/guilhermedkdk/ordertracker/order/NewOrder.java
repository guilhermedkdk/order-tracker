package io.github.guilhermedkdk.ordertracker.order;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/** What it takes to create an order. Totals are not here: the order computes them. */
public record NewOrder(
        UUID restaurantId,
        OrderCustomer customer,
        DeliveryAddress deliveryAddress,
        List<OrderItem> items,
        BigDecimal deliveryFee,
        Payment payment,
        String notes) {}
