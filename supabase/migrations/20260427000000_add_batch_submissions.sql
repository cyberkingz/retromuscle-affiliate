-- Batch submissions feature: allow creators to upload multiple raw clips
-- that count as ONE video in the payout/quota system.
--
-- Deploy order: deploy code to Vercel FIRST, then apply this migration.
-- The app code is fully backward-compatible — existing single-video rows
-- simply have batch_submission_id = NULL.

-- ─── New table: batch_submissions ────────────────────────────────────────────

create table public.batch_submissions (
  id                  uuid        primary key default gen_random_uuid(),
  monthly_tracking_id uuid        not null references public.monthly_tracking(id) on delete cascade,
  creator_id          uuid        not null references public.creators(id) on delete cascade,
  video_type          text        not null check (video_type in ('OOTD','TRAINING','BEFORE_AFTER','SPORTS_80S','CINEMATIC')),
  status              text        not null default 'pending_review'
                                  check (status in ('uploaded','pending_review','approved','rejected','revision_requested')),
  min_clips_required  integer     not null default 4 check (min_clips_required >= 1),
  rejection_reason    text,
  reviewed_at         timestamptz,
  reviewed_by         uuid,
  created_at          timestamptz not null default timezone('utc', now())
);

-- Indexes
create index idx_batch_submissions_pending
  on public.batch_submissions (created_at desc)
  where status = 'pending_review';

create index idx_batch_submissions_creator
  on public.batch_submissions (creator_id);

create index idx_batch_submissions_tracking
  on public.batch_submissions (monthly_tracking_id);

-- ─── Extend videos table ─────────────────────────────────────────────────────
-- Nullable FK — existing rows stay NULL (single-video mode), unaffected.

alter table public.videos
  add column batch_submission_id uuid references public.batch_submissions(id) on delete cascade;

create index idx_videos_batch_submission
  on public.videos (batch_submission_id)
  where batch_submission_id is not null;

-- ─── RLS ─────────────────────────────────────────────────────────────────────

alter table public.batch_submissions enable row level security;

-- Creators can read their own batch submissions
create policy "creators_select_own_batches"
  on public.batch_submissions
  for select
  using (
    creator_id in (
      select id from public.creators where user_id = auth.uid()
    )
  );

-- Admins have full access
create policy "admins_all_batches"
  on public.batch_submissions
  for all
  using (
    ((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin'
  );

-- ─── RPC: review_batch_and_update_tracking ───────────────────────────────────
-- IMPORTANT: uses a direct +1 increment (NOT a recount of videos rows).
-- Individual clips are stored with status = 'uploaded' — they must never be
-- counted as delivered units. Only the batch row approval increments the counter.

create or replace function public.review_batch_and_update_tracking(
  p_batch_id          uuid,
  p_status            text,
  p_rejection_reason  text    default null,
  p_reviewed_by       uuid    default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_batch    public.batch_submissions%rowtype;
  v_tracking public.monthly_tracking%rowtype;
  v_current  int;
begin
  if p_status not in ('approved', 'rejected', 'revision_requested') then
    raise exception 'Invalid status: %', p_status;
  end if;

  -- Update the batch row
  update public.batch_submissions
  set
    status           = p_status,
    rejection_reason = case when p_status <> 'approved' then p_rejection_reason else null end,
    reviewed_at      = now(),
    reviewed_by      = p_reviewed_by
  where id = p_batch_id
  returning * into v_batch;

  if not found then
    raise exception 'Batch submission not found: %', p_batch_id;
  end if;

  -- Only increment delivered count when approving
  if p_status = 'approved' then
    -- Read current count (default 0 if key missing)
    select coalesce((delivered ->> v_batch.video_type)::int, 0)
    into   v_current
    from   public.monthly_tracking
    where  id = v_batch.monthly_tracking_id;

    update public.monthly_tracking
    set delivered = jsonb_set(
      coalesce(delivered, '{}'::jsonb),
      array[v_batch.video_type],
      to_jsonb(v_current + 1)
    )
    where id = v_batch.monthly_tracking_id
    returning * into v_tracking;
  else
    select * into v_tracking
    from   public.monthly_tracking
    where  id = v_batch.monthly_tracking_id;
  end if;

  return json_build_object(
    'batch',    row_to_json(v_batch),
    'tracking', row_to_json(v_tracking)
  );
end;
$$;
