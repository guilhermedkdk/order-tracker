package io.github.guilhermedkdk.ordertracker.live;

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
class OrderStreamTests {

    @Autowired
    MockMvcTester mvc;

    @Autowired
    TestAccounts accounts;

    @Test
    void streamsEachStatusChangeToWhoeverSeesTheRestaurant() throws Exception {
        var ana = accounts.owner("Ana Souza");
        String restaurant = read(ana.post("/api/restaurants", """
                {"name": "Pizzaria da Ana"}
                """), "$.id");
        var anasStream = ana.openStream("/api/orders/stream");
        var otherOwnersStream = accounts.owner("Bruno Lima").openStream("/api/orders/stream");

        String order = read(OrderApiTests.createOrder(ana, restaurant), "$.id");
        ana.patch("/api/orders/" + order + "/status", """
                {"status": "EM_PREPARO"}
                """);

        assertThat(anasStream.getResponse().getContentAsString())
                .contains("event:status")
                .contains("\"orderId\":\"%s\"".formatted(order))
                .contains("\"status\":\"RECEBIDO\"")
                .contains("\"status\":\"EM_PREPARO\"");
        assertThat(otherOwnersStream.getResponse().getContentAsString()).doesNotContain(order);
    }

    @Test
    void theStreamNeedsASession() {
        assertThat(new ApiSession(mvc).openStream("/api/orders/stream")).hasStatus(HttpStatus.UNAUTHORIZED);
    }
}
