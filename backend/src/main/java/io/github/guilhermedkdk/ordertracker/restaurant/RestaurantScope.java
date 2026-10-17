package io.github.guilhermedkdk.ordertracker.restaurant;

import java.util.Set;
import java.util.UUID;

/**
 * The restaurants a user can see. Orders, customers and the live stream ask the scope instead of
 * looking at the user's role, so the visibility rule lives in {@link RestaurantService#scopeOf}.
 */
public sealed interface RestaurantScope {

    boolean includes(UUID restaurantId);

    /** Every restaurant, which is the admin's view. */
    record All() implements RestaurantScope {

        @Override
        public boolean includes(UUID restaurantId) {
            return true;
        }
    }

    /** Only these restaurants, which is an owner's view. */
    record Only(Set<UUID> ids) implements RestaurantScope {

        public Only {
            ids = Set.copyOf(ids);
        }

        @Override
        public boolean includes(UUID restaurantId) {
            return ids.contains(restaurantId);
        }
    }
}
