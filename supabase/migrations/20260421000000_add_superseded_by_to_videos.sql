-- Migration: add superseded_by to videos for revision version chaining.
--
-- When a creator submits a corrected video, the ORIGINAL revision_requested
-- video gets superseded_by = new_video.id. The new video is created as
-- pending_review. The original stays revision_requested (historical/read-only).
--
-- Relationships:
--   old_video.superseded_by → new_video.id  ("I was replaced by this one")
--
-- ON DELETE SET NULL: if the replacement video is deleted, the original loses
-- its superseded_by pointer and becomes eligible for revision again.

ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS superseded_by uuid
    REFERENCES public.videos(id)
    ON DELETE SET NULL;

-- Prevent a video from pointing to itself
ALTER TABLE public.videos
  ADD CONSTRAINT IF NOT EXISTS videos_superseded_by_not_self
  CHECK (superseded_by IS NULL OR superseded_by <> id);

-- Index for: "find all videos that have been superseded" (admin queries, history joins)
CREATE INDEX IF NOT EXISTS idx_videos_superseded_by
  ON public.videos (superseded_by)
  WHERE superseded_by IS NOT NULL;
