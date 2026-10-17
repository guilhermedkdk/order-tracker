package io.github.guilhermedkdk.ordertracker.order;

import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import java.time.Instant;
import java.util.UUID;

/** One entry of the status history. The cancellation fields are set only when the order is cancelled. */
@Embeddable
public record StatusChange(
        @Enumerated(EnumType.STRING) OrderStatus status,
        Instant changedAt,
        UUID authorId,
        String authorName,
        @Enumerated(EnumType.STRING) CancellationReason cancellationReason,
        String cancellationDetail) {}
