-- Core RLS policies for creator/admin read access.
-- Service role still bypasses RLS for backend/admin jobs.

-- Package definitions
drop policy if exists "Authenticated read package definitions" on public.package_definitions;
create policy "Authenticated read package definitions"
  on public.package_definitions
  for select
  to authenticated
  using (true);

-- Mix definitions
drop policy if exists "Authenticated read mix definitions" on public.mix_definitions;
create policy "Authenticated read mix definitions"
  on public.mix_definitions
  for select
  to authenticated
  using (true);

-- Video rates
drop policy if exists "Authenticated read video rates" on public.video_rates;
create policy "Authenticated read video rates"
  on public.video_rates
  for select
  to authenticated
  using (true);

-- Creators: creator can read own row, admin can read all.
drop policy if exists "Creators read own row" on public.creators;
create policy "Creators read own row"
  on public.creators
  for select
  to authenticated
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

drop policy if exists "Admins read all creators" on public.creators;
create policy "Admins read all creators"
  on public.creators
  for select
  to authenticated
  using (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin');

-- Monthly tracking: creator can read rows linked to own creator profile, admin can read all.
drop policy if exists "Creators read own monthly tracking" on public.monthly_tracking;
create policy "Creators read own monthly tracking"
  on public.monthly_tracking
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.creators c
      where c.id = monthly_tracking.creator_id
        and lower(c.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

drop policy if exists "Admins read all monthly tracking" on public.monthly_tracking;
create policy "Admins read all monthly tracking"
  on public.monthly_tracking
  for select
  to authenticated
  using (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin');

-- Videos: creator can read own videos, admin can read all.
drop policy if exists "Creators read own videos" on public.videos;
create policy "Creators read own videos"
  on public.videos
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.creators c
      where c.id = videos.creator_id
        and lower(c.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

drop policy if exists "Admins read all videos" on public.videos;
create policy "Admins read all videos"
  on public.videos
  for select
  to authenticated
  using (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin');

-- Rushes: creator can read own rushes, admin can read all.
drop policy if exists "Creators read own rushes" on public.rushes;
create policy "Creators read own rushes"
  on public.rushes
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.creators c
      where c.id = rushes.creator_id
        and lower(c.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

drop policy if exists "Admins read all rushes" on public.rushes;
create policy "Admins read all rushes"
  on public.rushes
  for select
  to authenticated
  using (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin');
