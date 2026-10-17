package io.github.guilhermedkdk.ordertracker.order;

import static io.github.guilhermedkdk.ordertracker.ApiSession.read;
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
class OrderApiTests {

    @Autowired
    TestAccounts accounts;

    @Test
    void ownerCreatesAnOrderAndFindsItById() {
        var owner = accounts.owner("Ana Souza");
        String restaurantId = restaurant(owner, "Pizzaria Bella");

        var created = owner.post("/api/orders", orderJson(restaurantId));

        assertThat(created).hasStatus(HttpStatus.CREATED);
        String id = read(created, "$.id");
        assertThat(created.getResponse().getHeader("Location")).isEqualTo("/api/orders/" + id);
        assertThat(read(created, "$.code"))
                .isEqualTo(id.replace("-", "").substring(24).toUpperCase());

        var found = owner.get("/api/orders/" + id);
        assertThat(found).hasStatus(HttpStatus.OK);
        assertThat(found).bodyJson().extractingPath("$.status").isEqualTo("RECEBIDO");
        assertThat(found).bodyJson().extractingPath("$.restaurantName").isEqualTo("Pizzaria Bella");
        assertThat(found).bodyJson().extractingPath("$.total").isEqualTo(98.80);
        assertThat(found).bodyJson().extractingPath("$.items[0].name").isEqualTo("Pizza margherita");
        assertThat(found)
                .bodyJson()
                .extractingPath("$.allowedNextStatuses")
                .asArray()
                .containsExactly("EM_PREPARO", "CANCELADO");
        assertThat(found)
                .bodyJson()
                .extractingPath("$.statusHistory[0].authorName")
                .isEqualTo("Ana Souza");
    }

    @Test
    void anotherOwnersOrdersDoNotExistForYou() {
        var ana = accounts.owner("Ana Souza");
        String anasRestaurant = restaurant(ana, "Pizzaria da Ana");
        String anasOrder = read(createOrder(ana, anasRestaurant), "$.id");
        var bruno = accounts.owner("Bruno Lima");

        var create = createOrder(bruno, anasRestaurant);
        var find = bruno.get("/api/orders/" + anasOrder);

        assertThat(create).hasStatus(HttpStatus.NOT_FOUND);
        assertThat(create).bodyJson().extractingPath("$.detail").isEqualTo("Restaurante não encontrado.");
        assertThat(find).hasStatus(HttpStatus.NOT_FOUND);
        assertThat(find).bodyJson().extractingPath("$.detail").isEqualTo("Pedido não encontrado.");
    }

    @Test
    void adminSeesAnyOrderButNotARestaurantThatDoesNotExist() {
        var ana = accounts.owner("Ana Souza");
        String anasOrder = read(createOrder(ana, restaurant(ana, "Pizzaria da Ana")), "$.id");
        var admin = accounts.admin("Suporte");

        assertThat(admin.get("/api/orders/" + anasOrder)).hasStatus(HttpStatus.OK);
        assertThat(createOrder(admin, UUID.randomUUID().toString())).hasStatus(HttpStatus.NOT_FOUND);
    }

    @Test
    void ownerListsOnlyTheirOrdersNewestFirst() {
        var ana = accounts.owner("Ana Souza");
        String restaurantId = restaurant(ana, "Pizzaria da Ana");
        String first = read(createOrder(ana, restaurantId), "$.id");
        String second = read(createOrder(ana, restaurantId), "$.id");
        var bruno = accounts.owner("Bruno Lima");
        createOrder(bruno, restaurant(bruno, "Burger do Bruno"));

        var list = ana.get("/api/orders");

        assertThat(list).hasStatus(HttpStatus.OK);
        assertThat(list).bodyJson().extractingPath("$.content[*].id").asArray().containsExactly(second, first);
        assertThat(list).bodyJson().extractingPath("$.totalElements").isEqualTo(2);
        assertThat(list)
                .bodyJson()
                .extractingPath("$.content[0].restaurantName")
                .isEqualTo("Pizzaria da Ana");
        assertThat(list).bodyJson().extractingPath("$.content[0].customerName").isEqualTo("Maria Silva");
    }

