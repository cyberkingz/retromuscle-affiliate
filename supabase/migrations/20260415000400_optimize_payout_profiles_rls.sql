-- S1.3 — Optimise creator_payout_profiles RLS
-- Problems fixed:
-- 1. Initplan: each `exists (select 1 from creators...)` evaluated per row.
--    Replace with direct creator_id→user_id join keyed on auth.uid().
-- 2. Doublon SELECT: old policy matched user_id OR email — email fallback is
--    legacy. creators.user_id is now always set; use only uid check.
-- 3. Three separate per-operation policies replaced by one combined policy.

-- Drop legacy per-operation policies.
drop policy if exists "Payout profiles read own"   on public.creator_payout_profiles;
drop policy if exists "Payout profiles insert own" on public.creator_payout_profiles;
drop policy if exists "Payout profiles update own" on public.creator_payout_profiles;
-- Also drop the S1.1 generic policy that was written before this fix.
drop policy if exists "Creators upsert own payout profile" on public.creator_payout_profiles;

-- Single combined policy: creator can do everything on their own profile.
-- Uses creator_id PK → user_id FK lookup; auth.uid() is evaluated once per
-- statement (not per row) because it is a stable function.
create policy "Creator full access own payout profile"
  on public.creator_payout_profiles
  for all
  to authenticated
  using (
    creator_id IN (
      select id from public.creators where user_id = auth.uid()
    )
  )
  with check (
    creator_id IN (
      select id from public.creators where user_id = auth.uid()
    )
  );

-- Admins retain full read access (write goes through service-role in production).
drop policy if exists "Admins read all payout profiles" on public.creator_payout_profiles;
create policy "Admins read all payout profiles"
  on public.creator_payout_profiles
  for select
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
