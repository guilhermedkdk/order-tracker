package io.github.guilhermedkdk.ordertracker.customer;

import static io.github.guilhermedkdk.ordertracker.ApiSession.read;
import static org.assertj.core.api.Assertions.assertThat;

import io.github.guilhermedkdk.ordertracker.ApiSession;
import io.github.guilhermedkdk.ordertracker.IntegrationTest;
import io.github.guilhermedkdk.ordertracker.TestAccounts;
import io.github.guilhermedkdk.ordertracker.order.OrderApiTests;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

@IntegrationTest
class CustomerApiTests {

    @Autowired
    TestAccounts accounts;

    @Test
    void anOrderRemembersItsCustomerInTheRestaurant() {
        var ana = accounts.owner("Ana Souza");
        String restaurant = restaurant(ana, "Pizzaria da Ana");
        OrderApiTests.createOrder(ana, restaurant);

        var found = lookup(ana, restaurant, "(11) 98765-4321");

        assertThat(found).hasStatus(HttpStatus.OK);
        assertThat(found).bodyJson().extractingPath("$.name").isEqualTo("Maria Silva");
        assertThat(found).bodyJson().extractingPath("$.phone").isEqualTo("11987654321");
        assertThat(found).bodyJson().extractingPath("$.lastAddress.street").isEqualTo("Av. Paulista");
        assertThat(found).bodyJson().extractingPath("$.lastAddress.cep").isEqualTo("01310100");
    }

    @Test
    void theNewestOrderUpdatesNameAndLastAddress() {
        var ana = accounts.owner("Ana Souza");
        String restaurant = restaurant(ana, "Pizzaria da Ana");
        OrderApiTests.createOrder(ana, restaurant);
        ana.post(
                "/api/orders",
                OrderApiTests.orderJson(restaurant)
                        .replace("Maria Silva", "Maria S. Oliveira")
                        .replace("Av. Paulista", "Rua Augusta"));

        var found = lookup(ana, restaurant, "11987654321");

        assertThat(found).bodyJson().extractingPath("$.name").isEqualTo("Maria S. Oliveira");
        assertThat(found).bodyJson().extractingPath("$.lastAddress.street").isEqualTo("Rua Augusta");
    }

    @Test
    void eachRestaurantHasItsOwnCustomers() {
        var ana = accounts.owner("Ana Souza");
        String pizzaria = restaurant(ana, "Pizzaria da Ana");
        String burger = restaurant(ana, "Burger da Ana");
        OrderApiTests.createOrder(ana, pizzaria);

        var found = lookup(ana, burger, "11987654321");

        assertThat(found).hasStatus(HttpStatus.NOT_FOUND);
        assertThat(found).bodyJson().extractingPath("$.detail").isEqualTo("Cliente não encontrado.");
    }

    @Test
    void anotherOwnersCustomersDoNotExistForYou() {
        var ana = accounts.owner("Ana Souza");
        String anasRestaurant = restaurant(ana, "Pizzaria da Ana");
        OrderApiTests.createOrder(ana, anasRestaurant);

        var found = lookup(accounts.owner("Bruno Lima"), anasRestaurant, "11987654321");

        assertThat(found).hasStatus(HttpStatus.NOT_FOUND);
        assertThat(found).bodyJson().extractingPath("$.detail").isEqualTo("Restaurante não encontrado.");
    }

    static String restaurant(ApiSession owner, String name) {
        return read(owner.post("/api/restaurants", """
                {"name": "%s"}
                """.formatted(name)), "$.id");
    }

    // MockMvc encodes the URI itself; encoding here too would turn "(" into "%2528".
    static MvcTestResult lookup(ApiSession session, String restaurantId, String phone) {
        return session.get("/api/customers?restaurantId=" + restaurantId + "&phone=" + phone);
    }
}
