package io.github.guilhermedkdk.ordertracker.restaurant;

import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

interface RestaurantRepository extends JpaRepository<Restaurant, UUID> {

    @Query("select r.id from Restaurant r where r.ownerId = :ownerId")
    List<UUID> findIdsByOwnerId(UUID ownerId);

    List<Restaurant> findAllByOrderByNameAsc();

    List<Restaurant> findByIdInOrderByNameAsc(Collection<UUID> ids);

    // The database cascades to orders, their items and their history (V3 migration).
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("delete from Restaurant r where r.ownerId in :ownerIds")
    int deleteByOwnerIdIn(Collection<UUID> ownerIds);
}
