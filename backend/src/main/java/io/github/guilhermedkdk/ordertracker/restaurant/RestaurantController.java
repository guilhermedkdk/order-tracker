package io.github.guilhermedkdk.ordertracker.restaurant;

import io.github.guilhermedkdk.ordertracker.auth.CurrentUser;
import io.github.guilhermedkdk.ordertracker.auth.UserDirectory;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/restaurants")
class RestaurantController {

    private final RestaurantService restaurants;
    private final UserDirectory users;

    RestaurantController(RestaurantService restaurants, UserDirectory users) {
        this.restaurants = restaurants;
        this.users = users;
    }

    @GetMapping
    List<RestaurantResponse> list(CurrentUser user) {
        List<Restaurant> visible = restaurants.visible(restaurants.scopeOf(user));
        Map<UUID, String> owners =
                users.namesOf(visible.stream().map(Restaurant::ownerId).toList());
        return visible.stream()
                .map(restaurant -> RestaurantResponse.of(restaurant, owners.get(restaurant.ownerId())))
                .toList();
    }

    @PostMapping
    ResponseEntity<RestaurantResponse> create(CurrentUser user, @Valid @RequestBody CreateRestaurantRequest request) {
        UUID id = restaurants.create(user, request.name());
        return ResponseEntity.created(URI.create("/api/restaurants/" + id))
                .body(new RestaurantResponse(id, request.name(), user.name()));
    }

    record CreateRestaurantRequest(
            @NotBlank(message = "Informe o nome do restaurante.")
            @Size(min = 2, max = 100, message = "O nome deve ter entre 2 e 100 caracteres.")
            String name) {

        CreateRestaurantRequest {
            name = name == null ? null : name.strip();
        }
    }

    record RestaurantResponse(UUID id, String name, String ownerName) {

        static RestaurantResponse of(Restaurant restaurant, String ownerName) {
            return new RestaurantResponse(restaurant.id(), restaurant.name(), ownerName);
        }
    }
}
