package io.github.guilhermedkdk.ordertracker.order;

import io.github.guilhermedkdk.ordertracker.auth.CurrentUser;
import io.github.guilhermedkdk.ordertracker.customer.CustomerAddress;
import io.github.guilhermedkdk.ordertracker.customer.CustomerBook;
import io.github.guilhermedkdk.ordertracker.restaurant.RestaurantScope;
import io.github.guilhermedkdk.ordertracker.restaurant.RestaurantService;
import io.github.guilhermedkdk.ordertracker.shared.NotFoundException;
import java.time.Clock;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Every order operation, each limited to the orders the user can see. */
@Service
public class OrderService {

    static final int MAX_PAGE_SIZE = 100;

    private final OrderRepository orders;
    private final RestaurantService restaurants;
    private final CustomerBook customers;
    private final ApplicationEventPublisher events;
    private final Clock clock;

    OrderService(
            OrderRepository orders,
            RestaurantService restaurants,
            CustomerBook customers,
            ApplicationEventPublisher events,
            Clock clock) {
        this.orders = orders;
        this.restaurants = restaurants;
        this.customers = customers;
        this.events = events;
        this.clock = clock;
    }

    @Transactional
    public OrderView create(CurrentUser user, NewOrder data) {
        restaurants.requireVisible(restaurants.scopeOf(user), data.restaurantId());
        return view(save(Order.create(data, authorOf(user), clock.instant())));
    }

    /**
     * Saves a new order and feeds the restaurant's customer base, which only fills the next order of
     * the same phone. The demo calls it for orders built with past timestamps; it checks no visibility.
     */
    @Transactional
    public Order save(Order order) {
        Order saved = orders.save(order);
        rememberCustomer(saved);
        events.publishEvent(OrderStatusChanged.of(saved));
        return saved;
    }

    @Transactional(readOnly = true)
    public OrderView find(CurrentUser user, UUID id) {
        return view(visibleOrder(user, id));
    }

    @Transactional
    public OrderView changeStatus(CurrentUser user, UUID id, OrderStatus target, Cancellation cancellation) {
        Order order = visibleOrder(user, id);
        order.changeStatus(target, cancellation, authorOf(user), clock.instant());
        Order saved = orders.saveAndFlush(order);
        events.publishEvent(OrderStatusChanged.of(saved));
        return view(saved);
    }

    /** Newest first. Filtering by a restaurant the user cannot see answers 404, like any other access. */
    @Transactional(readOnly = true)
    public Page<OrderView> list(CurrentUser user, OrderFilter filter, int page, int size) {
        RestaurantScope scope = restaurants.scopeOf(user);
        PageRequest request = PageRequest.of(
                Math.max(page, 0),
                Math.clamp(size, 1, MAX_PAGE_SIZE),
                Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id")));

        List<Specification<Order>> conditions = new ArrayList<>();
        if (filter.restaurantId() != null) {
            restaurants.requireVisible(scope, filter.restaurantId());
            conditions.add((root, query, cb) -> cb.equal(root.get("restaurantId"), filter.restaurantId()));
        }
        if (scope instanceof RestaurantScope.Only(var ids)) {
            if (ids.isEmpty()) {
                return Page.empty(request);
            }
            conditions.add((root, query, cb) -> root.get("restaurantId").in(ids));
        }
        if (filter.status() != null) {
            conditions.add((root, query, cb) -> cb.equal(root.get("status"), filter.status()));
        }

        Page<Order> found = orders.findAll(Specification.allOf(conditions), request);
        Map<UUID, String> names = restaurants.namesOf(
                found.getContent().stream().map(Order::restaurantId).toList());
        return found.map(order -> new OrderView(order, names.get(order.restaurantId())));
    }

    private Order visibleOrder(CurrentUser user, UUID id) {
        return orders.findWithDetailsById(id)
                .filter(order -> restaurants.scopeOf(user).includes(order.restaurantId()))
                .orElseThrow(() -> new NotFoundException("Pedido não encontrado."));
    }

    private OrderView view(Order order) {
        return new OrderView(
                order, restaurants.namesOf(List.of(order.restaurantId())).get(order.restaurantId()));
    }

    private void rememberCustomer(Order order) {
        DeliveryAddress address = order.deliveryAddress();
        customers.remember(
                order.restaurantId(),
                order.customer().name(),
                order.customer().phone(),
                new CustomerAddress(
                        address.cep(),
                        address.street(),
                        address.number(),
                        address.complement(),
                        address.neighborhood(),
                        address.city(),
                        address.state()),
                order.createdAt());
    }

    private static Author authorOf(CurrentUser user) {
        return new Author(user.id(), user.name());
    }
}
