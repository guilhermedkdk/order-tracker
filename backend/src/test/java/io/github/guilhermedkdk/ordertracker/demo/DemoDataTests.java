package io.github.guilhermedkdk.ordertracker.demo;

import static io.github.guilhermedkdk.ordertracker.ApiSession.read;
import static org.assertj.core.api.Assertions.assertThat;

import io.github.guilhermedkdk.ordertracker.ApiSession;
import io.github.guilhermedkdk.ordertracker.IntegrationTest;
import io.github.guilhermedkdk.ordertracker.TestAccounts;
import io.github.guilhermedkdk.ordertracker.order.OrderApiTests;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

@IntegrationTest
class DemoDataTests {

    @Autowired
    MockMvcTester mvc;

    @Autowired
    TestAccounts accounts;

    @Test
    void demoAccountsExistAsSoonAsTheAppStarts() {
        var admin = login("admin@example.com");
        var owner = login("rafael@example.com");

        assertThat(admin.get("/api/auth/me"))
                .bodyJson()
                .extractingPath("$.role")
                .isEqualTo("ADMIN");
        assertThat(admin.get("/api/auth/me"))
                .bodyJson()
                .extractingPath("$.demo")
                .isEqualTo(true);
        assertThat(owner.get("/api/auth/me"))
                .bodyJson()
                .extractingPath("$.role")
                .isEqualTo("DONO");
        assertThat(login("juliana@example.com").get("/api/auth/me")).hasStatus(HttpStatus.OK);
    }

    @Test
    void demoOwnersHaveRestaurantsWithOrdersInEveryStatus() {
        var rafael = login("rafael@example.com");
        var juliana = login("juliana@example.com");

        assertThat(rafael.get("/api/restaurants"))
                .bodyJson()
                .extractingPath("$[*].name")
                .asArray()
                .containsExactly("Burger da Vila", "Cantina Bella Napoli");
        assertThat(juliana.get("/api/restaurants"))
                .bodyJson()
                .extractingPath("$[*].name")
                .asArray()
                .containsExactly("Sushi Kenzo");
        assertThat(rafael.get("/api/orders?size=100"))
                .bodyJson()
                .extractingPath("$.content[*].status")
                .asArray()
                .contains("RECEBIDO", "EM_PREPARO", "SAIU_PARA_ENTREGA", "ENTREGUE", "CANCELADO");
        assertThat(rafael.get("/api/orders"))
                .bodyJson()
                .extractingPath("$.totalElements")
                .isEqualTo(10);
        assertThat(juliana.get("/api/orders"))
                .bodyJson()
                .extractingPath("$.totalElements")
                .isEqualTo(5);
    }

    @Test
    void demoOrdersHaveACoherentHistory() {
        var rafael = login("rafael@example.com");
        String delivered = read(rafael.get("/api/orders?status=ENTREGUE&size=1"), "$.content[0].id");
        String cancelled = read(rafael.get("/api/orders?status=CANCELADO&size=1"), "$.content[0].id");

        assertThat(rafael.get("/api/orders/" + delivered))
                .bodyJson()
                .extractingPath("$.statusHistory[*].status")
                .asArray()
                .containsExactly("RECEBIDO", "EM_PREPARO", "SAIU_PARA_ENTREGA", "ENTREGUE");
        assertThat(rafael.get("/api/orders/" + cancelled))
                .bodyJson()
                .extractingPath("$.statusHistory[-1:].cancellationReason")
                .asArray()
                .doesNotContainNull()
                .hasSize(1);
    }

    @Test
    void restoringRecreatesTheDemoAndLeavesRealAccountsAlone() {
        var ana = accounts.owner("Ana Souza");
        String anasRestaurant = read(ana.post("/api/restaurants", "{\"name\": \"Pizzaria da Ana\"}"), "$.id");
        String anasOrder = read(OrderApiTests.createOrder(ana, anasRestaurant), "$.id");
        var rafael = login("rafael@example.com");
        String cantina = read(rafael.get("/api/restaurants"), "$[1].id");
        OrderApiTests.createOrder(rafael, cantina);
        rafael.post("/api/restaurants", "{\"name\": \"Restaurante de teste\"}");

        var restore = login("admin@example.com").post("/api/demo/restore");

        assertThat(restore).hasStatus(HttpStatus.NO_CONTENT);
        assertThat(rafael.get("/api/restaurants"))
                .bodyJson()
                .extractingPath("$[*].name")
                .asArray()
                .containsExactly("Burger da Vila", "Cantina Bella Napoli");
        assertThat(rafael.get("/api/orders"))
                .bodyJson()
                .extractingPath("$.totalElements")
                .isEqualTo(10);
        assertThat(ana.get("/api/orders/" + anasOrder)).hasStatus(HttpStatus.OK);
    }

    @Test
    void onlyTheAdminRestoresTheDemo() {
        assertThat(login("rafael@example.com").post("/api/demo/restore")).hasStatus(HttpStatus.FORBIDDEN);
    }

    ApiSession login(String email) {
        var session = new ApiSession(mvc);
        var login = session.post("/api/auth/login", """
                {"email": "%s", "password": "demo1234"}
                """.formatted(email));
        assertThat(login).hasStatus(HttpStatus.OK);
        return session;
    }
}
