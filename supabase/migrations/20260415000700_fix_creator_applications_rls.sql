-- ============================================================================
-- Security fix: H-03 — Conflicting FOR ALL policy on creator_applications
--
-- The "Creators write own application" FOR ALL policy added in migration
-- 20260415000300 creates a permissive policy covering SELECT, INSERT, UPDATE,
-- and DELETE. Because PostgreSQL ORs permissive policies together, it overrides
-- the status-restricted "Users can update own draft application" UPDATE policy,
-- meaning creators can modify their applications even after admin review.
--
-- Fix: replace the single FOR ALL policy with three focused per-operation
-- policies so the UPDATE restriction is actually enforced.
--
-- Security fix: M-12 — Remove re-added admin_audit_log INSERT RLS policy
--
-- Migration 20260223100000_security_hardening.sql explicitly dropped the
-- audit log INSERT policy (any authenticated user could insert fake entries).
-- Migration 20260415000300 re-added it under a new name "Admins insert audit
-- log". Even restricted to role=admin this is unnecessary — the application
-- always uses the service role key for audit log writes, so the policy only
-- adds attack surface without providing value.
-- ============================================================================

-- ─── creator_applications ────────────────────────────────────────────────────

-- Drop the FOR ALL policy that was bypassing the status restriction.
drop policy if exists "Creators write own application" on public.creator_applications;

-- DROP the existing UPDATE-only policy so we can recreate with initplan.
drop policy if exists "Users can update own draft application" on public.creator_applications;

-- INSERT: creators may open a new application at any time.
create policy "Creators insert own application"
  on public.creator_applications
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

-- UPDATE: creators may only update while the application is still open.
-- Approved or rejected applications are locked.
create policy "Creators update own draft application"
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

-- DELETE: creators may only delete their own application while still a draft.
create policy "Creators delete own draft application"
  on public.creator_applications
  for delete
  to authenticated
  using (
    user_id = (select auth.uid())
    and status = 'draft'
  );

-- ─── admin_audit_log ─────────────────────────────────────────────────────────

-- Remove the re-added INSERT policy. The app uses the service role key for
-- audit log inserts, so this policy is unnecessary and only adds attack surface.
-- This reinstates the intent of the 20260223100000_security_hardening.sql drop.
drop policy if exists "Admins insert audit log" on public.admin_audit_log;
