-- ============================================================================
-- Sellora — core schema v1 (Phase 0 / M1.1)
-- Run this in the Supabase SQL editor (or via supabase db push).
-- Conventions: UUID PKs, created_at/updated_at everywhere, soft delete on
-- products, store_id on every seller-owned table, RLS on everything.
-- Money is stored as INTEGER rupees (no float rounding bugs).
-- ============================================================================

-- --------------------------------------------------------------------------
-- Platform tables
-- --------------------------------------------------------------------------
create table public.plans (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,                       -- free|starter|business|pro
  name text not null,
  price_monthly_pkr integer not null default 0,
  limits jsonb not null default '{}',              -- {"products":20,"staff":0,"ai_credits":0,"themes":1,"custom_domain":false} (-1 = unlimited)
  features jsonb not null default '[]',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- Stores
-- --------------------------------------------------------------------------
create table public.stores (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  slug text unique not null,                       -- <slug>.sellora.com (D3)
  logo_url text,
  brand_color text not null default '#065F46',
  status text not null default 'active',           -- active|suspended
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index stores_owner_idx on public.stores(owner_id);

create table public.store_settings (
  store_id uuid primary key references public.stores(id) on delete cascade,
  whatsapp_number text,
  currency text not null default 'PKR',
  timezone text not null default 'Asia/Karachi',
  -- payment instructions (D1: manual methods in MVP)
  cod_enabled boolean not null default true,
  bank_transfer_enabled boolean not null default false,
  bank_details text,
  raast_enabled boolean not null default false,
  raast_id text,
  easypaisa_enabled boolean not null default false,
  easypaisa_details text,
  jazzcash_enabled boolean not null default false,
  jazzcash_details text,
  -- shipping
  shipping_fee_flat integer not null default 0,    -- rupees
  free_shipping_threshold integer,                 -- rupees, null = disabled
  -- storefront content (D7: draft/publish — live columns vs draft_config)
  announcement_bar text,
  hero_title text,
  hero_subtitle text,
  hero_image_url text,
  theme_slug text not null default 'fashion',
  draft_config jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  plan_id uuid not null references public.plans(id),
  status text not null default 'trialing',         -- trialing|active|past_due|cancelled|expired
  trial_ends_at timestamptz,
  current_period_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index subscriptions_store_idx on public.subscriptions(store_id);

-- --------------------------------------------------------------------------
-- Catalog
-- --------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  slug text not null,
  image_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique(store_id, slug)
);
create index categories_store_idx on public.categories(store_id);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  title text not null,
  slug text not null,
  description text,
  regular_price integer not null,                  -- rupees
  sale_price integer,                              -- rupees, null = no sale
  cost_price integer,                              -- rupees, seller-only
  sku text,
  stock integer not null default 0,
  weight_grams integer,
  brand text,
  status text not null default 'active',           -- active|hidden|archived (D5 uses hidden)
  is_featured boolean not null default false,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,                          -- soft delete
  unique(store_id, slug)
);
create index products_store_idx on public.products(store_id);
create index products_store_status_idx on public.products(store_id, status)
  where deleted_at is null;

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,                     -- path in product-images bucket
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index product_images_product_idx on public.product_images(product_id);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,                             -- e.g. "XL / Black"
  options jsonb not null default '{}',            -- {"size":"XL","color":"Black"}
  price_override integer,                         -- rupees, null = use product price
  stock integer not null default 0,
  sku text,
  created_at timestamptz not null default now()
);
create index product_variants_product_idx on public.product_variants(product_id);

-- --------------------------------------------------------------------------
-- Customers & orders
-- --------------------------------------------------------------------------
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  phone text not null,
  email text,
  address text,
  city text,
  tags text[] not null default '{}',              -- VIP, COD Risk, ...
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index customers_store_idx on public.customers(store_id);
create index customers_phone_idx on public.customers(store_id, phone);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  order_number text not null,                     -- per-store human sequence, e.g. SLR-1001
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text not null,                    -- snapshot (customer may be deleted)
  customer_phone text not null,
  customer_email text,
  shipping_address text not null,                 -- snapshot
  shipping_city text not null,
  shipping_area text,
  subtotal integer not null,
  delivery_fee integer not null default 0,
  discount integer not null default 0,
  total integer not null,
  payment_method text not null,                   -- cod|bank_transfer|raast|easypaisa|jazzcash
  payment_status text not null default 'unpaid',   -- unpaid|paid|refunded
  payment_proof_url text,
  status text not null default 'pending',          -- pending|confirmed|packed|shipped|delivered|cancelled|returned|refunded (D6)
  tracking_number text,                            -- Phase 4 courier sync
  courier text,                                    -- e.g. 'tcs', 'leopards'
  notes text,
  source text not null default 'storefront',      -- storefront|whatsapp|instagram|phone|manual
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(store_id, order_number)
);
create index orders_store_idx on public.orders(store_id);
create index orders_store_status_idx on public.orders(store_id, status);
create index orders_created_idx on public.orders(store_id, created_at desc);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  title text not null,                            -- snapshot
  variant_name text,                              -- snapshot
  quantity integer not null,
  unit_price integer not null,                    -- snapshot, rupees
  created_at timestamptz not null default now()
);
create index order_items_order_idx on public.order_items(order_id);

