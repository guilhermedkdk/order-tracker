package io.github.guilhermedkdk.ordertracker.demo;

import io.github.guilhermedkdk.ordertracker.auth.CurrentUser;
import io.github.guilhermedkdk.ordertracker.auth.Role;
import io.github.guilhermedkdk.ordertracker.auth.UserDirectory;
import io.github.guilhermedkdk.ordertracker.order.Author;
import io.github.guilhermedkdk.ordertracker.order.NewOrder;
import io.github.guilhermedkdk.ordertracker.order.Order;
import io.github.guilhermedkdk.ordertracker.order.OrderCustomer;
import io.github.guilhermedkdk.ordertracker.order.OrderRepository;
import io.github.guilhermedkdk.ordertracker.order.OrderStatus;
import io.github.guilhermedkdk.ordertracker.restaurant.RestaurantService;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBooleanProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// The demo accounts and everything they own. Their credentials are public in the README.
@Service
@ConditionalOnBooleanProperty("app.demo.enabled")
class DemoData {

    static final String PASSWORD = "demo1234";

    // How long each step of a sample order took after the previous one.
    private static final Map<OrderStatus, Duration> STEP = Map.of(
            OrderStatus.EM_PREPARO, Duration.ofMinutes(8),
            OrderStatus.SAIU_PARA_ENTREGA, Duration.ofMinutes(15),
            OrderStatus.ENTREGUE, Duration.ofMinutes(20),
            OrderStatus.CANCELADO, Duration.ofMinutes(5));

    private static final List<OrderStatus> FORWARD =
            List.of(OrderStatus.EM_PREPARO, OrderStatus.SAIU_PARA_ENTREGA, OrderStatus.ENTREGUE);

    private final UserDirectory users;
    private final RestaurantService restaurants;
    private final OrderRepository orders;
    private final Clock clock;

    DemoData(UserDirectory users, RestaurantService restaurants, OrderRepository orders, Clock clock) {
        this.users = users;
        this.restaurants = restaurants;
        this.orders = orders;
        this.clock = clock;
    }

    /** Creates the demo accounts and their data the first time; later starts change nothing. */
    @Transactional
    void seed() {
        if (users.exists("admin@example.com")) {
            return;
        }
        Owners owners = ensureAccounts();
        load(owners.rafael(), owners.juliana());
    }

    /**
     * Puts the demo back as it was, with timestamps relative to now. The accounts stay, so whoever
     * clicked keeps their session; everything the demo owners own is deleted and recreated.
     */
    @Transactional
    void restore() {
        Owners owners = ensureAccounts();
        restaurants.deleteAllOwnedBy(
                List.of(owners.rafael().id(), owners.juliana().id()));
        load(owners.rafael(), owners.juliana());
    }

    private record Owners(CurrentUser rafael, CurrentUser juliana) {}

    private Owners ensureAccounts() {
        users.ensureDemoAccount("Suporte", "admin@example.com", PASSWORD, Role.ADMIN);
        return new Owners(
                users.ensureDemoAccount("Rafael Costa", "rafael@example.com", PASSWORD, Role.DONO),
                users.ensureDemoAccount("Juliana Prado", "juliana@example.com", PASSWORD, Role.DONO));
    }

    private void load(CurrentUser rafael, CurrentUser juliana) {
        Map<String, UUID> restaurantIds = Map.of(
                DemoScript.CANTINA, restaurants.create(rafael, DemoScript.CANTINA),
                DemoScript.BURGER, restaurants.create(rafael, DemoScript.BURGER),
                DemoScript.SUSHI, restaurants.create(juliana, DemoScript.SUSHI));
        Instant now = clock.instant();
        for (DemoScript.DemoOrder sample : DemoScript.ORDERS) {
            CurrentUser owner = sample.restaurant().equals(DemoScript.SUSHI) ? juliana : rafael;
            orders.save(play(sample, restaurantIds.get(sample.restaurant()), owner, now));
        }
    }

    // Runs the sample through the real domain rules, with timestamps in the past.
    private static Order play(DemoScript.DemoOrder sample, UUID restaurantId, CurrentUser owner, Instant now) {
        Author author = new Author(owner.id(), owner.name());
        Instant at = now.minus(Duration.ofMinutes(sample.minutesAgo()));
        Order order = Order.create(
                new NewOrder(
                        restaurantId,
                        new OrderCustomer(sample.customer(), sample.phone()),
                        sample.address(),
                        sample.items(),
                        sample.deliveryFee(),
                        sample.payment(),
                        null),
                author,
                at);
        for (OrderStatus step : FORWARD.subList(0, FORWARD.indexOf(sample.reached()) + 1)) {
            at = at.plus(STEP.get(step));
            order.changeStatus(step, null, author, at);
        }
        if (sample.cancellation() != null) {
            at = at.plus(STEP.get(OrderStatus.CANCELADO));
            order.changeStatus(OrderStatus.CANCELADO, sample.cancellation(), author, at);
        }
        return order;
    }
}
