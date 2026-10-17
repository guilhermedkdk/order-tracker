package io.github.guilhermedkdk.ordertracker.restaurant;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "restaurants")
class Restaurant {

    @Id
    @UuidGenerator(style = UuidGenerator.Style.VERSION_7)
    private UUID id;

    private String name;
    private UUID ownerId;
    private Instant createdAt;

    protected Restaurant() {}

    Restaurant(String name, UUID ownerId, Instant createdAt) {
        this.name = name;
        this.ownerId = ownerId;
        this.createdAt = createdAt;
    }

    UUID id() {
        return id;
    }

    String name() {
        return name;
    }

    UUID ownerId() {
        return ownerId;
    }
}
