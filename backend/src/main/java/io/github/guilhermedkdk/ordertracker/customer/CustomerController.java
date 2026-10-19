package io.github.guilhermedkdk.ordertracker.customer;

import io.github.guilhermedkdk.ordertracker.auth.CurrentUser;
import io.github.guilhermedkdk.ordertracker.restaurant.RestaurantService;
import io.github.guilhermedkdk.ordertracker.shared.NotFoundException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Tag(name = "Clientes", description = "Clientes de cada restaurante, para preencher o próximo pedido.")
@RequestMapping("/api/customers")
class CustomerController {

    private final CustomerBook customers;
    private final RestaurantService restaurants;

    CustomerController(CustomerBook customers, RestaurantService restaurants) {
        this.customers = customers;
        this.restaurants = restaurants;
    }

    @Operation(summary = "Busca o cliente de um restaurante pelo telefone")
    @ApiResponse(responseCode = "200", description = "Nome e último endereço do cliente")
    @ApiResponse(responseCode = "404", description = "Cliente ou restaurante não encontrado")
    @GetMapping
    CustomerResponse lookup(CurrentUser user, @RequestParam UUID restaurantId, @RequestParam String phone) {
        restaurants.requireVisible(restaurants.scopeOf(user), restaurantId);
        return customers
                .lookup(restaurantId, phone.replaceAll("\\D", ""))
                .map(CustomerResponse::of)
                .orElseThrow(() -> new NotFoundException("Cliente não encontrado."));
    }

    record CustomerResponse(String name, String phone, CustomerAddress lastAddress) {

        static CustomerResponse of(Customer customer) {
            return new CustomerResponse(customer.name(), customer.phone(), customer.lastAddress());
        }
    }
}
