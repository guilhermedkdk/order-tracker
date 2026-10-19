package io.github.guilhermedkdk.ordertracker.customer;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

/** The address of a customer's newest order, used to fill the next one. */
@Embeddable
public record CustomerAddress(
        @Column(name = "address_cep") String cep,
        @Column(name = "address_street") String street,
        @Column(name = "address_number") String number,
        @Column(name = "address_complement") String complement,
        @Column(name = "address_neighborhood") String neighborhood,
        @Column(name = "address_city") String city,
        @Column(name = "address_state") String state) {}
