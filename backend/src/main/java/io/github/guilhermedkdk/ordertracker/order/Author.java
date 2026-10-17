package io.github.guilhermedkdk.ordertracker.order;

import java.util.UUID;

/** Who made a change to an order. The name is kept as it was at the time. */
public record Author(UUID id, String name) {}
