-- Add indexes for foreign keys (perf) + merge permissive SELECT policies (perf).

-- Foreign-key indexes
create index if not exists idx_creator_applications_package_tier
  on public.creator_applications (package_tier);

create index if not exists idx_creator_applications_mix_name
  on public.creator_applications (mix_name);

create index if not exists idx_creators_package_tier
  on public.creators (package_tier);

create index if not exists idx_creators_default_mix
  on public.creators (default_mix);

create index if not exists idx_monthly_tracking_package_tier
  on public.monthly_tracking (package_tier);

create index if not exists idx_monthly_tracking_mix_name
  on public.monthly_tracking (mix_name);

create index if not exists idx_videos_creator_id
  on public.videos (creator_id);

create index if not exists idx_rushes_creator_id
  on public.rushes (creator_id);

-- Merge read policies to avoid multiple permissive policies per table/action.
-- Note: service role bypasses RLS; these are for authenticated client reads only.

-- Creators
drop policy if exists "Creators read own row" on public.creators;
drop policy if exists "Admins read all creators" on public.creators;
drop policy if exists "Authenticated read creators" on public.creators;
create policy "Authenticated read creators"
  on public.creators
  for select
  to authenticated
  using (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
    or creators.user_id = auth.uid()
    or lower(creators.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

-- Monthly tracking
drop policy if exists "Creators read own monthly tracking" on public.monthly_tracking;
drop policy if exists "Admins read all monthly tracking" on public.monthly_tracking;
drop policy if exists "Authenticated read monthly tracking" on public.monthly_tracking;
create policy "Authenticated read monthly tracking"
  on public.monthly_tracking
  for select
  to authenticated
  using (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
    or exists (
      select 1
      from public.creators c
      where c.id = monthly_tracking.creator_id
        and (c.user_id = auth.uid() or lower(c.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
    )
  );

-- Videos
drop policy if exists "Creators read own videos" on public.videos;
drop policy if exists "Admins read all videos" on public.videos;
drop policy if exists "Authenticated read videos" on public.videos;
create policy "Authenticated read videos"
  on public.videos
  for select
  to authenticated
  using (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
    or exists (
      select 1
      from public.creators c
      where c.id = videos.creator_id
        and (c.user_id = auth.uid() or lower(c.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
    )
  );

-- Rushes
drop policy if exists "Creators read own rushes" on public.rushes;
drop policy if exists "Admins read all rushes" on public.rushes;
drop policy if exists "Authenticated read rushes" on public.rushes;
create policy "Authenticated read rushes"
  on public.rushes
  for select
  to authenticated
  using (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
    or exists (
      select 1
      from public.creators c
      where c.id = rushes.creator_id
        and (c.user_id = auth.uid() or lower(c.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
    )
  );

