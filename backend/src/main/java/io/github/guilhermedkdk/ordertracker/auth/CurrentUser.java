package io.github.guilhermedkdk.ordertracker.auth;

import java.util.UUID;

/**
 * The user behind the current request, read from the session token. Controllers receive it as a
 * plain parameter.
 */
public record CurrentUser(UUID id, String name, String email, Role role) {

    public boolean isAdmin() {
        return role == Role.ADMIN;
    }
}
