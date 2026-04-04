-- Simplify creator program data model:
-- - Pay per approved video type
-- - No package tiers / mixes / quotas
-- - Keep monthly tracking only for aggregation + payment status

-- ---------------------------------------------------------------------------
-- creators: split followers by platform and remove legacy package/mix columns
-- ---------------------------------------------------------------------------
alter table public.creators
  add column if not exists followers_tiktok integer not null default 0,
  add column if not exists followers_instagram integer not null default 0;

update public.creators
set
  followers_tiktok = coalesce(nullif(followers_tiktok, 0), followers, 0),
  followers_instagram = coalesce(followers_instagram, 0)
where true;

alter table public.creators
  drop column if exists followers cascade,
  drop column if exists package_tier cascade,
  drop column if exists default_mix cascade;

-- ---------------------------------------------------------------------------
-- creator_applications: split followers by platform and remove legacy fields
-- ---------------------------------------------------------------------------
alter table public.creator_applications
  add column if not exists followers_tiktok integer not null default 0 check (followers_tiktok >= 0),
  add column if not exists followers_instagram integer not null default 0 check (followers_instagram >= 0);

update public.creator_applications
set
  followers_tiktok = coalesce(nullif(followers_tiktok, 0), followers, 0),
  followers_instagram = coalesce(followers_instagram, 0)
where true;

alter table public.creator_applications
  drop column if exists followers cascade,
  drop column if exists portfolio_url cascade,
  drop column if exists package_tier cascade,
  drop column if exists mix_name cascade;

-- ---------------------------------------------------------------------------
-- monthly_tracking: keep only the fields required by pay-per-video workflow
-- ---------------------------------------------------------------------------
alter table public.monthly_tracking
  drop column if exists package_tier cascade,
  drop column if exists quota_total cascade,
  drop column if exists mix_name cascade,
  drop column if exists quotas cascade,
  drop column if exists deadline cascade;

-- Remove legacy indexes that targeted removed columns.
drop index if exists public.idx_creator_applications_package_tier;
drop index if exists public.idx_creator_applications_mix_name;
drop index if exists public.idx_creators_package_tier;
drop index if exists public.idx_monthly_tracking_package_tier;
drop index if exists public.idx_monthly_tracking_mix_name;

-- Onboarding is now a 2-step flow (0..1).
alter table public.onboarding_drafts
  drop constraint if exists onboarding_drafts_step_check;

alter table public.onboarding_drafts
  add constraint onboarding_drafts_step_check
  check (step >= 0 and step <= 1);
