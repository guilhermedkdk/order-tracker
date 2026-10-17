package io.github.guilhermedkdk.ordertracker.demo;

import io.github.guilhermedkdk.ordertracker.order.Cancellation;
import io.github.guilhermedkdk.ordertracker.order.CancellationReason;
import io.github.guilhermedkdk.ordertracker.order.DeliveryAddress;
import io.github.guilhermedkdk.ordertracker.order.OrderItem;
import io.github.guilhermedkdk.ordertracker.order.OrderStatus;
import io.github.guilhermedkdk.ordertracker.order.Payment;
import io.github.guilhermedkdk.ordertracker.order.PaymentMethod;
import java.math.BigDecimal;
import java.util.List;

// The fictional restaurants and orders of the demo. Every person and phone number here is made up.
final class DemoScript {

    static final String CANTINA = "Cantina Bella Napoli";
    static final String BURGER = "Burger da Vila";
    static final String SUSHI = "Sushi Kenzo";

    /**
     * One sample order. It goes forward until {@code reached} and, when {@code cancellation} is set,
     * is cancelled from there.
     */
    record DemoOrder(
            String restaurant,
            int minutesAgo,
            String customer,
            String phone,
            DeliveryAddress address,
            List<OrderItem> items,
            BigDecimal deliveryFee,
            Payment payment,
            OrderStatus reached,
            Cancellation cancellation) {}

