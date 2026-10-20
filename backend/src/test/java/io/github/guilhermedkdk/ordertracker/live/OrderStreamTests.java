package io.github.guilhermedkdk.ordertracker.live;

import static io.github.guilhermedkdk.ordertracker.ApiSession.read;
import static org.assertj.core.api.Assertions.assertThat;

import io.github.guilhermedkdk.ordertracker.ApiSession;
import io.github.guilhermedkdk.ordertracker.IntegrationTest;
import io.github.guilhermedkdk.ordertracker.TestAccounts;
import io.github.guilhermedkdk.ordertracker.order.OrderApiTests;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

@IntegrationTest
class OrderStreamTests {

    @Autowired
    MockMvcTester mvc;

    @Autowired
    TestAccounts accounts;

    private final List<MvcTestResult> opened = new ArrayList<>();

    // The mock container never times a stream out, and the context is shared with every other test.
    @AfterEach
    void closeStreams() {
        opened.forEach(stream -> stream.getRequest().getAsyncContext().complete());
    }

    @Test
    void streamsEachStatusChangeToWhoeverSeesTheRestaurant() throws Exception {
        var ana = accounts.owner("Ana Souza");
        String restaurant = read(ana.post("/api/restaurants", """
                {"name": "Pizzaria da Ana"}
                """), "$.id");
        var anasStream = open(ana);
        var otherOwnersStream = open(accounts.owner("Bruno Lima"));

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

    private MvcTestResult open(ApiSession session) {
        MvcTestResult stream = session.openStream("/api/orders/stream");
        opened.add(stream);
        return stream;
    }
}
