package io.github.guilhermedkdk.ordertracker.auth;

import java.util.Collection;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** What other packages may read about users, without touching the user entity. */
@Service
public class UserDirectory {

    private final UserRepository users;

    UserDirectory(UserRepository users) {
        this.users = users;
    }

    @Transactional(readOnly = true)
    public Map<UUID, String> namesOf(Collection<UUID> ids) {
        return users.findAllById(ids).stream()
                .map(User::toCurrentUser)
                .collect(Collectors.toMap(CurrentUser::id, CurrentUser::name));
    }
}
