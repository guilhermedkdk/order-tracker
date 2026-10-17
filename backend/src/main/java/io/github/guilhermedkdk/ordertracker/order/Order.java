package io.github.guilhermedkdk.ordertracker.order;

import io.github.guilhermedkdk.ordertracker.shared.ConflictException;
import io.github.guilhermedkdk.ordertracker.shared.DomainValidationException;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;

/**
 * A delivery order and every rule about it: totals, change for cash, status transitions and the
 * status history. Nothing outside this class changes an order's state.
 */
@Entity
@Table(name = "orders")
public class Order {

    @Id
    @UuidGenerator(style = UuidGenerator.Style.VERSION_7)
    private UUID id;

    private UUID restaurantId;

    @Embedded
    private OrderCustomer customer;

    @Embedded
    private DeliveryAddress deliveryAddress;

    @ElementCollection
    @CollectionTable(name = "order_items", joinColumns = @JoinColumn(name = "order_id"))
    @OrderColumn(name = "position")
    private List<OrderItem> items = new ArrayList<>();

    private BigDecimal deliveryFee;
    private BigDecimal subtotal;
    private BigDecimal total;

    @Embedded
    private Payment payment;

    private String notes;

    @Enumerated(EnumType.STRING)
    private OrderStatus status;

    @ElementCollection
    @CollectionTable(name = "order_status_changes", joinColumns = @JoinColumn(name = "order_id"))
    @OrderColumn(name = "position")
    private List<StatusChange> statusHistory = new ArrayList<>();

    @Version
    private long version;

    private Instant createdAt;

    protected Order() {}

    public static Order create(NewOrder data, Author author, Instant at) {
        if (data.items().isEmpty()) {
            throw new DomainValidationException("items", "Adicione pelo menos um item.");
        }
        Order order = new Order();
        order.restaurantId = data.restaurantId();
        order.customer = data.customer();
        order.deliveryAddress = data.deliveryAddress();
        order.items = new ArrayList<>(data.items());
        order.deliveryFee = money(data.deliveryFee());
        order.subtotal =
                money(data.items().stream().map(OrderItem::lineTotal).reduce(BigDecimal.ZERO, BigDecimal::add));
        order.total = order.subtotal.add(order.deliveryFee);
        requireValidChange(data.payment(), order.total);
        order.payment = data.payment();
        order.notes = data.notes();
        order.status = OrderStatus.RECEBIDO;
        order.createdAt = at;
        order.statusHistory.add(new StatusChange(OrderStatus.RECEBIDO, at, author.id(), author.name(), null, null));
        return order;
    }

    /**
     * Moves the order to {@code target} and records who did it and when. {@code cancellation} is
     * required when cancelling and refused otherwise.
     */
    public void changeStatus(OrderStatus target, Cancellation cancellation, Author author, Instant at) {
        if (!status.next().contains(target)) {
            throw new ConflictException("Um pedido %s não pode passar para %s.".formatted(status, target));
        }
        boolean cancelling = target == OrderStatus.CANCELADO;
        if (cancelling && (cancellation == null || cancellation.reason() == null)) {
            throw new DomainValidationException("cancellationReason", "Informe o motivo do cancelamento.");
        }
        if (!cancelling && cancellation != null) {
            throw new DomainValidationException("cancellationReason", "Motivo só vale para cancelamento.");
        }
        String detail = cancelling ? blankToNull(cancellation.detail()) : null;
        if (cancelling && cancellation.reason() == CancellationReason.OUTRO && detail == null) {
            throw new DomainValidationException("cancellationDetail", "Descreva o motivo do cancelamento.");
        }
        status = target;
        statusHistory.add(new StatusChange(
                target, at, author.id(), author.name(), cancelling ? cancellation.reason() : null, detail));
    }

    private static void requireValidChange(Payment payment, BigDecimal total) {
        BigDecimal changeFor = payment.changeFor();
        if (changeFor == null) {
            return;
        }
        if (payment.method() != PaymentMethod.DINHEIRO) {
            throw new DomainValidationException("payment.changeFor", "Troco só vale para pagamento em dinheiro.");
        }
        if (changeFor.compareTo(total) < 0) {
            throw new DomainValidationException(
                    "payment.changeFor", "O troco precisa ser para %s ou mais.".formatted(reais(total)));
        }
    }

    // A plain space after R$: the JDK currency format puts a no-break space there.
    private static String reais(BigDecimal value) {
        return "R$ " + String.format(Locale.of("pt", "BR"), "%,.2f", value);
    }

    private static String blankToNull(String text) {
        return text == null || text.isBlank() ? null : text.strip();
    }

    // Inputs arrive with at most two decimals, so this only pins the scale, never rounds a value.
    private static BigDecimal money(BigDecimal value) {
        return value.setScale(2, RoundingMode.UNNECESSARY);
    }

    /** The short code people quote, such as "A1B2C3D4". It shows the order; it does not identify it. */
    public String code() {
        return codeOf(id);
    }

    // The tail of a UUID v7 is random; its head is the creation time, shared by orders minutes apart.
    static String codeOf(UUID id) {
        String hex = id.toString().replace("-", "");
        return hex.substring(hex.length() - 8).toUpperCase(Locale.ROOT);
    }

    public List<OrderStatus> allowedNextStatuses() {
        return status.next();
    }

    public UUID id() {
        return id;
    }

    public UUID restaurantId() {
        return restaurantId;
    }

    public OrderCustomer customer() {
        return customer;
    }

    public DeliveryAddress deliveryAddress() {
        return deliveryAddress;
    }

    public List<OrderItem> items() {
        return List.copyOf(items);
    }

    public BigDecimal deliveryFee() {
        return deliveryFee;
    }

    public BigDecimal subtotal() {
        return subtotal;
    }

    public BigDecimal total() {
        return total;
    }

    public Payment payment() {
        return payment;
    }

    public String notes() {
        return notes;
    }

    public OrderStatus status() {
        return status;
    }

    public List<StatusChange> statusHistory() {
        return List.copyOf(statusHistory);
    }

    public Instant createdAt() {
        return createdAt;
    }
}
