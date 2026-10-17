package io.github.guilhermedkdk.ordertracker.auth;

import org.springframework.http.HttpMethod;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;
import org.springframework.security.web.util.matcher.OrRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;

// The routes open without a session. Sessions also skips the cookie on them: a stale token would
// otherwise answer 401 even where no session is needed.
final class PublicRoutes {

    private static final PathPatternRequestMatcher.Builder PATHS = PathPatternRequestMatcher.withDefaults();

    static final RequestMatcher MATCHER = new OrRequestMatcher(
            PATHS.matcher(HttpMethod.POST, "/api/auth/signup"),
            PATHS.matcher(HttpMethod.POST, "/api/auth/login"),
            PATHS.matcher(HttpMethod.POST, "/api/auth/logout"),
            PATHS.matcher("/actuator/health"),
            PATHS.matcher("/error"),
            PATHS.matcher("/swagger-ui.html"),
            PATHS.matcher("/swagger-ui/**"),
            PATHS.matcher("/v3/api-docs"),
            PATHS.matcher("/v3/api-docs/**"));

    private PublicRoutes() {}
}
