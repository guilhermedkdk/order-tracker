package io.github.guilhermedkdk.ordertracker.auth;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

// jwtSecret: HMAC key of at least 32 bytes; blank means a random key per run.
// accessTtl: how long the JWT of each request lasts; refreshTtl, how long a session lasts unused.
// cookieSecure: off locally, on in production, where everything is HTTPS.
@ConfigurationProperties("app.auth")
record AuthProperties(String jwtSecret, Duration accessTtl, Duration refreshTtl, boolean cookieSecure) {}
