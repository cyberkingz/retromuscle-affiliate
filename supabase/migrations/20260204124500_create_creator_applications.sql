-- Creator applications submitted through the SaaS onboarding flow.

create table if not exists public.creator_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  status text not null default 'draft' check (status in ('draft', 'pending_review', 'approved', 'rejected')),
  handle text not null,
  full_name text not null,
  email text not null,
  whatsapp text not null,
  country text not null,
  address text not null,
  social_tiktok text,
  social_instagram text,
  followers integer not null default 0 check (followers >= 0),
  portfolio_url text,
  package_tier integer not null references public.package_definitions (tier),
  mix_name text not null references public.mix_definitions (name),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_creator_applications_status on public.creator_applications (status);
create index if not exists idx_creator_applications_submitted_at on public.creator_applications (submitted_at);

drop trigger if exists trg_creator_applications_updated_at on public.creator_applications;
create trigger trg_creator_applications_updated_at
before update on public.creator_applications
for each row
execute function public.touch_updated_at();

alter table public.creator_applications enable row level security;

drop policy if exists "Creator applications read own" on public.creator_applications;
create policy "Creator applications read own"
  on public.creator_applications
  for select
  using (auth.uid() = user_id);

drop policy if exists "Creator applications insert own" on public.creator_applications;
create policy "Creator applications insert own"
  on public.creator_applications
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Creator applications update own" on public.creator_applications;
create policy "Creator applications update own"
  on public.creator_applications
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
