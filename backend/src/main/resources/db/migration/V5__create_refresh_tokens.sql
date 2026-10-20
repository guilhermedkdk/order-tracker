-- Refresh tokens, kept only as a SHA-256 hash. Each sign-in starts a family; each renewal replaces the
-- token with the next one of the same family, and reusing a replaced token revokes the whole family.
create table refresh_tokens (
    id         uuid primary key,
    user_id    uuid        not null references users (id) on delete cascade,
    family_id  uuid        not null,
    token_hash varchar(64) not null,
    created_at timestamptz not null,
    expires_at timestamptz not null,
    rotated_at timestamptz,
    revoked_at timestamptz,
    constraint refresh_tokens_token_hash_key unique (token_hash)
);

create index refresh_tokens_family_id_idx on refresh_tokens (family_id);
create index refresh_tokens_expires_at_idx on refresh_tokens (expires_at);