    @Test
    void listFiltersByRestaurantAndStatusAndPages() {
        var ana = accounts.owner("Ana Souza");
        String pizzaria = restaurant(ana, "Pizzaria da Ana");
        String burger = restaurant(ana, "Burger da Ana");
        createOrder(ana, pizzaria);
        String burgerOrder = read(createOrder(ana, burger), "$.id");

        assertThat(ana.get("/api/orders?restaurantId=" + burger))
                .bodyJson()
                .extractingPath("$.content[*].id")
                .asArray()
                .containsExactly(burgerOrder);
        assertThat(ana.get("/api/orders?status=ENTREGUE"))
                .bodyJson()
                .extractingPath("$.totalElements")
                .isEqualTo(0);
        var firstPage = ana.get("/api/orders?size=1");
        assertThat(firstPage).bodyJson().extractingPath("$.content").asArray().hasSize(1);
        assertThat(firstPage).bodyJson().extractingPath("$.totalPages").isEqualTo(2);
    }

    @Test
    void filteringBySomeoneElsesRestaurantIsNotFound() {
        var ana = accounts.owner("Ana Souza");
        String anasRestaurant = restaurant(ana, "Pizzaria da Ana");

        assertThat(accounts.owner("Bruno Lima").get("/api/orders?restaurantId=" + anasRestaurant))
                .hasStatus(HttpStatus.NOT_FOUND);
    }

    @Test
    void adminListsOrdersFromEveryRestaurant() {
        var ana = accounts.owner("Ana Souza");
        String anasOrder = read(createOrder(ana, restaurant(ana, "Pizzaria da Ana")), "$.id");
        var bruno = accounts.owner("Bruno Lima");
        String brunosOrder = read(createOrder(bruno, restaurant(bruno, "Burger do Bruno")), "$.id");

        assertThat(accounts.admin("Suporte").get("/api/orders"))
                .bodyJson()
                .extractingPath("$.content[*].id")
                .asArray()
                .contains(anasOrder, brunosOrder);
    }

    @Test
    void movesAnOrderForwardAndRecordsIt() {
        var ana = accounts.owner("Ana Souza");
        String id = read(createOrder(ana, restaurant(ana, "Pizzaria da Ana")), "$.id");

        var changed = changeStatus(ana, id, """
                {"status": "EM_PREPARO"}
                """);

        assertThat(changed).hasStatus(HttpStatus.OK);
        assertThat(changed).bodyJson().extractingPath("$.status").isEqualTo("EM_PREPARO");
        assertThat(changed)
                .bodyJson()
                .extractingPath("$.allowedNextStatuses")
                .asArray()
                .containsExactly("SAIU_PARA_ENTREGA", "CANCELADO");
        assertThat(changed)
                .bodyJson()
                .extractingPath("$.statusHistory[*].status")
                .asArray()
                .containsExactly("RECEBIDO", "EM_PREPARO");
    }

    @Test
    void refusesAnInvalidTransition() {
        var ana = accounts.owner("Ana Souza");
        String id = read(createOrder(ana, restaurant(ana, "Pizzaria da Ana")), "$.id");

        var changed = changeStatus(ana, id, """
                {"status": "ENTREGUE"}
                """);

        assertThat(changed).hasStatus(HttpStatus.CONFLICT);
        assertThat(changed)
                .bodyJson()
                .extractingPath("$.detail")
                .isEqualTo("Um pedido RECEBIDO não pode passar para ENTREGUE.");
    }

    @Test
    void cancellingAsksForTheReasonAndKeepsIt() {
        var ana = accounts.owner("Ana Souza");
        String id = read(createOrder(ana, restaurant(ana, "Pizzaria da Ana")), "$.id");

        var withoutReason = changeStatus(ana, id, """
                {"status": "CANCELADO"}
                """);
        var withReason = changeStatus(ana, id, """
                {"status": "CANCELADO", "cancellationReason": "OUTRO", "cancellationDetail": "Endereço errado"}
                """);

        assertThat(withoutReason).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(withoutReason).bodyJson().extractingPath("$.errors[0].field").isEqualTo("cancellationReason");
        assertThat(withReason).hasStatus(HttpStatus.OK);
        assertThat(withReason)
                .bodyJson()
                .extractingPath("$.statusHistory[1].cancellationDetail")
                .isEqualTo("Endereço errado");
        assertThat(withReason)
                .bodyJson()
                .extractingPath("$.allowedNextStatuses")
                .asArray()
                .isEmpty();
    }