create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by uuid references public.profiles(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);
create index order_status_history_order_idx on public.order_status_history(order_id);

-- Manual payment records (seller marks paid + proof; D1)
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  amount integer not null,
  method text not null,
  status text not null default 'pending',         -- pending|verified|rejected
  proof_url text,
  verified_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index payments_store_idx on public.payments(store_id);

-- --------------------------------------------------------------------------
-- Marketing
-- --------------------------------------------------------------------------
create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  code text not null,
  type text not null,                             -- percentage|fixed|free_shipping
  value integer not null default 0,               -- % or rupees; ignored for free_shipping
  min_order_value integer,                        -- rupees, null = none
  usage_limit integer,                            -- null = unlimited
  per_customer_limit integer not null default 1,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(store_id, code)
);
create index coupons_store_idx on public.coupons(store_id);

create table public.coupon_usage (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  customer_phone text,
  created_at timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- Ops
-- --------------------------------------------------------------------------
create table public.inventory_transactions (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  change integer not null,                        -- negative = decrement
  reason text not null,                           -- order_confirmed|order_cancelled|order_returned|manual_adjust|restock
  order_id uuid references public.orders(id) on delete set null,
  created_at timestamptz not null default now()
);
create index inventory_transactions_product_idx on public.inventory_transactions(product_id);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  type text not null,                             -- new_order|low_stock|payment|subscription_expiry|support_reply|new_customer
  title text not null,
  body text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_store_idx on public.notifications(store_id, created_at desc);

-- --------------------------------------------------------------------------
-- Helpers
-- NOTE: defined AFTER the tables — PostgreSQL validates table references
-- inside SQL-language functions at creation time, so these must come last.
-- --------------------------------------------------------------------------
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Is the current auth user the owner of this store?
create or replace function public.is_store_owner(sid uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.stores
    where id = sid and owner_id = auth.uid()
  );
$$;

-- Is the store public-facing? (active, not suspended)
create or replace function public.is_store_public(sid uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.stores
    where id = sid and status = 'active'
  );
$$;

-- updated_at triggers
do $$
declare t text;
begin
  foreach t in array array[
    'plans','profiles','stores','store_settings','subscriptions',
    'products','customers','orders','coupons'
  ] loop
    execute format(
      'create trigger trg_%I_updated_at before update on public.%I
       for each row execute function public.handle_updated_at()', t, t);
  end loop;
end $$;

-- --------------------------------------------------------------------------
-- Row Level Security
-- --------------------------------------------------------------------------
alter table public.plans                  enable row level security;
alter table public.profiles               enable row level security;
alter table public.stores                 enable row level security;
alter table public.store_settings         enable row level security;
alter table public.subscriptions          enable row level security;
alter table public.categories             enable row level security;
alter table public.products               enable row level security;
alter table public.product_images         enable row level security;
alter table public.product_variants       enable row level security;
alter table public.customers              enable row level security;
alter table public.orders                 enable row level security;
alter table public.order_items            enable row level security;
alter table public.order_status_history   enable row level security;
alter table public.payments               enable row level security;
alter table public.coupons                enable row level security;
alter table public.coupon_usage           enable row level security;
alter table public.inventory_transactions enable row level security;
alter table public.notifications          enable row level security;

-- plans: public read (active only)
create policy plans_public_read on public.plans
  for select using (is_active = true);

-- profiles: users manage only their own row
create policy profiles_owner_all on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- stores: owner = full access; public can read active stores (storefront)
create policy stores_owner_all on public.stores
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy stores_public_read on public.stores
  for select using (status = 'active');

-- store_settings: owner full; public read for active stores (checkout needs payment options)
create policy store_settings_owner_all on public.store_settings
  for all using (public.is_store_owner(store_id)) with check (public.is_store_owner(store_id));
create policy store_settings_public_read on public.store_settings
  for select using (public.is_store_public(store_id));

-- subscriptions: store owner read; writes go through server actions (owner check)
create policy subscriptions_owner_read on public.subscriptions
  for select using (public.is_store_owner(store_id));
create policy subscriptions_owner_write on public.subscriptions
  for all using (public.is_store_owner(store_id)) with check (public.is_store_owner(store_id));

-- categories: owner full; public read for active stores
create policy categories_owner_all on public.categories
  for all using (public.is_store_owner(store_id)) with check (public.is_store_owner(store_id));
create policy categories_public_read on public.categories
  for select using (public.is_store_public(store_id));

-- products: owner full; public reads only live products of active stores
create policy products_owner_all on public.products
  for all using (public.is_store_owner(store_id)) with check (public.is_store_owner(store_id));
create policy products_public_read on public.products
  for select using (
    status = 'active' and deleted_at is null
    and public.is_store_public(store_id)
  );

-- product_images / product_variants: owner full; public read iff the parent product is publicly visible
create policy product_images_owner_all on public.product_images
  for all using (
    exists (select 1 from public.products p where p.id = product_id and public.is_store_owner(p.store_id))
  ) with check (
    exists (select 1 from public.products p where p.id = product_id and public.is_store_owner(p.store_id))
  );
create policy product_images_public_read on public.product_images
  for select using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.status = 'active' and p.deleted_at is null
        and public.is_store_public(p.store_id)
    )
  );

