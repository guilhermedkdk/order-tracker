package io.github.guilhermedkdk.ordertracker.customer;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

interface CustomerRepository extends JpaRepository<Customer, UUID> {

    Optional<Customer> findByRestaurantIdAndPhone(UUID restaurantId, String phone);

    // One atomic statement, so two first orders from the same phone at once cannot both insert. An
    // older order arriving later does not overwrite a newer one.
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(nativeQuery = true, value = """
            insert into customers (id, restaurant_id, phone, name, address_cep, address_street,
                address_number, address_complement, address_neighborhood, address_city, address_state,
                last_order_at)
            values (:id, :restaurantId, :phone, :name, :cep, :street, :number, :complement,
                :neighborhood, :city, :state, :at)
            on conflict (restaurant_id, phone) do update set
                name = excluded.name,
                address_cep = excluded.address_cep,
                address_street = excluded.address_street,
                address_number = excluded.address_number,
                address_complement = excluded.address_complement,
                address_neighborhood = excluded.address_neighborhood,
                address_city = excluded.address_city,
                address_state = excluded.address_state,
                last_order_at = excluded.last_order_at
            where customers.last_order_at <= excluded.last_order_at
            """)
    void upsert(
            UUID id,
            UUID restaurantId,
            String phone,
            String name,
            String cep,
            String street,
            String number,
            String complement,
            String neighborhood,
            String city,
            String state,
            Instant at);
}
