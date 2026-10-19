package io.github.guilhermedkdk.ordertracker.customer;

import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

// Read-only here: rows are written by the upsert in CustomerRepository.
@Entity
@Table(name = "customers")
class Customer {

    @Id
    private UUID id;

    private UUID restaurantId;
    private String phone;
    private String name;

    @Embedded
    private CustomerAddress lastAddress;

    private Instant lastOrderAt;

    protected Customer() {}

    String phone() {
        return phone;
    }

    String name() {
        return name;
    }

    CustomerAddress lastAddress() {
        return lastAddress;
    }
}
