package io.github.guilhermedkdk.ordertracker.order;

import jakarta.persistence.Embeddable;
import java.math.BigDecimal;

/** One line of the order. The name is typed freely; there is no menu. */
@Embeddable
public record OrderItem(String name, int quantity, BigDecimal unitPrice) {

    BigDecimal lineTotal() {
        return unitPrice.multiply(BigDecimal.valueOf(quantity));
    }
}
