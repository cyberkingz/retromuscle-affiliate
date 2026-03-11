-- Security Hardening Migration (Audit V4 fixes)
-- Fixes: C-01 (audit log INSERT policy), H-08 (overly broad anon grants)

-- ============================================================================
-- C-01: Remove the dangerous INSERT policy on admin_audit_log.
-- Any authenticated user could insert fake audit entries.
-- The app uses service_role for inserts, so this policy is unnecessary.
-- ============================================================================

drop policy if exists "Authenticated users can insert audit logs" on public.admin_audit_log;

-- ============================================================================
-- H-08: Revoke unnecessary privileges from the `anon` role.
-- With RLS enabled these are blocked, but if RLS is accidentally disabled
-- during a migration, anon could TRUNCATE/DELETE production data.
-- ============================================================================

revoke delete, insert, update, truncate on public.admin_audit_log from anon;
revoke delete, insert, update, truncate on public.creator_contract_signatures from anon;
revoke delete, insert, update, truncate on public.creator_payout_profiles from anon;
revoke delete, insert, update, truncate on public.creators from anon;
revoke delete, insert, update, truncate on public.monthly_tracking from anon;
revoke delete, insert, update, truncate on public.rushes from anon;
revoke delete, insert, update, truncate on public.video_rates from anon;
revoke delete, insert, update, truncate on public.videos from anon;
revoke delete, insert, update, truncate on public.package_definitions from anon;
revoke delete, insert, update, truncate on public.mix_definitions from anon;

-- Keep SELECT on reference tables (video_rates, package_definitions, mix_definitions)
-- for potential future public API usage.
-- Keep anon access on creator_applications and onboarding_drafts for sign-up flow.

-- ============================================================================
-- M-10: Prevent application status regression via RLS.
-- A user should not be able to revert a reviewed application to draft.
-- ============================================================================

drop policy if exists "Users can update own application" on public.creator_applications;
create policy "Users can update own draft application"
  on public.creator_applications
  for update
  to authenticated
  using (
    user_id = (select auth.uid())
    and status in ('draft', 'pending_review')
  )
  with check (
    user_id = (select auth.uid())
    and status in ('draft', 'pending_review')
  );

-- ============================================================================
-- M-11: Add initplan optimization to RLS policies.
-- Wrapping auth calls in (SELECT ...) enables plan caching.
-- ============================================================================

-- Fix payout profiles policies
drop policy if exists "Creators can view own payout profile" on public.creator_payout_profiles;
create policy "Creators can view own payout profile"
  on public.creator_payout_profiles
  for select
  to authenticated
  using (
    creator_id in (
      select id from public.creators where user_id = (select auth.uid())
    )
  );

drop policy if exists "Creators can upsert own payout profile" on public.creator_payout_profiles;
create policy "Creators can upsert own payout profile"
  on public.creator_payout_profiles
  for all
  to authenticated
  using (
    creator_id in (
      select id from public.creators where user_id = (select auth.uid())
    )
  )
  with check (
    creator_id in (
      select id from public.creators where user_id = (select auth.uid())
    )
  );

-- Fix onboarding drafts policies
drop policy if exists "Users can manage own onboarding draft" on public.onboarding_drafts;
create policy "Users can manage own onboarding draft"
  on public.onboarding_drafts
  for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Fix admin audit log read policy (use initplan)
drop policy if exists "Admins read audit log" on public.admin_audit_log;
create policy "Admins read audit log"
  on public.admin_audit_log
  for select
  to authenticated
  using (
    coalesce(
      (select current_setting('request.jwt.claims', true)::json -> 'app_metadata' ->> 'role'),
      ''
    ) = 'admin'
  );

-- ============================================================================
-- L-11: Drop redundant index (btree duplicates unique constraint index)
-- ============================================================================

drop index if exists idx_creators_user_id;

-- ============================================================================
-- L-12: Add functional index for case-insensitive email lookup
-- ============================================================================

create index if not exists idx_creators_email_lower on public.creators (lower(email));
