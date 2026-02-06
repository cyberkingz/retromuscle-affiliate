-- Admin audit log for sensitive actions (approve/reject, payouts, config changes, etc.).

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  admin_user_id uuid not null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  request_id text,
  ip inet,
  user_agent text
);

create index if not exists idx_admin_audit_log_created_at on public.admin_audit_log (created_at desc);
create index if not exists idx_admin_audit_log_action on public.admin_audit_log (action);
create index if not exists idx_admin_audit_log_entity on public.admin_audit_log (entity_type, entity_id);

alter table public.admin_audit_log enable row level security;

-- Admins can read audit logs (server actions still use service role which bypasses RLS).
drop policy if exists "Admins read audit log" on public.admin_audit_log;
create policy "Admins read audit log"
  on public.admin_audit_log
  for select
  to authenticated
  using (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin');

