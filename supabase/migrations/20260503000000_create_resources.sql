-- Resources feature: admin-managed guide library visible to active creators.
--
-- Storage: files live in the `assets` bucket under the `resources/` prefix.
-- The existing PDF must be moved operationally:
--   "COMMENT FILMER UNE VIDEO TRAINING.pdf"
--   -> "resources/comment-filmer-une-video-training.pdf"
-- Then insert a seed row pointing to the new path.

-- ─── Storage bucket ───────────────────────────────────────────────────────────
-- Create the assets bucket idempotently (it may already exist in production).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('assets', 'assets', false, 52428800, '{application/pdf}')
on conflict (id) do nothing;

-- ─── Table ───────────────────────────────────────────────────────────────────

create table public.resources (
  id               uuid        primary key default gen_random_uuid(),
  title            text        not null check (char_length(title) between 2 and 120),
  description      text        check (char_length(description) <= 500),
  content_type     text        not null
                               check (content_type in (
                                 'TRAINING', 'OOTD', 'UNBOXING', 'REVIEW', 'GENERAL'
                               )),
  file_key         text,
  file_name        text,
  file_size_bytes  bigint      check (file_size_bytes > 0),
  is_published     boolean     not null default false,
  sort_order       integer     not null default 0,
  created_at       timestamptz not null default timezone('utc', now()),
  updated_at       timestamptz not null default timezone('utc', now()),

  -- Cannot publish without a file attached
  constraint resources_published_requires_file check (
    is_published = false
    or (file_key is not null and file_name is not null and file_size_bytes is not null)
  )
);

create index idx_resources_sort_order   on public.resources (sort_order, created_at);
create index idx_resources_is_published on public.resources (is_published);

create trigger trg_resources_updated_at
  before update on public.resources
  for each row
  execute function public.touch_updated_at();

-- ─── RLS ─────────────────────────────────────────────────────────────────────

alter table public.resources enable row level security;

-- Admins have full CRUD access
create policy "Admins manage resources"
  on public.resources
  for all
  to authenticated
  using (
    coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
  )
  with check (
    coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
  );

-- Authenticated users can read published resources
-- (active-creator check is enforced at the application layer, not RLS,
--  because the service-role client bypasses RLS)
create policy "Authenticated read published resources"
  on public.resources
  for select
  to authenticated
  using (is_published = true);

-- Defense-in-depth: prevent anon writes
revoke delete, insert, update, truncate on public.resources from anon;

-- ─── Extend admin_audit_log entity_type constraint ────────────────────────────

alter table public.admin_audit_log
  drop constraint if exists admin_audit_log_entity_type_check;

alter table public.admin_audit_log
  add constraint admin_audit_log_entity_type_check
  check (entity_type in (
    'video_rate',
    'creator',
    'monthly_tracking',
    'creator_application',
    'video',
    'rush',
    'creator_payout_profile',
    'resource'
  ));

-- ─── Storage policies (assets bucket, resources/ prefix) ─────────────────────

-- Admins can upload resource files
drop policy if exists "Admins can upload resources" on storage.objects;
create policy "Admins can upload resources"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'assets'
    and starts_with(name, 'resources/')
    and coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
  );

-- Admins can delete resource files
drop policy if exists "Admins can delete resources" on storage.objects;
create policy "Admins can delete resources"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'assets'
    and starts_with(name, 'resources/')
    and coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
  );

-- Authenticated users can read resource files (download via signed URL)
drop policy if exists "Authenticated can read resources" on storage.objects;
create policy "Authenticated can read resources"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'assets'
    and starts_with(name, 'resources/')
  );
