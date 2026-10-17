-- One row per phone in each restaurant, with the name and address of the newest order.
create table customers (
    id                   uuid primary key,
    restaurant_id        uuid         not null references restaurants (id) on delete cascade,
    phone                varchar(11)  not null,
    name                 varchar(100) not null,
    address_cep          varchar(8)   not null,
    address_street       varchar(150) not null,
    address_number       varchar(20)  not null,
    address_complement   varchar(100),
    address_neighborhood varchar(100) not null,
    address_city         varchar(100) not null,
    address_state        varchar(2)   not null,
    last_order_at        timestamptz  not null,
    constraint customers_restaurant_phone_key unique (restaurant_id, phone)
);
