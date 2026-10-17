package io.github.guilhermedkdk.ordertracker;

import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

/** Signed-in sessions for each role, each on a fresh account. */
public class TestAccounts {

    public static final String PASSWORD = "segredo123";

    private final MockMvcTester mvc;
    private final JdbcTemplate jdbc;
    private final PasswordEncoder passwords;

    TestAccounts(MockMvcTester mvc, JdbcTemplate jdbc, PasswordEncoder passwords) {
        this.mvc = mvc;
        this.jdbc = jdbc;
        this.passwords = passwords;
    }

    public ApiSession owner(String name) {
        var session = new ApiSession(mvc);
        session.signup(name, ApiSession.uniqueEmail(), PASSWORD);
        return session;
    }

    public ApiSession admin(String name) {
        String email = ApiSession.uniqueEmail();
        // No route creates an admin; outside tests only the demo data does.
        jdbc.update(
                "insert into users (id, name, email, password_hash, role, demo, created_at)"
                        + " values (?, ?, ?, ?, 'ADMIN', false, now())",
                UUID.randomUUID(),
                name,
                email,
                passwords.encode(PASSWORD));
        var session = new ApiSession(mvc);
        session.post("/api/auth/login", """
                {"email": "%s", "password": "%s"}
                """.formatted(email, PASSWORD));
        return session;
    }
}
