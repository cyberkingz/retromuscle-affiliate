-- Add 'revision_requested' to the videos.status CHECK constraint.
-- The status column is plain text (not a Postgres enum), so we only need to
-- drop + re-add the CHECK constraint — no data migration required.
--
-- Deploy order: push code to Vercel FIRST, then apply this migration.
-- If the migration runs before the app code is deployed, any row written with
-- 'revision_requested' will throw in the old toVideoStatus() guard.

alter table public.videos
  drop constraint if exists videos_status_check;

alter table public.videos
  add constraint videos_status_check
  check (status in ('uploaded', 'pending_review', 'approved', 'rejected', 'revision_requested'));

-- Replace the atomic review RPC to accept 'revision_requested'.
-- Only 'approved' increments delivered counts; 'rejected' and
-- 'revision_requested' both store the reason text and leave counts unchanged.
create or replace function public.review_video_and_update_tracking(
  p_video_id      uuid,
  p_status        text,
  p_rejection_reason text default null,
  p_reviewed_by   uuid default null
)
returns json
language plpgsql
security definer
as $$
declare
  v_video          public.videos%rowtype;
  v_delivered      jsonb;
  v_tracking       public.monthly_tracking%rowtype;
begin
  if p_status not in ('approved', 'rejected', 'revision_requested') then
    raise exception 'Invalid status: %', p_status;
  end if;

  -- Update the video row
  update public.videos
  set
    status           = p_status,
    rejection_reason = case when p_status <> 'approved' then p_rejection_reason else null end,
    reviewed_at      = now(),
    reviewed_by      = p_reviewed_by
  where id = p_video_id
  returning * into v_video;

  if not found then
    raise exception 'Video not found: %', p_video_id;
  end if;

  -- Recalculate delivered counts (approved videos only) for the tracking row
  select jsonb_object_agg(video_type, cnt)
  into   v_delivered
  from (
    select video_type, count(*) as cnt
    from   public.videos
    where  monthly_tracking_id = v_video.monthly_tracking_id
      and  status = 'approved'
    group  by video_type
  ) counts;

  -- Ensure all video types are present (fill missing types with 0)
  select jsonb_object_agg(
    vt,
    coalesce((v_delivered ->> vt)::int, 0)
  )
  into v_delivered
  from unnest(array['OOTD','TRAINING','BEFORE_AFTER','SPORTS_80S','CINEMATIC']) as vt;

  -- Update tracking
  update public.monthly_tracking
  set delivered = v_delivered
  where id = v_video.monthly_tracking_id
  returning * into v_tracking;

  return json_build_object(
    'video',    row_to_json(v_video),
    'tracking', row_to_json(v_tracking)
  );
end;
$$;

-- Partial index for the revision queue (mirrors the existing pending_review index)
create index if not exists idx_videos_status_revision_requested
  on public.videos (status, created_at desc)
  where status = 'revision_requested';
