-- Per-creator Shopify discount code + order tracking
--
-- Replaces hardcoded CREATOR20 promo code with dynamic per-creator codes
-- generated via Shopify Admin API at contract signing. Orders placed with
-- a creator code are tracked via the orders/create webhook, which updates
-- kit_order_placed_at and shopify_kit_order_id on the creator row.

-- 1) Kit promo code tracking columns on creators
alter table public.creators
  add column if not exists kit_promo_code text,
  add column if not exists shopify_discount_id text,
  add column if not exists kit_order_placed_at timestamptz,
  add column if not exists shopify_kit_order_id text;

comment on column public.creators.kit_promo_code is
  'Per-creator Shopify discount code (format RETRO-HANDLE). NULL until generated at contract signing.';
comment on column public.creators.shopify_discount_id is
  'Shopify DiscountCodeNode gid (gid://shopify/DiscountCodeNode/...) returned by discountCodeBasicCreate. Used for delete/revoke.';
comment on column public.creators.kit_order_placed_at is
  'Timestamp the creator placed their kit order. Populated by orders/create webhook.';
comment on column public.creators.shopify_kit_order_id is
  'Shopify Order gid (gid://shopify/Order/...) of the kit order. Used for idempotency + audit.';

-- 2) Unique index on kit_promo_code (case-insensitive match at webhook lookup)
--    NULL values are excluded so pre-generation creators don't collide.
create unique index if not exists idx_creators_kit_promo_code_unique
  on public.creators (upper(kit_promo_code))
  where kit_promo_code is not null;

create index if not exists idx_creators_shopify_kit_order_id
  on public.creators (shopify_kit_order_id)
  where shopify_kit_order_id is not null;

-- 3) Webhook dedupe table
--    webhook_id is Shopify's X-Shopify-Webhook-Id header, unique per delivery.
--    PRIMARY KEY provides atomic dedupe guarantee: first INSERT wins, retries no-op.
create table if not exists public.shopify_webhook_events (
  webhook_id    text primary key,
  topic         text not null,
  shop_domain   text,
  received_at   timestamptz not null default now(),
  processed_at  timestamptz,
  creator_id    uuid references public.creators(id) on delete set null
);

comment on table public.shopify_webhook_events is
  'Shopify webhook delivery dedupe + audit log. PK enforces idempotency on X-Shopify-Webhook-Id.';

create index if not exists idx_shopify_webhook_events_topic_received
  on public.shopify_webhook_events (topic, received_at desc);

create index if not exists idx_shopify_webhook_events_creator
  on public.shopify_webhook_events (creator_id)
  where creator_id is not null;

-- 4) RLS: admin-only read. Webhook handler uses service role (bypasses RLS).
alter table public.shopify_webhook_events enable row level security;

drop policy if exists "Admins read shopify webhook events"
  on public.shopify_webhook_events;

create policy "Admins read shopify webhook events"
  on public.shopify_webhook_events
  for select
  to authenticated
  using (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin');

drop policy if exists "Admins write shopify webhook events"
  on public.shopify_webhook_events;

create policy "Admins write shopify webhook events"
  on public.shopify_webhook_events
  for all
  to authenticated
  using (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin')
  with check (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin');

-- Creators keep read-access on their own row via existing creators RLS policies.
-- No column-level policy change needed: kit_promo_code / kit_order_placed_at
-- are on creators, covered by the existing "creator reads own row" policy.