create policy product_variants_owner_all on public.product_variants
  for all using (
    exists (select 1 from public.products p where p.id = product_id and public.is_store_owner(p.store_id))
  ) with check (
    exists (select 1 from public.products p where p.id = product_id and public.is_store_owner(p.store_id))
  );
create policy product_variants_public_read on public.product_variants
  for select using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.status = 'active' and p.deleted_at is null
        and public.is_store_public(p.store_id)
    )
  );

-- Everything below: store owner ONLY. No public access.
-- (Order tracking uses the service-role client server-side, rate-limited — never RLS bypass in the browser.)
create policy customers_owner_all on public.customers
  for all using (public.is_store_owner(store_id)) with check (public.is_store_owner(store_id));

create policy orders_owner_all on public.orders
  for all using (public.is_store_owner(store_id)) with check (public.is_store_owner(store_id));

create policy order_items_owner_all on public.order_items
  for all using (
    exists (select 1 from public.orders o where o.id = order_id and public.is_store_owner(o.store_id))
  ) with check (
    exists (select 1 from public.orders o where o.id = order_id and public.is_store_owner(o.store_id))
  );

create policy order_status_history_owner_all on public.order_status_history
  for all using (
    exists (select 1 from public.orders o where o.id = order_id and public.is_store_owner(o.store_id))
  ) with check (
    exists (select 1 from public.orders o where o.id = order_id and public.is_store_owner(o.store_id))
  );

create policy payments_owner_all on public.payments
  for all using (public.is_store_owner(store_id)) with check (public.is_store_owner(store_id));

create policy coupons_owner_all on public.coupons
  for all using (public.is_store_owner(store_id)) with check (public.is_store_owner(store_id));

create policy coupon_usage_owner_all on public.coupon_usage
  for all using (
    exists (select 1 from public.coupons c where c.id = coupon_id and public.is_store_owner(c.store_id))
  ) with check (
    exists (select 1 from public.coupons c where c.id = coupon_id and public.is_store_owner(c.store_id))
  );

create policy inventory_transactions_owner_all on public.inventory_transactions
  for all using (public.is_store_owner(store_id)) with check (public.is_store_owner(store_id));

create policy notifications_owner_all on public.notifications
  for all using (public.is_store_owner(store_id)) with check (public.is_store_owner(store_id));

-- --------------------------------------------------------------------------
-- Seed: subscription plans (PRD section 39)
-- --------------------------------------------------------------------------
insert into public.plans (slug, name, price_monthly_pkr, limits, features) values
  ('free', 'Free', 0,
   '{"products": 20, "staff": 0, "ai_credits": 0, "themes": 1, "custom_domain": false}',
   '["20 products", "Basic store", "Basic orders", "Basic analytics"]'),
  ('starter', 'Starter', 999,
   '{"products": 100, "staff": 0, "ai_credits": 20, "themes": 3, "custom_domain": false}',
   '["100 products", "Custom branding", "Coupons", "Basic analytics"]'),
  ('business', 'Business', 2499,
   '{"products": -1, "staff": 3, "ai_credits": 200, "themes": 6, "custom_domain": true}',
   '["Unlimited products", "Custom domain", "Advanced analytics", "WhatsApp tools", "AI tools", "Staff accounts", "Remove Sellora branding"]'),
  ('pro', 'Pro', 4999,
   '{"products": -1, "staff": 10, "ai_credits": 1000, "themes": 6, "custom_domain": true}',
   '["Everything in Business", "Automation", "Premium templates", "More staff accounts", "Priority support", "Advanced reports"]')
on conflict (slug) do nothing;
