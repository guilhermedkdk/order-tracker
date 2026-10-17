package io.github.guilhermedkdk.ordertracker.order;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

/** The customer as recorded on the order when it was created. Phone is digits only, with area code. */
@Embeddable
public record OrderCustomer(
        @Column(name = "customer_name") String name,
        @Column(name = "customer_phone") String phone) {}
