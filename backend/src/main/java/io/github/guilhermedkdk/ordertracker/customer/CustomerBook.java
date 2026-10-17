package io.github.guilhermedkdk.ordertracker.customer;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Each restaurant's customers, by phone. It only fills the next order: an order keeps its own copy
 * of the customer and never reads this back.
 */
@Service
public class CustomerBook {

    private final CustomerRepository customers;

    CustomerBook(CustomerRepository customers) {
        this.customers = customers;
    }

    /** Records the customer of an order placed at {@code at}, unless a newer order already did. */
    @Transactional
    public void remember(UUID restaurantId, String name, String phone, CustomerAddress address, Instant at) {
        customers.upsert(
                UUID.randomUUID(),
                restaurantId,
                phone,
                name,
                address.cep(),
                address.street(),
                address.number(),
                address.complement(),
                address.neighborhood(),
                address.city(),
                address.state(),
                at);
    }

    @Transactional(readOnly = true)
    Optional<Customer> lookup(UUID restaurantId, String phone) {
        return customers.findByRestaurantIdAndPhone(restaurantId, phone);
    }
}
