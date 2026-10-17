package io.github.guilhermedkdk.ordertracker.order;

import java.util.UUID;

/** Optional narrowing of the order list. A null field does not filter. */
public record OrderFilter(UUID restaurantId, OrderStatus status) {}
