-- Creator payout profiles (IBAN / PayPal / Stripe placeholders).
-- Used by creators to receive monthly payouts. Keep access creator-scoped via RLS.

create table if not exists public.creator_payout_profiles (
  creator_id uuid primary key references public.creators (id) on delete cascade,
  method text not null default 'iban' check (method in ('iban', 'paypal', 'stripe')),
  account_holder_name text,
  iban text,
  paypal_email text,
  stripe_account text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_creator_payout_profiles_method
  on public.creator_payout_profiles (method);

drop trigger if exists trg_creator_payout_profiles_updated_at on public.creator_payout_profiles;
create trigger trg_creator_payout_profiles_updated_at
before update on public.creator_payout_profiles
for each row
execute function public.touch_updated_at();

alter table public.creator_payout_profiles enable row level security;

drop policy if exists "Payout profiles read own" on public.creator_payout_profiles;
create policy "Payout profiles read own"
  on public.creator_payout_profiles
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.creators c
      where c.id = creator_payout_profiles.creator_id
        and (
          c.user_id = auth.uid()
          or lower(c.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        )
    )
  );

drop policy if exists "Payout profiles insert own" on public.creator_payout_profiles;
create policy "Payout profiles insert own"
  on public.creator_payout_profiles
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.creators c
      where c.id = creator_payout_profiles.creator_id
        and (
          c.user_id = auth.uid()
          or lower(c.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        )
    )
  );

drop policy if exists "Payout profiles update own" on public.creator_payout_profiles;
create policy "Payout profiles update own"
  on public.creator_payout_profiles
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.creators c
      where c.id = creator_payout_profiles.creator_id
        and (
          c.user_id = auth.uid()
          or lower(c.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        )
    )
  )
  with check (
    exists (
      select 1
      from public.creators c
      where c.id = creator_payout_profiles.creator_id
        and (
          c.user_id = auth.uid()
          or lower(c.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        )
    )
  );

drop policy if exists "Admins read all payout profiles" on public.creator_payout_profiles;
create policy "Admins read all payout profiles"
  on public.creator_payout_profiles
  for select
  to authenticated
  using (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin');

