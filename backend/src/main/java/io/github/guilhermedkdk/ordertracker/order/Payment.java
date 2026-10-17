package io.github.guilhermedkdk.ordertracker.order;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import java.math.BigDecimal;

/** How the customer pays. {@code changeFor} is the cash amount handed over, so it only goes with cash. */
@Embeddable
public record Payment(
        @Enumerated(EnumType.STRING) @Column(name = "payment_method")
        PaymentMethod method,

        @Column(name = "change_for") BigDecimal changeFor) {}
