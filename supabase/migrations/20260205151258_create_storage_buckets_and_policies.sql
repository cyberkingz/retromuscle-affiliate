-- Supabase Storage buckets + RLS policies for creator uploads. (20260205151258)
-- Folder convention:
--   videos/{auth.uid()}/...
--   rushes/{auth.uid()}/...

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('videos', 'videos', false, 600000000, array['video/mp4', 'video/quicktime']),
  ('rushes', 'rushes', false, 2000000000, array['video/mp4', 'video/quicktime'])
on conflict (id)
do update set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types,
  updated_at = now();

-- Admins: read everything in storage (review, moderation, export).
drop policy if exists "Admins can read all storage objects" on storage.objects;
create policy "Admins can read all storage objects"
on storage.objects
for select
to authenticated
using (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');

-- Videos bucket policies
drop policy if exists "Creators can upload own videos" on storage.objects;
create policy "Creators can upload own videos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'videos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Creators can read own videos" on storage.objects;
create policy "Creators can read own videos"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'videos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Creators can update own videos" on storage.objects;
create policy "Creators can update own videos"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'videos'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'videos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Creators can delete own videos" on storage.objects;
create policy "Creators can delete own videos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'videos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Rushes bucket policies
drop policy if exists "Creators can upload own rushes" on storage.objects;
create policy "Creators can upload own rushes"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'rushes'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Creators can read own rushes" on storage.objects;
create policy "Creators can read own rushes"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'rushes'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Creators can update own rushes" on storage.objects;
create policy "Creators can update own rushes"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'rushes'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'rushes'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Creators can delete own rushes" on storage.objects;
create policy "Creators can delete own rushes"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'rushes'
  and (storage.foldername(name))[1] = auth.uid()::text
);
