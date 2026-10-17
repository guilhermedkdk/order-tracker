package io.github.guilhermedkdk.ordertracker.auth;

import java.time.Clock;
import java.util.Collection;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** What other packages may read or set up about users, without touching the user entity. */
@Service
public class UserDirectory {

    private final UserRepository users;
    private final PasswordEncoder passwords;
    private final Clock clock;

    UserDirectory(UserRepository users, PasswordEncoder passwords, Clock clock) {
        this.users = users;
        this.passwords = passwords;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public Map<UUID, String> namesOf(Collection<UUID> ids) {
        return users.findAllById(ids).stream()
                .map(User::toCurrentUser)
                .collect(Collectors.toMap(CurrentUser::id, CurrentUser::name));
    }

    @Transactional(readOnly = true)
    public boolean exists(String email) {
        return users.existsByEmail(email);
    }

    /** The demo account with this e-mail, created on first use. An existing one is left as it is. */
    @Transactional
    public CurrentUser ensureDemoAccount(String name, String email, String password, Role role) {
        return users.findByEmail(email)
                .orElseGet(() -> users.save(User.demo(name, email, passwords.encode(password), role, clock.instant())))
                .toCurrentUser();
    }
}
