package io.github.guilhermedkdk.ordertracker.restaurant;

import io.github.guilhermedkdk.ordertracker.auth.CurrentUser;
import io.github.guilhermedkdk.ordertracker.shared.ForbiddenException;
import io.github.guilhermedkdk.ordertracker.shared.NotFoundException;
import java.time.Clock;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Restaurants and the one rule that decides which of them a user can see. */
@Service
public class RestaurantService {

    private final RestaurantRepository restaurants;
    private final Clock clock;

    RestaurantService(RestaurantRepository restaurants, Clock clock) {
        this.restaurants = restaurants;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public RestaurantScope scopeOf(CurrentUser user) {
        if (user.isAdmin()) {
            return new RestaurantScope.All();
        }
        return new RestaurantScope.Only(new HashSet<>(restaurants.findIdsByOwnerId(user.id())));
    }

    /** Answers 404 unless the restaurant exists and is in the scope, so its existence never leaks. */
    @Transactional(readOnly = true)
    public void requireVisible(RestaurantScope scope, UUID restaurantId) {
        if (!scope.includes(restaurantId) || !restaurants.existsById(restaurantId)) {
            throw new NotFoundException("Restaurante não encontrado.");
        }
    }

    @Transactional(readOnly = true)
    public Map<UUID, String> namesOf(Collection<UUID> ids) {
        return restaurants.findAllById(ids).stream().collect(Collectors.toMap(Restaurant::id, Restaurant::name));
    }

    /**
     * Deletes every restaurant of these owners, with their orders. Only restoring the demo calls
     * this; nothing else in the system deletes data.
     */
    @Transactional
    public void deleteAllOwnedBy(Collection<UUID> ownerIds) {
        restaurants.deleteByOwnerIdIn(ownerIds);
    }

    @Transactional(readOnly = true)
    List<Restaurant> visible(RestaurantScope scope) {
        return switch (scope) {
            case RestaurantScope.All() -> restaurants.findAllByOrderByNameAsc();
            case RestaurantScope.Only(var ids) -> restaurants.findByIdInOrderByNameAsc(ids);
        };
    }

    /** Opens a restaurant owned by {@code owner} and returns its id. Admins own no restaurants. */
    @Transactional
    public UUID create(CurrentUser owner, String name) {
        if (owner.isAdmin()) {
            throw new ForbiddenException("Só donos criam restaurantes.");
        }
        return restaurants
                .save(new Restaurant(name, owner.id(), clock.instant()))
                .id();
    }
}
