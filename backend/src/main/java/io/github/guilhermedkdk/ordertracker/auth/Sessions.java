package io.github.guilhermedkdk.ordertracker.auth;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.ResponseCookie;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.stereotype.Component;

// Owns the session cookie and the claims inside its token, so nothing else knows either format.
@Component
class Sessions implements BearerTokenResolver {

    static final String COOKIE = "ot_session";
    static final String ISSUER = "order-tracker";

    // A stale cookie on these routes would answer 401 and keep the person from signing in again.
    private static final Set<String> IGNORED_PATHS = Set.of("/api/auth/signup", "/api/auth/login", "/api/auth/logout");

    private final JwtEncoder encoder;
    private final Clock clock;
    private final AuthProperties properties;

    Sessions(JwtEncoder encoder, Clock clock, AuthProperties properties) {
        this.encoder = encoder;
        this.clock = clock;
        this.properties = properties;
    }

    ResponseCookie open(CurrentUser user) {
        Instant now = clock.instant();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(ISSUER)
                .subject(user.id().toString())
                .issuedAt(now)
                .expiresAt(now.plus(properties.sessionTtl()))
                .claim("name", user.name())
                .claim("email", user.email())
                .claim("role", user.role().name())
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        String token = encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
        return cookie(token, properties.sessionTtl());
    }

    ResponseCookie close() {
        return cookie("", Duration.ZERO);
    }

    static CurrentUser currentUser(Jwt jwt) {
        return new CurrentUser(
                UUID.fromString(jwt.getSubject()),
                jwt.getClaimAsString("name"),
                jwt.getClaimAsString("email"),
                Role.valueOf(jwt.getClaimAsString("role")));
    }

    @Override
    public String resolve(HttpServletRequest request) {
        if (IGNORED_PATHS.contains(request.getRequestURI()) || request.getCookies() == null) {
            return null;
        }
        for (Cookie cookie : request.getCookies()) {
            if (COOKIE.equals(cookie.getName()) && !cookie.getValue().isBlank()) {
                return cookie.getValue();
            }
        }
        return null;
    }

    private ResponseCookie cookie(String value, Duration maxAge) {
        return ResponseCookie.from(COOKIE, value)
                .httpOnly(true)
                .secure(properties.cookieSecure())
                .sameSite("Lax")
                .path("/")
                .maxAge(maxAge)
                .build();
    }
}
