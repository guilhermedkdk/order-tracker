package io.github.guilhermedkdk.ordertracker.order;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

/** Where the order goes, as it was when the order was created. */
@Embeddable
public record DeliveryAddress(
        @Column(name = "address_cep") String cep,
        @Column(name = "address_street") String street,
        @Column(name = "address_number") String number,
        @Column(name = "address_complement") String complement,
        @Column(name = "address_neighborhood") String neighborhood,
        @Column(name = "address_city") String city,
        @Column(name = "address_state") String state) {}
