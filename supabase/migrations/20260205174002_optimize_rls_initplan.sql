-- Optimize RLS policies to avoid re-evaluating auth.* functions per-row.
-- See: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- creator_applications policies
drop policy if exists "Creator applications read own" on public.creator_applications;
create policy "Creator applications read own"
  on public.creator_applications
  for select
  using ((select auth.uid()) = user_id);

drop policy if exists "Creator applications insert own" on public.creator_applications;
create policy "Creator applications insert own"
  on public.creator_applications
  for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "Creator applications update own" on public.creator_applications;
create policy "Creator applications update own"
  on public.creator_applications
  for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- creators read policy (admin OR owner)
drop policy if exists "Authenticated read creators" on public.creators;
create policy "Authenticated read creators"
  on public.creators
  for select
  to authenticated
  using (
    (select coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '')) = 'admin'
    or creators.user_id = (select auth.uid())
    or lower(creators.email) = lower((select coalesce(auth.jwt() ->> 'email', '')))
  );

-- monthly_tracking read policy (admin OR owner via creators mapping)
drop policy if exists "Authenticated read monthly tracking" on public.monthly_tracking;
create policy "Authenticated read monthly tracking"
  on public.monthly_tracking
  for select
  to authenticated
  using (
    (select coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '')) = 'admin'
    or exists (
      select 1
      from public.creators c
      where c.id = monthly_tracking.creator_id
        and (
          c.user_id = (select auth.uid())
          or lower(c.email) = lower((select coalesce(auth.jwt() ->> 'email', '')))
        )
    )
  );

-- videos read policy (admin OR owner via creators mapping)
drop policy if exists "Authenticated read videos" on public.videos;
create policy "Authenticated read videos"
  on public.videos
  for select
  to authenticated
  using (
    (select coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '')) = 'admin'
    or exists (
      select 1
      from public.creators c
      where c.id = videos.creator_id
        and (
          c.user_id = (select auth.uid())
          or lower(c.email) = lower((select coalesce(auth.jwt() ->> 'email', '')))
        )
    )
  );

-- rushes read policy (admin OR owner via creators mapping)
drop policy if exists "Authenticated read rushes" on public.rushes;
create policy "Authenticated read rushes"
  on public.rushes
  for select
  to authenticated
  using (
    (select coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '')) = 'admin'
    or exists (
      select 1
      from public.creators c
      where c.id = rushes.creator_id
        and (
          c.user_id = (select auth.uid())
          or lower(c.email) = lower((select coalesce(auth.jwt() ->> 'email', '')))
        )
    )
  );

