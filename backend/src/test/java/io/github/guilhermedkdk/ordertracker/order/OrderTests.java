package io.github.guilhermedkdk.ordertracker.order;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import io.github.guilhermedkdk.ordertracker.shared.ConflictException;
import io.github.guilhermedkdk.ordertracker.shared.DomainValidationException;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

class OrderTests {

    static final Author ANA = new Author(UUID.randomUUID(), "Ana Souza");
    static final Instant CREATED_AT = Instant.parse("2026-10-17T18:00:00Z");

    @Test
    void newOrderStartsReceivedWithItsCreationInTheHistory() {
        Order order = Order.create(newOrder(), ANA, CREATED_AT);

        assertThat(order.status()).isEqualTo(OrderStatus.RECEBIDO);
        assertThat(order.statusHistory())
                .containsExactly(new StatusChange(OrderStatus.RECEBIDO, CREATED_AT, ANA.id(), ANA.name(), null, null));
        assertThat(order.allowedNextStatuses()).containsExactly(OrderStatus.EM_PREPARO, OrderStatus.CANCELADO);
    }

    @Test
    void totalIsTheItemsPlusTheDeliveryFee() {
        NewOrder data = withItems(
                List.of(
                        new OrderItem("Pizza margherita", 2, new BigDecimal("45.90")),
                        new OrderItem("Refrigerante 2 L", 1, new BigDecimal("12.50"))),
                new BigDecimal("7.00"));

        Order order = Order.create(data, ANA, CREATED_AT);

        assertThat(order.subtotal()).isEqualByComparingTo("104.30");
        assertThat(order.total()).isEqualByComparingTo("111.30");
    }

    @Test
    void advancesOneStepAtATimeUntilDelivered() {
        Order order = Order.create(newOrder(), ANA, CREATED_AT);
        Instant later = CREATED_AT.plusSeconds(600);

        order.changeStatus(OrderStatus.EM_PREPARO, null, ANA, later);
        order.changeStatus(OrderStatus.SAIU_PARA_ENTREGA, null, ANA, later);
        order.changeStatus(OrderStatus.ENTREGUE, null, ANA, later);

        assertThat(order.status()).isEqualTo(OrderStatus.ENTREGUE);
        assertThat(order.statusHistory())
                .extracting(StatusChange::status)
                .containsExactly(
                        OrderStatus.RECEBIDO,
                        OrderStatus.EM_PREPARO,
                        OrderStatus.SAIU_PARA_ENTREGA,
                        OrderStatus.ENTREGUE);
        assertThat(order.allowedNextStatuses()).isEmpty();
    }

    @Test
    void refusesToSkipGoBackOrRepeatAStatus() {
        Order order = Order.create(newOrder(), ANA, CREATED_AT);

        assertThatThrownBy(() -> order.changeStatus(OrderStatus.SAIU_PARA_ENTREGA, null, ANA, CREATED_AT))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Um pedido RECEBIDO não pode passar para SAIU_PARA_ENTREGA.");
        assertThatThrownBy(() -> order.changeStatus(OrderStatus.RECEBIDO, null, ANA, CREATED_AT))
                .isInstanceOf(ConflictException.class);
        assertThat(order.statusHistory()).hasSize(1);
    }

    @ParameterizedTest
    @EnumSource(
            value = OrderStatus.class,
            names = {"RECEBIDO", "EM_PREPARO", "SAIU_PARA_ENTREGA"})
    void cancelsAnOrderInProgressAndRecordsWhy(OrderStatus from) {
        Order order = orderAt(from);
        var why = new Cancellation(CancellationReason.CLIENTE_NAO_ENCONTRADO, "Ninguém atendeu no portão");

        order.changeStatus(OrderStatus.CANCELADO, why, ANA, CREATED_AT);

        assertThat(order.status()).isEqualTo(OrderStatus.CANCELADO);
        assertThat(order.statusHistory().getLast())
                .isEqualTo(new StatusChange(
                        OrderStatus.CANCELADO,
                        CREATED_AT,
                        ANA.id(),
                        ANA.name(),
                        CancellationReason.CLIENTE_NAO_ENCONTRADO,
                        "Ninguém atendeu no portão"));
    }

