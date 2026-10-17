create table restaurants (
    id         uuid primary key,
    name       varchar(100) not null,
    owner_id   uuid         not null references users (id),
    created_at timestamptz  not null
);

create index restaurants_owner_id_idx on restaurants (owner_id);
