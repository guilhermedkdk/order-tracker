package io.github.guilhermedkdk.ordertracker.restaurant;

import static org.assertj.core.api.Assertions.assertThat;

import io.github.guilhermedkdk.ordertracker.ApiSession;
import io.github.guilhermedkdk.ordertracker.IntegrationTest;
import io.github.guilhermedkdk.ordertracker.TestAccounts;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

@IntegrationTest
class RestaurantApiTests {

    @Autowired
    TestAccounts accounts;

    @Test
    void ownerCreatesRestaurantAndSeesItInTheList() {
        var owner = accounts.owner("Ana Souza");

        var created = create(owner, "Pizzaria Bella");

        assertThat(created).hasStatus(HttpStatus.CREATED);
        assertThat(created).bodyJson().extractingPath("$.name").isEqualTo("Pizzaria Bella");
        assertThat(owner.get("/api/restaurants"))
                .bodyJson()
                .extractingPath("$[*].name")
                .asArray()
                .containsExactly("Pizzaria Bella");
    }

    @Test
    void ownerDoesNotSeeAnotherOwnersRestaurants() {
        create(accounts.owner("Ana Souza"), "Pizzaria da Ana");
        var bruno = accounts.owner("Bruno Lima");
        create(bruno, "Burger do Bruno");

        assertThat(bruno.get("/api/restaurants"))
                .bodyJson()
                .extractingPath("$[*].name")
                .asArray()
                .containsExactly("Burger do Bruno");
    }

    @Test
    void adminSeesEveryRestaurantWithItsOwner() {
        String name = "Cantina " + UUID.randomUUID();
        create(accounts.owner("Carla Dias"), name);

        var list = accounts.admin("Suporte").get("/api/restaurants");

        assertThat(list)
                .bodyJson()
                .extractingPath("$[?(@.name == '%s')].ownerName".formatted(name))
                .asArray()
                .containsExactly("Carla Dias");
    }

    @Test
    void adminCannotOpenARestaurant() {
        var created = create(accounts.admin("Suporte"), "Restaurante do Suporte");

        assertThat(created).hasStatus(HttpStatus.FORBIDDEN);
        assertThat(created).bodyJson().extractingPath("$.detail").isEqualTo("Só donos criam restaurantes.");
    }

    @Test
    void restaurantNeedsANameOfTwoToOneHundredCharacters() {
        var owner = accounts.owner("Ana Souza");

        var tooShort = create(owner, " A ");
        var tooLong = create(owner, "R".repeat(101));

        assertThat(tooShort).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(tooShort).bodyJson().extractingPath("$.errors[0].field").isEqualTo("name");
        assertThat(tooLong).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(owner.get("/api/restaurants"))
                .bodyJson()
                .extractingPath("$")
                .asArray()
                .isEmpty();
    }

    private static MvcTestResult create(ApiSession session, String name) {
        return session.post("/api/restaurants", """
                {"name": "%s"}
                """.formatted(name));
    }
}