    @Test
    void cannotChangeAnotherOwnersOrder() {
        var ana = accounts.owner("Ana Souza");
        String id = read(createOrder(ana, restaurant(ana, "Pizzaria da Ana")), "$.id");

        assertThat(changeStatus(accounts.owner("Bruno Lima"), id, """
                        {"status": "EM_PREPARO"}
                        """)).hasStatus(HttpStatus.NOT_FOUND);
    }

    @Test
    void invalidOrderPointsAtEachNestedField() {
        var ana = accounts.owner("Ana Souza");
        String restaurantId = restaurant(ana, "Pizzaria da Ana");

        var created = ana.post("/api/orders", """
                {
                  "restaurantId": "%s",
                  "customer": {"name": "Maria Silva", "phone": "1234"},
                  "deliveryAddress": {
                    "cep": "01310100", "street": "Av. Paulista", "number": "1000",
                    "neighborhood": "Bela Vista", "city": "São Paulo", "state": "XX"
                  },
                  "items": [{"name": "Pizza", "quantity": 0, "unitPrice": 45.90}],
                  "payment": {"method": "PIX"}
                }
                """.formatted(restaurantId));

        assertThat(created).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(created)
                .bodyJson()
                .extractingPath("$.errors[*].field")
                .asArray()
                .containsExactlyInAnyOrder("customer.phone", "deliveryAddress.state", "items[0].quantity");
    }

    @Test
    void changeBelowTheTotalPointsAtTheChangeField() {
        var ana = accounts.owner("Ana Souza");
        String json = orderJson(restaurant(ana, "Pizzaria da Ana"))
                .replace("{\"method\": \"PIX\"}", "{\"method\": \"DINHEIRO\", \"changeFor\": 50.00}");

        var created = ana.post("/api/orders", json);

        assertThat(created).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(created).bodyJson().extractingPath("$.errors[0].field").isEqualTo("payment.changeFor");
        assertThat(created)
                .bodyJson()
                .extractingPath("$.errors[0].message")
                .isEqualTo("O troco precisa ser para R$ 98,80 ou mais.");
    }

    @Test
    void masksFromTheFormAreStoredAsDigits() {
        var ana = accounts.owner("Ana Souza");

        var created = createOrder(ana, restaurant(ana, "Pizzaria da Ana"));

        assertThat(created).bodyJson().extractingPath("$.customer.phone").isEqualTo("11987654321");
        assertThat(created).bodyJson().extractingPath("$.deliveryAddress.cep").isEqualTo("01310100");
    }

    static MvcTestResult changeStatus(ApiSession session, String orderId, String json) {
        return session.patch("/api/orders/" + orderId + "/status", json);
    }

    static String restaurant(ApiSession owner, String name) {
        return read(owner.post("/api/restaurants", """
                {"name": "%s"}
                """.formatted(name)), "$.id");
    }

    // 2 x 45.90 + 7.00 of delivery = 98.80
    static String orderJson(String restaurantId) {
        return """
                {
                  "restaurantId": "%s",
                  "customer": {"name": "Maria Silva", "phone": "(11) 98765-4321"},
                  "deliveryAddress": {
                    "cep": "01310-100", "street": "Av. Paulista", "number": "1000", "complement": "ap 12",
                    "neighborhood": "Bela Vista", "city": "São Paulo", "state": "SP"
                  },
                  "items": [{"name": "Pizza margherita", "quantity": 2, "unitPrice": 45.90}],
                  "deliveryFee": 7.00,
                  "payment": {"method": "PIX"},
                  "notes": "Sem cebola"
                }
                """.formatted(restaurantId);
    }

    static MvcTestResult createOrder(ApiSession session, String restaurantId) {
        return session.post("/api/orders", orderJson(restaurantId));
    }
}
