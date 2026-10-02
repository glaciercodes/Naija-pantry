create table if not exists orders (id uuid primary key default gen_random_uuid(), user_id text not null, email text, customer_name text, phone text, address text, items jsonb not null, total int not null, created_at timestamptz default now());
create index if not exists orders_user_idx on orders(user_id);
alter table orders enable row level security;
