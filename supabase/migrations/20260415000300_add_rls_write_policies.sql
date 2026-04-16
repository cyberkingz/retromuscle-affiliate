-- S1.1 — Add write RLS policies (INSERT / UPDATE / DELETE)
-- Previously only SELECT policies existed; write paths were protected only by
-- the service-role bypass. These policies add defense-in-depth so that even
-- if a client leaks an anon/authenticated key it cannot mutate rows.

-- ─── video_rates ──────────────────────────────────────────────────────────
-- Only admins may create, update, or delete rates.
drop policy if exists "Admins write video rates" on public.video_rates;
create policy "Admins write video rates"
  on public.video_rates
  for all
  to authenticated
  using (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin')
  with check (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin');

-- ─── creators ─────────────────────────────────────────────────────────────
-- Only admins may insert/update/delete creator rows.
drop policy if exists "Admins write creators" on public.creators;
create policy "Admins write creators"
  on public.creators
  for all
  to authenticated
  using (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin')
  with check (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin');

-- ─── monthly_tracking ─────────────────────────────────────────────────────
-- Only admins may write monthly tracking rows (created/updated by backend jobs).
drop policy if exists "Admins write monthly tracking" on public.monthly_tracking;
create policy "Admins write monthly tracking"
  on public.monthly_tracking
  for all
  to authenticated
  using (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin')
  with check (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin');

-- ─── videos ───────────────────────────────────────────────────────────────
-- Creators may insert their own videos.
drop policy if exists "Creators insert own videos" on public.videos;
create policy "Creators insert own videos"
  on public.videos
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.creators c
      where c.id = videos.creator_id
        and lower(c.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

-- Only admins may update (review) or delete videos.
drop policy if exists "Admins update videos" on public.videos;
create policy "Admins update videos"
  on public.videos
  for update
  to authenticated
  using (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin')
  with check (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin');

drop policy if exists "Admins delete videos" on public.videos;
create policy "Admins delete videos"
  on public.videos
  for delete
  to authenticated
  using (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin');

-- ─── rushes ───────────────────────────────────────────────────────────────
-- Creators may insert their own rushes.
drop policy if exists "Creators insert own rushes" on public.rushes;
create policy "Creators insert own rushes"
  on public.rushes
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.creators c
      where c.id = rushes.creator_id
        and lower(c.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

-- Only admins may delete rushes.
drop policy if exists "Admins delete rushes" on public.rushes;
create policy "Admins delete rushes"
  on public.rushes
  for delete
  to authenticated
  using (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin');

-- ─── creator_payout_profiles ──────────────────────────────────────────────
-- Creators may insert/update their own payout profile.
drop policy if exists "Creators upsert own payout profile" on public.creator_payout_profiles;
create policy "Creators upsert own payout profile"
  on public.creator_payout_profiles
  for all
  to authenticated
  using (
    exists (
      select 1 from public.creators c
      where c.id = creator_payout_profiles.creator_id
        and lower(c.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  )
  with check (
    exists (
      select 1 from public.creators c
      where c.id = creator_payout_profiles.creator_id
        and lower(c.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

-- ─── creator_applications ─────────────────────────────────────────────────
-- Creators may insert and update their own application (onboarding flow).
drop policy if exists "Creators write own application" on public.creator_applications;
create policy "Creators write own application"
  on public.creator_applications
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Admins may review all applications.
drop policy if exists "Admins write all applications" on public.creator_applications;
create policy "Admins write all applications"
  on public.creator_applications
  for update
  to authenticated
  using (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin')
  with check (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin');

-- ─── creator_contract_signatures ──────────────────────────────────────────
-- Creators may insert their own signature (sign once per version).
drop policy if exists "Creators insert own contract signature" on public.creator_contract_signatures;
create policy "Creators insert own contract signature"
  on public.creator_contract_signatures
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- ─── admin_audit_log ──────────────────────────────────────────────────────
-- Admins may insert audit entries; no one may update or delete them.
drop policy if exists "Admins insert audit log" on public.admin_audit_log;
create policy "Admins insert audit log"
  on public.admin_audit_log
  for insert
  to authenticated
  with check (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin');
