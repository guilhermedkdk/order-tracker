package io.github.guilhermedkdk.ordertracker.order;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

/**
 * Public only so the demo data can save orders with past timestamps. Everything else goes through
 * {@link OrderService}, which applies the visibility rule.
 */
public interface OrderRepository extends JpaRepository<Order, UUID>, JpaSpecificationExecutor<Order> {

    @EntityGraph(attributePaths = {"items", "statusHistory"})
    Optional<Order> findWithDetailsById(UUID id);
}
