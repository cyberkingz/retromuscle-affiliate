-- RetroMuscle UGC platform schema
-- Safe to run on an existing project; creates a dedicated set of tables.

create extension if not exists pgcrypto;

create table if not exists public.package_definitions (
  tier integer primary key check (tier in (10, 20, 30, 40)),
  quota_videos integer not null check (quota_videos > 0),
  monthly_credits numeric(10, 2) not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.mix_definitions (
  name text primary key check (name in ('VOLUME', 'EQUILIBRE', 'PREMIUM_80S', 'TRANSFO_HEAVY')),
  distribution jsonb not null,
  positioning text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.video_rates (
  video_type text primary key check (video_type in ('OOTD', 'TRAINING', 'BEFORE_AFTER', 'SPORTS_80S', 'CINEMATIC')),
  rate_per_video numeric(10, 2) not null check (rate_per_video >= 0),
  is_placeholder boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.creators (
  id uuid primary key default gen_random_uuid(),
  handle text not null unique,
  display_name text not null,
  email text not null unique,
  whatsapp text not null,
  country text not null,
  address text not null,
  followers integer not null default 0,
  social_links jsonb not null default '{}'::jsonb,
  package_tier integer not null references public.package_definitions (tier),
  default_mix text not null references public.mix_definitions (name),
  status text not null check (status in ('candidat', 'actif', 'pause', 'inactif')),
  start_date date not null,
  contract_signed_at timestamptz,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.monthly_tracking (
  id uuid primary key default gen_random_uuid(),
  month text not null check (month ~ '^[0-9]{4}-[0-9]{2}$'),
  creator_id uuid not null references public.creators (id) on delete cascade,
  package_tier integer not null references public.package_definitions (tier),
  quota_total integer not null check (quota_total > 0),
  mix_name text not null references public.mix_definitions (name),
  quotas jsonb not null,
  delivered jsonb not null,
  deadline date not null,
  payment_status text not null check (payment_status in ('a_faire', 'en_cours', 'paye')),
  paid_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (month, creator_id)
);

create index if not exists idx_monthly_tracking_month on public.monthly_tracking (month);
create index if not exists idx_monthly_tracking_creator_id on public.monthly_tracking (creator_id);

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  monthly_tracking_id uuid not null references public.monthly_tracking (id) on delete cascade,
  creator_id uuid not null references public.creators (id) on delete cascade,
  video_type text not null check (video_type in ('OOTD', 'TRAINING', 'BEFORE_AFTER', 'SPORTS_80S', 'CINEMATIC')),
  file_url text not null,
  duration_seconds integer not null check (duration_seconds > 0),
  resolution text not null check (resolution in ('1080x1920', '1080x1080')),
  file_size_mb integer not null check (file_size_mb > 0),
  status text not null check (status in ('uploaded', 'pending_review', 'approved', 'rejected')),
  rejection_reason text,
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_videos_status on public.videos (status);
create index if not exists idx_videos_tracking_id on public.videos (monthly_tracking_id);

create table if not exists public.rushes (
  id uuid primary key default gen_random_uuid(),
  monthly_tracking_id uuid not null references public.monthly_tracking (id) on delete cascade,
  creator_id uuid not null references public.creators (id) on delete cascade,
  file_name text not null,
  file_size_mb integer not null check (file_size_mb > 0),
  file_url text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_rushes_tracking_id on public.rushes (monthly_tracking_id);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_package_definitions_updated_at on public.package_definitions;
create trigger trg_package_definitions_updated_at
before update on public.package_definitions
for each row
execute function public.touch_updated_at();

drop trigger if exists trg_mix_definitions_updated_at on public.mix_definitions;
create trigger trg_mix_definitions_updated_at
before update on public.mix_definitions
for each row
execute function public.touch_updated_at();

drop trigger if exists trg_video_rates_updated_at on public.video_rates;
create trigger trg_video_rates_updated_at
before update on public.video_rates
for each row
execute function public.touch_updated_at();

drop trigger if exists trg_creators_updated_at on public.creators;
create trigger trg_creators_updated_at
before update on public.creators
for each row
execute function public.touch_updated_at();

drop trigger if exists trg_monthly_tracking_updated_at on public.monthly_tracking;
create trigger trg_monthly_tracking_updated_at
before update on public.monthly_tracking
for each row
execute function public.touch_updated_at();

alter table public.package_definitions enable row level security;
alter table public.mix_definitions enable row level security;
alter table public.video_rates enable row level security;
alter table public.creators enable row level security;
alter table public.monthly_tracking enable row level security;
alter table public.videos enable row level security;
alter table public.rushes enable row level security;
