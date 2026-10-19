package io.github.guilhermedkdk.ordertracker.auth;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    // Rotates only a token neither rotated nor revoked yet; 0 means another request got there first.
    @Modifying
    @Query(
            "update RefreshToken t set t.rotatedAt = :at where t.id = :id and t.rotatedAt is null and t.revokedAt is null")
    int markRotated(UUID id, Instant at);

    @Modifying
    @Query("update RefreshToken t set t.revokedAt = :at where t.familyId = :familyId and t.revokedAt is null")
    void revokeFamily(UUID familyId, Instant at);

    @Query("select count(t) > 0 from RefreshToken t where t.familyId = :familyId and t.revokedAt is not null")
    boolean isFamilyRevoked(UUID familyId);
}
