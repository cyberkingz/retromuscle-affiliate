-- Stores partial onboarding form data before the user submits their application.
-- Replaces localStorage-based draft persistence for cross-device / cross-session support.

create table if not exists public.onboarding_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  form_data jsonb not null default '{}'::jsonb,
  step integer not null default 0 check (step >= 0 and step <= 2),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists trg_onboarding_drafts_updated_at on public.onboarding_drafts;
create trigger trg_onboarding_drafts_updated_at
before update on public.onboarding_drafts
for each row
execute function public.touch_updated_at();

alter table public.onboarding_drafts enable row level security;

create policy "Onboarding drafts read own"
  on public.onboarding_drafts
  for select
  using (auth.uid() = user_id);

create policy "Onboarding drafts insert own"
  on public.onboarding_drafts
  for insert
  with check (auth.uid() = user_id);

create policy "Onboarding drafts update own"
  on public.onboarding_drafts
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Onboarding drafts delete own"
  on public.onboarding_drafts
  for delete
  using (auth.uid() = user_id);
