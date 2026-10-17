package io.github.guilhermedkdk.ordertracker.order;

import io.github.guilhermedkdk.ordertracker.auth.CurrentUser;
import io.github.guilhermedkdk.ordertracker.shared.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.net.URI;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Tag(name = "Pedidos", description = "Pedidos dos restaurantes que o usuário enxerga.")
@RequestMapping("/api/orders")
class OrderController {

    private final OrderService orders;

    OrderController(OrderService orders) {
        this.orders = orders;
    }

    @Operation(
            summary = "Cria um pedido",
            description = "O total é calculado pela API. Telefone e CEP aceitam máscara.")
    @ApiResponse(responseCode = "201", description = "Pedido criado, com status RECEBIDO")
    @ApiResponse(responseCode = "400", description = "Dados inválidos, com o erro de cada campo")
    @ApiResponse(responseCode = "404", description = "Restaurante não encontrado")
    @PostMapping
    ResponseEntity<OrderResponse> create(CurrentUser user, @Valid @RequestBody CreateOrderRequest request) {
        OrderView created = orders.create(user, request.toNewOrder());
        return ResponseEntity.created(
                        URI.create("/api/orders/" + created.order().id()))
                .body(OrderResponse.of(created));
    }

    @Operation(summary = "Lista os pedidos visíveis")
    @ApiResponse(responseCode = "200", description = "Do mais novo para o mais antigo, paginado (até 100 por página)")
    @ApiResponse(responseCode = "404", description = "Filtro por restaurante fora do alcance")
    @GetMapping
    PageResponse<OrderSummaryResponse> list(
            CurrentUser user,
            @RequestParam(required = false) UUID restaurantId,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return PageResponse.of(orders.list(user, new OrderFilter(restaurantId, status), page, size)
                .map(OrderSummaryResponse::of));
    }

    @Operation(summary = "Busca um pedido pelo id")
    @ApiResponse(responseCode = "200", description = "O pedido com itens e histórico")
    @ApiResponse(responseCode = "404", description = "Pedido não encontrado")
    @GetMapping("/{id}")
    OrderResponse find(CurrentUser user, @PathVariable UUID id) {
        return OrderResponse.of(orders.find(user, id));
    }

    @Operation(
            summary = "Muda o status do pedido",
            description = "Só aceita os status de allowedNextStatuses. Cancelar exige cancellationReason.")
    @ApiResponse(responseCode = "200", description = "Status alterado e registrado no histórico")
    @ApiResponse(responseCode = "400", description = "Motivo do cancelamento ausente ou fora de lugar")
    @ApiResponse(responseCode = "404", description = "Pedido não encontrado")
    @ApiResponse(responseCode = "409", description = "Transição inválida ou pedido alterado por outra pessoa")
    @PatchMapping("/{id}/status")
    OrderResponse changeStatus(
            CurrentUser user, @PathVariable UUID id, @Valid @RequestBody ChangeStatusRequest request) {
        return OrderResponse.of(orders.changeStatus(user, id, request.status(), request.cancellation()));
    }

    record ChangeStatusRequest(
            @NotNull(message = "Informe o novo status.") OrderStatus status,
            CancellationReason cancellationReason,

            @Size(max = 300, message = "O detalhe vai até 300 caracteres.")
            String cancellationDetail) {

        // Absent when neither field came, so the order can tell "no cancellation" from "no reason".
        Cancellation cancellation() {
            if (cancellationReason == null && blankToNull(cancellationDetail) == null) {
                return null;
            }
            return new Cancellation(cancellationReason, cancellationDetail);
        }
    }

    record CreateOrderRequest(
            @NotNull(message = "Escolha o restaurante.") UUID restaurantId,
            @NotNull(message = "Informe o cliente.") @Valid CustomerRequest customer,

            @NotNull(message = "Informe o endereço de entrega.") @Valid
            AddressRequest deliveryAddress,

            @NotNull(message = "Adicione pelo menos um item.")
            @Size(min = 1, max = 50, message = "O pedido deve ter de 1 a 50 itens.")
            List<@Valid ItemRequest> items,

            @DecimalMin(value = "0.00", message = "A taxa de entrega não pode ser negativa.")
            @DecimalMax(value = "999.99", message = "A taxa de entrega vai até R$ 999,99.")
            @Digits(integer = 3, fraction = 2, message = "Use no máximo duas casas decimais.")
            BigDecimal deliveryFee,

            @NotNull(message = "Informe a forma de pagamento.") @Valid
            PaymentRequest payment,

            @Size(max = 500, message = "As observações vão até 500 caracteres.")
            String notes) {

        NewOrder toNewOrder() {
            return new NewOrder(
                    restaurantId,
                    new OrderCustomer(customer.name(), customer.phone()),
                    new DeliveryAddress(
                            deliveryAddress.cep(),
                            deliveryAddress.street(),
                            deliveryAddress.number(),
                            blankToNull(deliveryAddress.complement()),
                            deliveryAddress.neighborhood(),
                            deliveryAddress.city(),
                            deliveryAddress.state()),
                    items.stream()
                            .map(item -> new OrderItem(item.name(), item.quantity(), item.unitPrice()))
                            .toList(),
                    deliveryFee == null ? BigDecimal.ZERO : deliveryFee,
                    new Payment(payment.method(), payment.changeFor()),
                    blankToNull(notes));
        }
    }

