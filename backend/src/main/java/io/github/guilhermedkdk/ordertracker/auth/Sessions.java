package io.github.guilhermedkdk.ordertracker.auth;

import io.github.guilhermedkdk.ordertracker.auth.RefreshTokens.Renewal;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.stereotype.Component;

// Owns the session cookies: a short-lived JWT read on every request and the refresh token that
// renews it. Nothing else knows their format.
@Component
class Sessions implements BearerTokenResolver {

    static final String COOKIE = "ot_session";
    static final String REFRESH_COOKIE = "ot_refresh";
    static final String ISSUER = "order-tracker";
    // Only renewing and signing out read the refresh token, so no other request carries it.
    private static final String REFRESH_PATH = "/api/auth";

    private final JwtEncoder encoder;
    private final RefreshTokens refreshTokens;
    private final UserRepository users;
    private final Clock clock;
    private final AuthProperties properties;

    Sessions(
            JwtEncoder encoder,
            RefreshTokens refreshTokens,
            UserRepository users,
            Clock clock,
            AuthProperties properties) {
        this.encoder = encoder;
        this.refreshTokens = refreshTokens;
        this.users = users;
        this.clock = clock;
        this.properties = properties;
    }

    // The cookies of a new session for someone who just signed up or in.
    HttpHeaders open(CurrentUser user) {
        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.SET_COOKIE, accessCookie(user).toString());
        headers.add(
                HttpHeaders.SET_COOKIE,
                refreshCookie(refreshTokens.issue(user.id()), properties.refreshTtl())
                        .toString());
        return headers;
    }

    // The cookies that keep a session going once its access token expired, or 401 when the refresh
    // token is missing, expired or revoked.
    HttpHeaders renew(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new AuthenticationCredentialsNotFoundException("Sem refresh token.");
        }
        HttpHeaders headers = new HttpHeaders();
        switch (refreshTokens.renew(refreshToken)) {
            case Renewal.Rotated(UUID userId, String next) -> {
                headers.add(HttpHeaders.SET_COOKIE, accessCookie(userOf(userId)).toString());
                headers.add(
                        HttpHeaders.SET_COOKIE,
                        refreshCookie(next, properties.refreshTtl()).toString());
            }
            case Renewal.KeptBrowserToken(UUID userId) ->
                headers.add(HttpHeaders.SET_COOKIE, accessCookie(userOf(userId)).toString());
            case Renewal.Refused() -> throw new AuthenticationCredentialsNotFoundException("Refresh token recusado.");
        }
        return headers;
    }

    // Revokes the session of the refresh token, when there is one, and clears both cookies.
    HttpHeaders close(String refreshToken) {
        if (refreshToken != null && !refreshToken.isBlank()) {
            refreshTokens.revoke(refreshToken);
        }
        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.SET_COOKIE, cookie("", Duration.ZERO).toString());
        headers.add(HttpHeaders.SET_COOKIE, refreshCookie("", Duration.ZERO).toString());
        return headers;
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
        if (PublicRoutes.MATCHER.matches(request) || request.getCookies() == null) {
            return null;
        }
        for (Cookie cookie : request.getCookies()) {
            if (COOKIE.equals(cookie.getName()) && !cookie.getValue().isBlank()) {
                return cookie.getValue();
            }
        }
        return null;
    }

    // Read again on each renewal, so a session picks up a changed name or role.
    private CurrentUser userOf(UUID userId) {
        return users.findById(userId)
                .map(User::toCurrentUser)
                .orElseThrow(() -> new AuthenticationCredentialsNotFoundException("Usuário da sessão não existe."));
    }

    private ResponseCookie accessCookie(CurrentUser user) {
        Instant now = clock.instant();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(ISSUER)
                .subject(user.id().toString())
                .issuedAt(now)
                .expiresAt(now.plus(properties.accessTtl()))
                .claim("name", user.name())
                .claim("email", user.email())
                .claim("role", user.role().name())
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        String token = encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
        return cookie(token, properties.accessTtl());
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

    private ResponseCookie refreshCookie(String value, Duration maxAge) {
        return ResponseCookie.from(REFRESH_COOKIE, value)
                .httpOnly(true)
                .secure(properties.cookieSecure())
                .sameSite("Strict")
                .path(REFRESH_PATH)
                .maxAge(maxAge)
                .build();
    }
}