    static final List<DemoOrder> ORDERS = List.of(
            order(
                    CANTINA,
                    5,
                    "Marina Alves",
                    "11987650001",
                    address("01304001", "Rua Augusta", "1500", "Consolação"),
                    List.of(item("Pizza margherita", 1, "54.90"), item("Refrigerante 2 L", 1, "14.00")),
                    "8.00",
                    pix(),
                    OrderStatus.RECEBIDO,
                    null),
            order(
                    BURGER,
                    12,
                    "Pedro Henrique",
                    "11987650002",
                    address("01426001", "Rua Oscar Freire", "900", "Jardim Paulista"),
                    List.of(item("Smash duplo", 2, "36.90"), item("Batata frita", 1, "18.00")),
                    "7.00",
                    card(PaymentMethod.CARTAO_CREDITO),
                    OrderStatus.RECEBIDO,
                    null),
            order(
                    SUSHI,
                    18,
                    "Camila Rocha",
                    "11987650003",
                    address("01318002", "Av. Brigadeiro Luís Antônio", "2000", "Bela Vista"),
                    List.of(item("Combo 20 peças", 1, "89.90")),
                    "9.90",
                    pix(),
                    OrderStatus.EM_PREPARO,
                    null),
            order(
                    CANTINA,
                    25,
                    "Lucas Martins",
                    "11987650004",
                    address("05422010", "Rua dos Pinheiros", "300", "Pinheiros"),
                    List.of(item("Lasanha à bolonhesa", 2, "48.00")),
                    "8.00",
                    cash("120.00"),
                    OrderStatus.EM_PREPARO,
                    null),
            order(
                    BURGER,
                    33,
                    "Fernanda Lima",
                    "11987650005",
                    address("05406100", "Rua Teodoro Sampaio", "1200", "Pinheiros"),
                    List.of(item("Cheeseburger", 1, "32.00"), item("Milkshake de chocolate", 1, "22.00")),
                    "7.00",
                    card(PaymentMethod.CARTAO_DEBITO),
                    OrderStatus.SAIU_PARA_ENTREGA,
                    null),
            order(
                    SUSHI,
                    41,
                    "Rodrigo Nunes",
                    "11987650006",
                    address("01418100", "Alameda Santos", "1000", "Cerqueira César"),
                    List.of(item("Temaki de salmão", 2, "34.00"), item("Hot roll", 1, "29.90")),
                    "9.90",
                    card(PaymentMethod.CARTAO_CREDITO),
                    OrderStatus.SAIU_PARA_ENTREGA,
                    null),
            order(
                    CANTINA,
                    55,
                    "Beatriz Souza",
                    "11987650007",
                    address("01414001", "Rua Haddock Lobo", "500", "Cerqueira César"),
                    List.of(item("Pizza calabresa", 1, "52.90")),
                    "8.00",
                    pix(),
                    OrderStatus.SAIU_PARA_ENTREGA,
                    null),
            order(
                    BURGER,
                    70,
                    "Gustavo Ferreira",
                    "11987650008",
                    address("01310200", "Av. Paulista", "1578", "Bela Vista"),
                    List.of(item("Smash simples", 3, "28.90")),
                    "7.00",
                    pix(),
                    OrderStatus.ENTREGUE,
                    null),
            order(
                    SUSHI,
                    85,
                    "Larissa Mendes",
                    "11987650009",
                    address("04101300", "Rua Vergueiro", "3000", "Vila Mariana"),
                    List.of(item("Combo 30 peças", 1, "129.90"), item("Missoshiru", 2, "12.00")),
                    "12.00",
                    card(PaymentMethod.CARTAO_CREDITO),
                    OrderStatus.ENTREGUE,
                    null),
            order(
                    CANTINA,
                    100,
                    "Thiago Ribeiro",
                    "11987650010",
                    address("04010100", "Rua Domingos de Morais", "1500", "Vila Mariana"),
                    List.of(item("Pizza quatro queijos", 1, "58.90"), item("Tiramisù", 1, "24.00")),
                    "8.00",
                    cash("100.00"),
                    OrderStatus.ENTREGUE,
                    null),
            order(
                    BURGER,
                    120,
                    "Aline Castro",
                    "11987650011",
                    address("05407002", "Rua Cardeal Arcoverde", "2000", "Pinheiros"),
                    List.of(item("Burger vegano", 1, "34.90")),
                    "7.00",
                    pix(),
                    OrderStatus.ENTREGUE,
                    null),
            order(
                    SUSHI,
                    140,
                    "Bruno Teixeira",
                    "11987650012",
                    address("05416011", "Rua Fradique Coutinho", "700", "Pinheiros"),
                    List.of(item("Sashimi de salmão", 1, "64.90")),
                    "9.90",
                    card(PaymentMethod.CARTAO_DEBITO),
                    OrderStatus.RECEBIDO,
                    new Cancellation(CancellationReason.CLIENTE_DESISTIU, null)),
            order(
                    CANTINA,
                    160,
                    "Carolina Dias",
                    "11987650013",
                    address("01415001", "Rua Bela Cintra", "1200", "Consolação"),
                    List.of(item("Pizza margherita", 2, "54.90")),
                    "8.00",
                    pix(),
                    OrderStatus.EM_PREPARO,
                    new Cancellation(CancellationReason.ITEM_INDISPONIVEL, "Acabou a mussarela de búfala")),
            order(
                    BURGER,
                    190,
                    "Diego Araújo",
                    "11987650014",
                    address("05417001", "Rua Mourato Coelho", "900", "Pinheiros"),
                    List.of(item("Smash duplo", 1, "36.90")),
                    "7.00",
                    cash("50.00"),
                    OrderStatus.SAIU_PARA_ENTREGA,
                    new Cancellation(CancellationReason.CLIENTE_NAO_ENCONTRADO, "Ninguém atendeu no portão")),
            order(
                    SUSHI,
                    240,
                    "Patrícia Gomes",
                    "11987650015",
                    address("04534001", "Rua Joaquim Floriano", "400", "Itaim Bibi"),
                    List.of(item("Combo 20 peças", 1, "89.90")),
                    "9.90",
                    pix(),
                    OrderStatus.ENTREGUE,
                    null));

    private DemoScript() {}

    private static DemoOrder order(
            String restaurant,
            int minutesAgo,
            String customer,
            String phone,
            DeliveryAddress address,
            List<OrderItem> items,
            String deliveryFee,
            Payment payment,
            OrderStatus reached,
            Cancellation cancellation) {
        return new DemoOrder(
                restaurant,
                minutesAgo,
                customer,
                phone,
                address,
                items,
                new BigDecimal(deliveryFee),
                payment,
                reached,
                cancellation);
    }

    private static DeliveryAddress address(String cep, String street, String number, String neighborhood) {
        return new DeliveryAddress(cep, street, number, null, neighborhood, "São Paulo", "SP");
    }

    private static OrderItem item(String name, int quantity, String unitPrice) {
        return new OrderItem(name, quantity, new BigDecimal(unitPrice));
    }

    private static Payment pix() {
        return new Payment(PaymentMethod.PIX, null);
    }

    private static Payment card(PaymentMethod method) {
        return new Payment(method, null);
    }

    private static Payment cash(String changeFor) {
        return new Payment(PaymentMethod.DINHEIRO, new BigDecimal(changeFor));
    }
}
