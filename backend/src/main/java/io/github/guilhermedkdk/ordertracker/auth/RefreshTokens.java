package io.github.guilhermedkdk.ordertracker.auth;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

// The refresh tokens behind Sessions. The database keeps only their hash, so a leaked table opens
// no session.
@Component
class RefreshTokens {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int TOKEN_BYTES = 32;
    // Tabs share the cookie: one renews, and another a moment behind still sends the replaced token.
    private static final Duration ROTATION_GRACE = Duration.ofSeconds(30);

    private final RefreshTokenRepository tokens;
    private final Clock clock;
    private final AuthProperties properties;

    RefreshTokens(RefreshTokenRepository tokens, Clock clock, AuthProperties properties) {
        this.tokens = tokens;
        this.clock = clock;
        this.properties = properties;
    }

    // Starts a family for a new sign-in.
    @Transactional
    String issue(UUID userId) {
        Instant now = clock.instant();
        String token = newToken();
        tokens.save(RefreshToken.firstOf(userId, hash(token), now, properties.refreshTtl()));
        return token;
    }

    // Replaces a live token with the next one of its family. A token replaced moments ago still
    // renews the access token, without a new refresh token: the browser already holds that one.
    @Transactional
    Renewal renew(String token) {
        Instant now = clock.instant();
        RefreshToken found = tokens.findByTokenHash(hash(token)).orElse(null);
        // A family is over once any of its tokens is revoked, even a successor saved while a sign-out
        // or a reuse revoked the rest.
        if (found == null || !found.isUnexpiredAt(now) || tokens.isFamilyRevoked(found.familyId())) {
            return new Renewal.Refused();
        }
        if (found.wasRotatedSince(now.minus(ROTATION_GRACE))) {
            return new Renewal.KeptBrowserToken(found.userId());
        }
        if (found.wasRotated()) {
            // A replaced token showing up later means someone else holds a copy: the session ends.
            tokens.revokeFamily(found.familyId(), now);
            return new Renewal.Refused();
        }
        // Of two renewals racing with the same token, only one rotates it; a sign-out racing with this
        // one wins too.
        if (tokens.markRotated(found.id(), now) == 0) {
            return tokens.isFamilyRevoked(found.familyId())
                    ? new Renewal.Refused()
                    : new Renewal.KeptBrowserToken(found.userId());
        }
        String next = newToken();
        tokens.save(found.next(hash(next), now, properties.refreshTtl()));
        return new Renewal.Rotated(found.userId(), next);
    }

    // Ends the session the token belongs to, with every token of its family.
    @Transactional
    void revoke(String token) {
        tokens.findByTokenHash(hash(token)).ifPresent(found -> tokens.revokeFamily(found.familyId(), clock.instant()));
    }

    sealed interface Renewal {

        record Rotated(UUID userId, String token) implements Renewal {}

        record KeptBrowserToken(UUID userId) implements Renewal {}

        record Refused() implements Renewal {}
    }

    private static String newToken() {
        byte[] bytes = new byte[TOKEN_BYTES];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String hash(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("Every JVM ships SHA-256.", e);
        }
    }
}
