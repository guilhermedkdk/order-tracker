package io.github.guilhermedkdk.ordertracker.restaurant;

import io.github.guilhermedkdk.ordertracker.auth.CurrentUser;
import io.github.guilhermedkdk.ordertracker.shared.ForbiddenException;
import java.time.Clock;
import java.util.HashSet;
import java.util.List;
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

    @Transactional(readOnly = true)
    List<Restaurant> visible(RestaurantScope scope) {
        return switch (scope) {
            case RestaurantScope.All() -> restaurants.findAllByOrderByNameAsc();
            case RestaurantScope.Only(var ids) -> restaurants.findByIdInOrderByNameAsc(ids);
        };
    }

    @Transactional
    Restaurant create(CurrentUser owner, String name) {
        if (owner.isAdmin()) {
            throw new ForbiddenException("Só donos criam restaurantes.");
        }
        return restaurants.save(new Restaurant(name, owner.id(), clock.instant()));
    }
}
