package io.github.guilhermedkdk.ordertracker.auth;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    // Rotates only a token not rotated yet; 0 means another renewal got there first.
    @Modifying
    @Query("update RefreshToken t set t.rotatedAt = :at where t.id = :id and t.rotatedAt is null")
    int markRotated(UUID id, Instant at);

    @Modifying
    @Query("update RefreshToken t set t.revokedAt = :at where t.familyId = :familyId and t.revokedAt is null")
    void revokeFamily(UUID familyId, Instant at);

    @Modifying
    @Query("delete from RefreshToken t where t.expiresAt < :at")
    void deleteExpiredBefore(Instant at);
}
