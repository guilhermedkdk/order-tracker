package io.github.guilhermedkdk.ordertracker.auth;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

// jwtSecret: HMAC key of at least 32 bytes; blank means a random key per run.
// cookieSecure: off locally, on in production, where everything is HTTPS.
@ConfigurationProperties("app.auth")
record AuthProperties(String jwtSecret, Duration sessionTtl, boolean cookieSecure) {}
