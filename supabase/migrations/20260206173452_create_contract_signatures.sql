create table if not exists public.creator_contract_signatures (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creators(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  contract_version text not null,
  contract_checksum text not null,
  contract_text text not null,
  signer_name text not null,
  acceptance jsonb not null,
  ip inet,
  user_agent text,
  signed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create unique index if not exists creator_contract_signatures_user_checksum_unique
  on public.creator_contract_signatures (user_id, contract_checksum);

create index if not exists creator_contract_signatures_creator_id_idx
  on public.creator_contract_signatures (creator_id);

create index if not exists creator_contract_signatures_user_id_idx
  on public.creator_contract_signatures (user_id);

alter table public.creator_contract_signatures enable row level security;

drop policy if exists "Authenticated read contract signatures" on public.creator_contract_signatures;
create policy "Authenticated read contract signatures"
  on public.creator_contract_signatures
  for select
  to authenticated
  using (
    coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
    or creator_contract_signatures.user_id = (select auth.uid())
  );

drop policy if exists "Authenticated insert contract signatures" on public.creator_contract_signatures;
create policy "Authenticated insert contract signatures"
  on public.creator_contract_signatures
  for insert
  to authenticated
  with check (
    creator_contract_signatures.user_id = (select auth.uid())
  );

