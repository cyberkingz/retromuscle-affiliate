-- S1.5 + S1.6 — Missing DB constraints and index optimisations

-- ─── S1.5: Missing CHECK constraints ─────────────────────────────────────

-- admin_audit_log.entity_type: prevent arbitrary free-text from bypassing the
-- known set of entity types logged by the application.
alter table public.admin_audit_log
  add constraint admin_audit_log_entity_type_check
    check (entity_type in (
      'video_rate', 'creator', 'monthly_tracking',
      'creator_application', 'video', 'rush', 'creator_payout_profile'
    ));

-- creators: at least one of user_id or email must be present and non-empty
-- (user_id is required for all new rows; legacy rows have only email).
alter table public.creators
  add constraint creators_identity_required
    check (user_id is not null or (email is not null and email <> ''));

-- monthly_tracking.month: enforce YYYY-MM format.
alter table public.monthly_tracking
  add constraint monthly_tracking_month_format
    check (month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$');

-- monthly_tracking.delivered: must be a JSONB object (not null, not an array).
alter table public.monthly_tracking
  add constraint monthly_tracking_delivered_is_object
    check (jsonb_typeof(delivered) = 'object');

-- videos.file_size_mb: must be positive.
alter table public.videos
  add constraint videos_file_size_mb_positive
    check (file_size_mb > 0);

-- rushes.file_size_mb: must be positive.
alter table public.rushes
  add constraint rushes_file_size_mb_positive
    check (file_size_mb > 0);

-- ─── S1.6: Index optimisations ───────────────────────────────────────────

-- Drop redundant indexes that are superseded by the PK or by wider existing indexes.
-- idx_creator_payout_profiles_method is low-cardinality (2 values) and never
-- used as a range scan; a table-scan is cheaper.
drop index if exists public.idx_creator_payout_profiles_method;

-- Partial index on videos.status for the hot path: listing pending_review videos.
create index if not exists idx_videos_status_pending_review
  on public.videos (status, created_at desc)
  where status = 'pending_review';

-- Composite index for the creator-scoped tracking lookups.
create index if not exists idx_monthly_tracking_creator_month
  on public.monthly_tracking (creator_id, month desc);
