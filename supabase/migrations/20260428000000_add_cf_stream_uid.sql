-- Add Cloudflare Stream UID to videos for compressed preview delivery
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS cf_stream_uid text;
