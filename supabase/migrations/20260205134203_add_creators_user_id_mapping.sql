-- Add auth user mapping to creators.

alter table public.creators
  add column if not exists user_id uuid unique references auth.users (id) on delete set null;

create index if not exists idx_creators_user_id on public.creators (user_id);

-- Update creator-scoped read policies to prefer auth.uid() mapping.

drop policy if exists "Creators read own row" on public.creators;
create policy "Creators read own row"
  on public.creators
  for select
  to authenticated
  using (
    creators.user_id = auth.uid()
    or lower(creators.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

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
        and (c.user_id = auth.uid() or lower(c.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
    )
  );

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
        and (c.user_id = auth.uid() or lower(c.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
    )
  );

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
        and (c.user_id = auth.uid() or lower(c.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
    )
  );

