create table users (
    id            uuid primary key,
    name          varchar(100) not null,
    email         varchar(254) not null,
    password_hash varchar(100) not null,
    role          varchar(10)  not null check (role in ('ADMIN', 'DONO')),
    demo          boolean      not null default false,
    created_at    timestamptz  not null,
    constraint users_email_key unique (email)
);
