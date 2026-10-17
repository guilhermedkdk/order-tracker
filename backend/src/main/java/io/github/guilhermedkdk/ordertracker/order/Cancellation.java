package io.github.guilhermedkdk.ordertracker.order;

/** Why an order was cancelled. The detail is free text and required with {@link CancellationReason#OUTRO}. */
public record Cancellation(CancellationReason reason, String detail) {}
