package io.github.guilhermedkdk.ordertracker.auth;

import io.github.guilhermedkdk.ordertracker.shared.ConflictException;
import io.github.guilhermedkdk.ordertracker.shared.DomainValidationException;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.util.Optional;
import java.util.UUID;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class AuthService {

    private static final String EMAIL_TAKEN = "E-mail já cadastrado.";
    private static final String INVALID_CREDENTIALS = "E-mail ou senha inválidos.";
    // BCrypt ignores everything past 72 bytes, so a longer password would silently match a prefix.
    private static final int MAX_PASSWORD_BYTES = 72;

    private final UserRepository users;
    private final PasswordEncoder passwords;
    private final Clock clock;
    // Checked when the e-mail is unknown, so a miss takes as long as a wrong password.
    private final String unknownUserHash;

    AuthService(UserRepository users, PasswordEncoder passwords, Clock clock) {
        this.users = users;
        this.passwords = passwords;
        this.clock = clock;
        this.unknownUserHash = passwords.encode("unknown-user");
    }

    @Transactional
    User signup(String name, String email, String password) {
        if (password.getBytes(StandardCharsets.UTF_8).length > MAX_PASSWORD_BYTES) {
            throw new DomainValidationException("password", "A senha é longa demais.");
        }
        if (users.existsByEmail(email)) {
            throw new ConflictException(EMAIL_TAKEN);
        }
        try {
            return users.saveAndFlush(User.owner(name.strip(), email, passwords.encode(password), clock.instant()));
        } catch (DataIntegrityViolationException e) {
            throw new ConflictException(EMAIL_TAKEN);
        }
    }

    @Transactional(readOnly = true)
    User login(String email, String password) {
        Optional<User> user = users.findByEmail(email);
        String hash = user.map(User::passwordHash).orElse(unknownUserHash);
        if (!passwords.matches(password, hash) || user.isEmpty()) {
            throw new BadCredentialsException(INVALID_CREDENTIALS);
        }
        return user.get();
    }

    @Transactional(readOnly = true)
    Optional<User> find(UUID id) {
        return users.findById(id);
    }
}