    record CustomerRequest(
            @NotBlank(message = "Informe o nome do cliente.")
            @Size(min = 2, max = 100, message = "O nome deve ter entre 2 e 100 caracteres.")
            String name,

            @NotBlank(message = "Informe o telefone.")
            @Pattern(regexp = "\\d{10,11}", message = "Informe o telefone com DDD, com 10 ou 11 dígitos.")
            String phone) {

        CustomerRequest {
            name = strip(name);
            phone = digits(phone);
        }
    }

    record AddressRequest(
            @NotBlank(message = "Informe o CEP.") @Pattern(regexp = "\\d{8}", message = "O CEP tem 8 dígitos.")
            String cep,

            @NotBlank(message = "Informe a rua.") @Size(max = 150, message = "A rua vai até 150 caracteres.")
            String street,

            @NotBlank(message = "Informe o número.") @Size(max = 20, message = "O número vai até 20 caracteres.")
            String number,

            @Size(max = 100, message = "O complemento vai até 100 caracteres.")
            String complement,

            @NotBlank(message = "Informe o bairro.") @Size(max = 100, message = "O bairro vai até 100 caracteres.")
            String neighborhood,

            @NotBlank(message = "Informe a cidade.") @Size(max = 100, message = "A cidade vai até 100 caracteres.")
            String city,

            @NotBlank(message = "Informe a UF.")
            @Pattern(
                    regexp = "AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO",
                    message = "Informe uma UF válida, como SP.")
            String state) {

        AddressRequest {
            cep = digits(cep);
            street = strip(street);
            number = strip(number);
            complement = strip(complement);
            neighborhood = strip(neighborhood);
            city = strip(city);
            state = state == null ? null : state.strip().toUpperCase(Locale.ROOT);
        }
    }

    record ItemRequest(
            @NotBlank(message = "Informe o item.") @Size(max = 100, message = "O item vai até 100 caracteres.")
            String name,

            @NotNull(message = "Informe a quantidade.")
            @Min(value = 1, message = "A quantidade vai de 1 a 999.")
            @Max(value = 999, message = "A quantidade vai de 1 a 999.")
            Integer quantity,

            @NotNull(message = "Informe o preço.")
            @DecimalMin(value = "0.01", message = "O preço precisa ser maior que zero.")
            @DecimalMax(value = "99999.99", message = "O preço vai até R$ 99.999,99.")
            @Digits(integer = 5, fraction = 2, message = "Use no máximo duas casas decimais.")
            BigDecimal unitPrice) {

        ItemRequest {
            name = strip(name);
        }
    }

    record PaymentRequest(
            @NotNull(message = "Informe a forma de pagamento.")
            PaymentMethod method,

            @DecimalMin(value = "0.01", message = "O troco precisa ser maior que zero.")
            @Digits(integer = 5, fraction = 2, message = "Use no máximo duas casas decimais.")
            BigDecimal changeFor) {}

    record OrderSummaryResponse(
            UUID id,
            String code,
            UUID restaurantId,
            String restaurantName,
            OrderStatus status,
            List<OrderStatus> allowedNextStatuses,
            String customerName,
            String neighborhood,
            BigDecimal total,
            Instant createdAt) {

        static OrderSummaryResponse of(OrderView view) {
            Order order = view.order();
            return new OrderSummaryResponse(
                    order.id(),
                    order.code(),
                    order.restaurantId(),
                    view.restaurantName(),
                    order.status(),
                    order.allowedNextStatuses(),
                    order.customer().name(),
                    order.deliveryAddress().neighborhood(),
                    order.total(),
                    order.createdAt());
        }
    }

    record OrderResponse(
            UUID id,
            String code,
            UUID restaurantId,
            String restaurantName,
            OrderStatus status,
            List<OrderStatus> allowedNextStatuses,
            OrderCustomer customer,
            DeliveryAddress deliveryAddress,
            List<OrderItem> items,
            BigDecimal subtotal,
            BigDecimal deliveryFee,
            BigDecimal total,
            Payment payment,
            String notes,
            Instant createdAt,
            List<StatusChange> statusHistory) {

        static OrderResponse of(OrderView view) {
            Order order = view.order();
            return new OrderResponse(
                    order.id(),
                    order.code(),
                    order.restaurantId(),
                    view.restaurantName(),
                    order.status(),
                    order.allowedNextStatuses(),
                    order.customer(),
                    order.deliveryAddress(),
                    order.items(),
                    order.subtotal(),
                    order.deliveryFee(),
                    order.total(),
                    order.payment(),
                    order.notes(),
                    order.createdAt(),
                    order.statusHistory());
        }
    }

    private static String strip(String text) {
        return text == null ? null : text.strip();
    }

    private static String blankToNull(String text) {
        return text == null || text.isBlank() ? null : text;
    }

    // Masks such as "(11) 98765-4321" and "01310-100" arrive from forms; only the digits are stored.
    private static String digits(String text) {
        return text == null ? null : text.replaceAll("\\D", "");
    }
}
