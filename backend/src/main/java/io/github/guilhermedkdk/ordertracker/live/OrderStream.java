package io.github.guilhermedkdk.ordertracker.live;

import io.github.guilhermedkdk.ordertracker.order.OrderStatusChanged;
import io.github.guilhermedkdk.ordertracker.restaurant.RestaurantScope;
import java.io.IOException;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.TimeUnit;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter.SseEventBuilder;

// The open SSE connections, each with the scope of whoever opened it. A status change reaches only
// the connections that see its restaurant, and only after the change is committed.
@Component
class OrderStream {

    // A little under the 120 s Vercel gives a proxied request, so the browser reconnects on our terms.
    private static final Duration LIFETIME = Duration.ofSeconds(100);

    private final List<Connection> connections = new CopyOnWriteArrayList<>();

    private record Connection(SseEmitter emitter, RestaurantScope scope) {}

    SseEmitter open(RestaurantScope scope) {
        SseEmitter emitter = new SseEmitter(LIFETIME.toMillis());
        Connection connection = new Connection(emitter, scope);
        connections.add(connection);
        emitter.onCompletion(() -> connections.remove(connection));
        emitter.onError(error -> connections.remove(connection));
        // Sends the headers right away, so the browser and the proxies see the stream open.
        send(connection, SseEmitter.event().comment("conectado"));
        return emitter;
    }

    @TransactionalEventListener
    void on(OrderStatusChanged change) {
        for (Connection connection : connections) {
            if (connection.scope().includes(change.restaurantId())) {
                send(connection, SseEmitter.event().name("status").data(change, MediaType.APPLICATION_JSON));
            }
        }
    }

    // Proxies close a connection that stays silent for long.
    @Scheduled(fixedRate = 30, timeUnit = TimeUnit.SECONDS)
    void heartbeat() {
        for (Connection connection : connections) {
            send(connection, SseEmitter.event().comment("sinal de vida"));
        }
    }

    private void send(Connection connection, SseEventBuilder event) {
        try {
            connection.emitter().send(event);
        } catch (IOException | IllegalStateException e) {
            // The browser left before the container told the emitter.
            connections.remove(connection);
        }
    }
}
