-- Atomic video review RPC (fixes C-04: non-atomic review + tracking update)
-- This function atomically:
--   1. Updates the video status
--   2. Recalculates delivered counts from all approved videos
--   3. Updates the monthly_tracking delivered JSONB

create or replace function public.review_video_and_update_tracking(
  p_video_id uuid,
  p_status text,
  p_rejection_reason text default null,
  p_reviewed_by uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_video record;
  v_tracking record;
  v_delivered jsonb;
begin
  -- Validate status
  if p_status not in ('approved', 'rejected') then
    raise exception 'Invalid status: %. Must be approved or rejected.', p_status;
  end if;

  -- Update the video
  update videos
  set
    status = p_status,
    rejection_reason = case when p_status = 'rejected' then p_rejection_reason else null end,
    reviewed_at = now(),
    reviewed_by = p_reviewed_by
  where id = p_video_id
  returning * into v_video;

  if not found then
    raise exception 'Video not found: %', p_video_id;
  end if;

  -- Recalculate delivered counts from ALL approved videos for this tracking
  select
    jsonb_build_object(
      'OOTD', coalesce(sum(case when video_type = 'OOTD' and status = 'approved' then 1 else 0 end), 0),
      'TRAINING', coalesce(sum(case when video_type = 'TRAINING' and status = 'approved' then 1 else 0 end), 0),
      'BEFORE_AFTER', coalesce(sum(case when video_type = 'BEFORE_AFTER' and status = 'approved' then 1 else 0 end), 0),
      'SPORTS_80S', coalesce(sum(case when video_type = 'SPORTS_80S' and status = 'approved' then 1 else 0 end), 0),
      'CINEMATIC', coalesce(sum(case when video_type = 'CINEMATIC' and status = 'approved' then 1 else 0 end), 0)
    )
  into v_delivered
  from videos
  where monthly_tracking_id = v_video.monthly_tracking_id;

  -- Atomically update the tracking delivered counts
  update monthly_tracking
  set delivered = v_delivered
  where id = v_video.monthly_tracking_id
  returning * into v_tracking;

  return jsonb_build_object(
    'video', row_to_json(v_video),
    'tracking', row_to_json(v_tracking)
  );
end;
$$;

-- Grant execute to service_role (used by application layer)
grant execute on function public.review_video_and_update_tracking(uuid, text, text, uuid) to service_role;
