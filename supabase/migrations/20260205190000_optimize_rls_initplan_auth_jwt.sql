-- Optimize RLS policies further by wrapping auth.jwt() calls with (select auth.jwt()).
-- This avoids per-row re-evaluation and clears Supabase linter warning `auth_rls_initplan`.
-- See: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- Creators
drop policy if exists "Authenticated read creators" on public.creators;
create policy "Authenticated read creators"
  on public.creators
  for select
  to authenticated
  using (
    coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
    or creators.user_id = (select auth.uid())
    or lower(creators.email) = lower(coalesce((select auth.jwt()) ->> 'email', ''))
  );

-- Monthly tracking
drop policy if exists "Authenticated read monthly tracking" on public.monthly_tracking;
create policy "Authenticated read monthly tracking"
  on public.monthly_tracking
  for select
  to authenticated
  using (
    coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
    or exists (
      select 1
      from public.creators c
      where c.id = monthly_tracking.creator_id
        and (
          c.user_id = (select auth.uid())
          or lower(c.email) = lower(coalesce((select auth.jwt()) ->> 'email', ''))
        )
    )
  );

-- Videos
drop policy if exists "Authenticated read videos" on public.videos;
create policy "Authenticated read videos"
  on public.videos
  for select
  to authenticated
  using (
    coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
    or exists (
      select 1
      from public.creators c
      where c.id = videos.creator_id
        and (
          c.user_id = (select auth.uid())
          or lower(c.email) = lower(coalesce((select auth.jwt()) ->> 'email', ''))
        )
    )
  );

-- Rushes
drop policy if exists "Authenticated read rushes" on public.rushes;
create policy "Authenticated read rushes"
  on public.rushes
  for select
  to authenticated
  using (
    coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
    or exists (
      select 1
      from public.creators c
      where c.id = rushes.creator_id
        and (
          c.user_id = (select auth.uid())
          or lower(c.email) = lower(coalesce((select auth.jwt()) ->> 'email', ''))
        )
    )
  );

