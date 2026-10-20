package io.github.guilhermedkdk.ordertracker.auth;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;

// One refresh token of a session. Each sign-in starts a family, and each renewal replaces the token
// with the next one of the same family.
@Entity
@Table(name = "refresh_tokens")
class RefreshToken {

    @Id
    @UuidGenerator(style = UuidGenerator.Style.VERSION_7)
    private UUID id;

    private UUID userId;
    private UUID familyId;
    private String tokenHash;
    private Instant createdAt;
    private Instant expiresAt;
    private Instant rotatedAt;
    private Instant revokedAt;

    protected RefreshToken() {}

    private RefreshToken(UUID userId, UUID familyId, String tokenHash, Instant now, Duration ttl) {
        this.userId = userId;
        this.familyId = familyId;
        this.tokenHash = tokenHash;
        this.createdAt = now;
        this.expiresAt = now.plus(ttl);
    }

    static RefreshToken firstOf(UUID userId, String tokenHash, Instant now, Duration ttl) {
        return new RefreshToken(userId, UUID.randomUUID(), tokenHash, now, ttl);
    }

    // The successor of this token in the same family.
    RefreshToken next(String nextHash, Instant now, Duration ttl) {
        return new RefreshToken(userId, familyId, nextHash, now, ttl);
    }

    boolean isUnexpiredAt(Instant now) {
        return revokedAt == null && now.isBefore(expiresAt);
    }

    boolean wasRotated() {
        return rotatedAt != null;
    }

    boolean wasRotatedSince(Instant since) {
        return rotatedAt != null && !rotatedAt.isBefore(since);
    }

    UUID id() {
        return id;
    }

    UUID userId() {
        return userId;
    }

    UUID familyId() {
        return familyId;
    }
}