    @Test
    void cancellingNeedsAReasonAndOtherNeedsADetail() {
        Order order = Order.create(newOrder(), ANA, CREATED_AT);

        assertThatThrownBy(() -> order.changeStatus(OrderStatus.CANCELADO, null, ANA, CREATED_AT))
                .isInstanceOfSatisfying(
                        DomainValidationException.class,
                        e -> assertThat(e.field()).isEqualTo("cancellationReason"));
        assertThatThrownBy(() -> order.changeStatus(
                        OrderStatus.CANCELADO, new Cancellation(CancellationReason.OUTRO, "  "), ANA, CREATED_AT))
                .isInstanceOfSatisfying(
                        DomainValidationException.class,
                        e -> assertThat(e.field()).isEqualTo("cancellationDetail"));
        assertThat(order.status()).isEqualTo(OrderStatus.RECEBIDO);
    }

    @Test
    void aReasonOnlyGoesWithACancellation() {
        Order order = Order.create(newOrder(), ANA, CREATED_AT);
        var why = new Cancellation(CancellationReason.CLIENTE_DESISTIU, null);

        assertThatThrownBy(() -> order.changeStatus(OrderStatus.EM_PREPARO, why, ANA, CREATED_AT))
                .isInstanceOfSatisfying(
                        DomainValidationException.class,
                        e -> assertThat(e.field()).isEqualTo("cancellationReason"));
    }

    @Test
    void aDeliveredOrderCannotBeCancelled() {
        Order order = orderAt(OrderStatus.ENTREGUE);
        var why = new Cancellation(CancellationReason.CLIENTE_DESISTIU, null);

        assertThatThrownBy(() -> order.changeStatus(OrderStatus.CANCELADO, why, ANA, CREATED_AT))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void changeIsOnlyForCashAndNeverBelowTheTotal() {
        // 2 x 45.90 + 7.00 of delivery = 98.80
        var pixWithChange = withPayment(new Payment(PaymentMethod.PIX, new BigDecimal("100.00")));
        var cashBelowTotal = withPayment(new Payment(PaymentMethod.DINHEIRO, new BigDecimal("50.00")));
        var cashExact = withPayment(new Payment(PaymentMethod.DINHEIRO, new BigDecimal("98.80")));

        assertThatThrownBy(() -> Order.create(pixWithChange, ANA, CREATED_AT))
                .isInstanceOfSatisfying(
                        DomainValidationException.class,
                        e -> assertThat(e.field()).isEqualTo("payment.changeFor"));
        assertThatThrownBy(() -> Order.create(cashBelowTotal, ANA, CREATED_AT))
                .isInstanceOf(DomainValidationException.class)
                .hasMessage("O troco precisa ser para R$ 98,80 ou mais.");
        assertThat(Order.create(cashExact, ANA, CREATED_AT).payment().changeFor())
                .isEqualByComparingTo("98.80");
    }

    @Test
    void anOrderNeedsAtLeastOneItem() {
        assertThatThrownBy(() -> Order.create(withItems(List.of(), BigDecimal.ZERO), ANA, CREATED_AT))
                .isInstanceOfSatisfying(
                        DomainValidationException.class,
                        e -> assertThat(e.field()).isEqualTo("items"));
    }

    static NewOrder withPayment(Payment payment) {
        NewOrder base = newOrder();
        return new NewOrder(
                base.restaurantId(),
                base.customer(),
                base.deliveryAddress(),
                base.items(),
                base.deliveryFee(),
                payment,
                base.notes());
    }

    static Order orderAt(OrderStatus target) {
        Order order = Order.create(newOrder(), ANA, CREATED_AT);
        for (OrderStatus step : List.of(OrderStatus.EM_PREPARO, OrderStatus.SAIU_PARA_ENTREGA, OrderStatus.ENTREGUE)) {
            if (order.status() == target) {
                break;
            }
            order.changeStatus(step, null, ANA, CREATED_AT);
        }
        return order;
    }

    static NewOrder withItems(List<OrderItem> items, BigDecimal deliveryFee) {
        NewOrder base = newOrder();
        return new NewOrder(
                base.restaurantId(),
                base.customer(),
                base.deliveryAddress(),
                items,
                deliveryFee,
                base.payment(),
                base.notes());
    }

    static NewOrder newOrder() {
        return new NewOrder(
                UUID.randomUUID(),
                new OrderCustomer("Maria Silva", "11987654321"),
                new DeliveryAddress("01310100", "Av. Paulista", "1000", "ap 12", "Bela Vista", "São Paulo", "SP"),
                List.of(new OrderItem("Pizza margherita", 2, new BigDecimal("45.90"))),
                new BigDecimal("7.00"),
                new Payment(PaymentMethod.PIX, null),
                null);
    }
}
