-- Deleting a restaurant removes its orders. Only "restaurar demonstração" deletes anything.
create table orders (
    id                   uuid primary key,
    restaurant_id        uuid          not null references restaurants (id) on delete cascade,
    customer_name        varchar(100)  not null,
    customer_phone       varchar(11)   not null,
    address_cep          varchar(8)    not null,
    address_street       varchar(150)  not null,
    address_number       varchar(20)   not null,
    address_complement   varchar(100),
    address_neighborhood varchar(100)  not null,
    address_city         varchar(100)  not null,
    address_state        varchar(2)    not null,
    delivery_fee         numeric(10, 2) not null,
    subtotal             numeric(10, 2) not null,
    total                numeric(10, 2) not null,
    payment_method       varchar(20)   not null
        check (payment_method in ('PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'DINHEIRO')),
    change_for           numeric(10, 2),
    notes                varchar(500),
    status               varchar(20)   not null
        check (status in ('RECEBIDO', 'EM_PREPARO', 'SAIU_PARA_ENTREGA', 'ENTREGUE', 'CANCELADO')),
    version              bigint        not null,
    created_at           timestamptz   not null
);

create index orders_restaurant_created_idx on orders (restaurant_id, created_at desc);

create table order_items (
    order_id   uuid           not null references orders (id) on delete cascade,
    position   integer        not null,
    name       varchar(100)   not null,
    quantity   integer        not null check (quantity between 1 and 999),
    unit_price numeric(10, 2) not null,
    primary key (order_id, position)
);

create table order_status_changes (
    order_id            uuid         not null references orders (id) on delete cascade,
    position            integer      not null,
    status              varchar(20)  not null,
    changed_at          timestamptz  not null,
    author_id           uuid         not null references users (id),
    author_name         varchar(100) not null,
    cancellation_reason varchar(30),
    cancellation_detail varchar(300),
    primary key (order_id, position)
);
