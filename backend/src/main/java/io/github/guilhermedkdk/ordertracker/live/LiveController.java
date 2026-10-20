package io.github.guilhermedkdk.ordertracker.live;

import io.github.guilhermedkdk.ordertracker.auth.CurrentUser;
import io.github.guilhermedkdk.ordertracker.restaurant.RestaurantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@Tag(name = "Tempo real", description = "Mudanças de status dos pedidos visíveis, por SSE.")
class LiveController {

    private final OrderStream stream;
    private final RestaurantService restaurants;

    LiveController(OrderStream stream, RestaurantService restaurants) {
        this.stream = stream;
        this.restaurants = restaurants;
    }

    @Operation(summary = "Abre o stream de mudanças de status", description = """
                    Server-sent events. Um evento `status` por mudança de status, com `orderId`, \
                    `restaurantId` e `status`, só dos restaurantes que o usuário enxerga, e um comentário de \
                    sinal de vida a cada 30 segundos. A API fecha o stream a cada 100 segundos, e o navegador \
                    reconecta sozinho.""")
    @ApiResponse(responseCode = "200", description = "Stream aberto")
    @ApiResponse(responseCode = "401", description = "Sem sessão")
    @GetMapping(path = "/api/orders/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    SseEmitter stream(CurrentUser user) {
        return stream.open(restaurants.scopeOf(user));
    }
}
