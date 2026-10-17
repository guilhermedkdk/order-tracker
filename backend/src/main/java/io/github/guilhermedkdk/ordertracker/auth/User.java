package io.github.guilhermedkdk.ordertracker.auth;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "users")
class User {

    @Id
    @UuidGenerator(style = UuidGenerator.Style.VERSION_7)
    private UUID id;

    private String name;
    private String email;
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    private Role role;

    private boolean demo;
    private Instant createdAt;

    protected User() {}

    private User(String name, String email, String passwordHash, Role role, boolean demo, Instant createdAt) {
        this.name = name;
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role;
        this.demo = demo;
        this.createdAt = createdAt;
    }

    static User owner(String name, String email, String passwordHash, Instant createdAt) {
        return new User(name, email, passwordHash, Role.DONO, false, createdAt);
    }

    static User demo(String name, String email, String passwordHash, Role role, Instant createdAt) {
        return new User(name, email, passwordHash, role, true, createdAt);
    }

    CurrentUser toCurrentUser() {
        return new CurrentUser(id, name, email, role);
    }

    String passwordHash() {
        return passwordHash;
    }

    boolean isDemo() {
        return demo;
    }
}
