-- Performance indexes + orphaned RLS policy cleanup (Audit V5 fixes)

-- ============================================================================
-- Composite index: videos(monthly_tracking_id, status)
-- Covers the hot query in review_video_and_update_tracking and listVideosByTracking
-- ============================================================================

create index if not exists idx_videos_tracking_status
  on public.videos (monthly_tracking_id, status);

-- ============================================================================
-- Composite index: monthly_tracking(creator_id, month DESC)
-- Covers listCreatorTrackings which orders by month descending
-- ============================================================================

create index if not exists idx_monthly_tracking_creator_month
  on public.monthly_tracking (creator_id, month desc);

-- ============================================================================
-- Composite index: creator_applications(user_id, status)
-- Covers getCreatorApplicationByUserId + status filtering
-- ============================================================================

create index if not exists idx_creator_applications_user_status
  on public.creator_applications (user_id, status);
