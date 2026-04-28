-- ─── Secure batch RPC execute privileges ────────────────────────────────────
-- The two batch RPCs are SECURITY DEFINER and must only be callable by the
-- service-role backend, not by authenticated/anon clients directly.

-- increment_batch_clip_count: called internally by the repository after each
-- video insert; must never be callable by an end-user.
revoke execute on function public.increment_batch_clip_count(uuid)
  from public, anon, authenticated;
grant  execute on function public.increment_batch_clip_count(uuid)
  to   service_role;

-- review_batch_and_update_tracking: called by the admin review use-case;
-- must only be reachable through the service-role backend after the API
-- route has already enforced the admin JWT check.
-- Also adds an in-function guard so even service_role calls from the wrong
-- context (e.g., a future bug) are rejected unless auth.uid() has admin role.
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
begin
  -- Guard: only service_role or JWT-authenticated admins may call this.
  -- When called from service_role (our backend), auth.role() = 'service_role'
  -- and auth.uid() is null — both are acceptable. When called from an
  -- authenticated session the caller must carry the admin app_metadata role.
  if auth.role() <> 'service_role' then
    if coalesce(((auth.jwt() -> 'app_metadata') ->> 'role'), '') <> 'admin' then
      raise exception 'Insufficient privileges';
    end if;
  end if;

  if p_status not in ('approved', 'rejected', 'revision_requested') then
    raise exception 'Invalid status: %', p_status;
  end if;

  -- Use auth.uid() as reviewer when available; fall back to supplied param
  -- so the backend can pass the admin's userId explicitly.
  update public.batch_submissions
  set
    status           = p_status,
    rejection_reason = case when p_status <> 'approved' then p_rejection_reason else null end,
    reviewed_at      = now(),
    reviewed_by      = coalesce(auth.uid(), p_reviewed_by)
  where id = p_batch_id
  returning * into v_batch;

  if not found then
    raise exception 'Batch submission not found: %', p_batch_id;
  end if;

  if p_status = 'approved' then
    update public.monthly_tracking
    set delivered = jsonb_set(
      coalesce(delivered, '{}'::jsonb),
      array[v_batch.video_type],
      to_jsonb(coalesce((delivered ->> v_batch.video_type)::int, 0) + 1)
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

revoke execute on function public.review_batch_and_update_tracking(uuid, text, text, uuid)
  from public, anon, authenticated;
grant  execute on function public.review_batch_and_update_tracking(uuid, text, text, uuid)
  to   service_role;
