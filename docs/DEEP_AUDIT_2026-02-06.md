# Deep Audit — RetroMuscle Affiliate Platform

Date: 2026-02-06

This doc is a production-grade audit of the current system (frontend + backend + DB + ops), with concrete risks and next actions.

## 0) System Map (Current)

Primary funnel:
- Landing (`/`) -> Signup (`/apply`) -> Onboarding (`/onboarding`) -> Contract (`/contract`) -> Creator dashboard (`/dashboard`)

Admin funnel:
- Login (`/login`) -> Admin dashboard (`/admin`) -> Applications (`/admin/applications`) -> Review actions -> Creator provisioned + monthly tracking created

Key runtime pieces:
- Next.js 14 App Router (server pages for dashboards + client components for interactive flows)
- Supabase Auth (email+password), Storage (`videos` bucket), Postgres schema in `supabase/migrations`
- Access control uses:
  - `rm_access_token` + `rm_refresh_token` HttpOnly cookies (set server-side by `/api/auth/*`)
  - `src/middleware.ts` (Edge) refreshes session tokens when expiring and blocks protected routes
  - server guards in `src/features/auth/server/route-guards.ts`
  - API guards in `src/features/auth/server/api-guards.ts`

## 1) What’s Already “GAFA-grade”

Architecture and boundaries:
- Clean layering and props-first rendering: server routes call use-cases and pass data via props into feature pages (ex: `/admin`, `/dashboard`).
- Most interactive actions are isolated client-side and call dedicated API routes (review application/video, contract sign, video upload).

Security guard coverage:
- Admin API endpoints are guarded with `requireApiRole(request, "admin")`.
- Creator dashboard API validates ownership unless admin (`src/app/api/creator/[id]/dashboard/route.ts`).
- Edge middleware blocks direct navigation to protected pages without a valid auth session (`src/middleware.ts`).

Reliability improvements already present:
- Security headers are configured in `next.config.mjs` (CSP, HSTS in prod, XFO, etc).
- Rate limiting exists for sensitive endpoints (in-memory best-effort): `src/lib/rate-limit.ts`.

UX improvements already done:
- Onboarding no longer re-asks for email (email derived from Supabase session on server).
- Submit only appears on step 3; no “draft save” (conversion-first wizard actions).
- URL validation is inline + normalized (adds `https://` on blur where possible).

## 2) Production Blockers (P0)

P0-01 Auth token storage model (XSS surface)
- Status: DONE (cookie-based, HttpOnly)
- Today:
  - Auth uses HttpOnly cookies only (`rm_access_token`, `rm_refresh_token`) and no longer relies on a browser Supabase session.
  - Session refresh happens in `src/middleware.ts` and on API routes via `requireApiSession()`.
- Residual risk:
  - CSRF protections still matter for state-changing routes (SameSite=Lax reduces risk for top-level navigations, but we should still keep endpoints POST-only + origin checks where relevant).

P0-02 Missing automated test coverage for critical business rules
- No unit tests for domain services (quotas, payout) and no integration tests for auth + onboarding + uploads.
- Fix path:
  - Add Vitest + minimal unit tests for pure functions first (fast ROI).
  - Add 1 E2E smoke flow once auth storage is stabilized (now possible). A working API-level smoke exists at `scripts/smoke-flow.mjs`.

P0-03 Supabase Auth “Database error querying schema” recurrence risk
- Root cause observed: NULLs in `auth.users` token columns can break GoTrue `/token` login path.
- We applied a quick DB fix (set NULL token columns to empty string), but long-term needs a durable platform fix:
  - enforce defaults/NOT NULL where possible (requires owner privileges / Supabase SQL editor level access).

## 3) Backend + RBAC Audit

Server-side pages:
- `/admin` uses `protectPage("/admin")` and fetches admin data server-side.
- `/dashboard` uses `protectPage("/dashboard")` and resolves creator mapping unless admin.
- `/contract` uses `protectPage("/contract")`.

API routes:
- Admin endpoints use `requireApiRole("admin")` and include request id headers on responses.
- Creator upload endpoint requires `"affiliate"` and enforces storage path prefix = `{auth.userId}/...`.
- Contract sign endpoint requires `"affiliate"` and writes `contract_signed_at`.

Main gaps:
- Error envelopes are not 100% standardized across all API routes yet (some routes return `{ message }`, others may return other shapes).
- Rate limiting is in-memory only; in multi-instance prod it is not consistent (acceptable for MVP, not for hardening).

## 4) Data + DB Audit (High Level)

Tables in use:
- `creator_applications` (onboarding + admin review)
- `creators` (creator profile + mapping `user_id`)
- `monthly_tracking` (month quotas/delivered + payout status)
- `videos` (uploads + review)
- `rushes` (present in schema, not yet end-to-end in UI)
- `admin_audit_log` (audit trail for admin actions)

RLS:
- Enabled broadly. Most server operations run through service role (bypasses RLS), so app-layer auth correctness remains critical.

## 5) Frontend + UX Audit

Signup / login:
- Layout is conventional and conversion-friendly (form-first, marketing secondary).
- Mode switch is disabled inside the form; navigation link sits below the form block.

Onboarding:
- Redundancy removed (no email field).
- Inline validations are clearer (TikTok/Instagram/Portfolio).
- Flash messages moved above sticky actions to avoid “stuck under the bar”.

Landing:
- Hero typography reduced to avoid “shouting” on desktop.
- Remaining work is mostly copywriting (AIDA) + social proof quality + mobile table readability.

## 6) Next Execution Batch (20 tasks)

These are the next concrete items to execute (small, safe, high ROI), before big refactors:

1. Standardize API error envelope and codes across all routes.
2. Add “session expired” UX: clear cookie + redirect to `/login` with toast.
3. Add `403` UX page and route it from server guards.
4. Add inline focus management in onboarding (focus first invalid field).
5. Add “pending review” screen after onboarding submit (status recap + expectations).
6. Tighten creator mapping rules: remove email fallback when `creators.user_id` backfill is complete.
7. Make tables mobile-friendly (responsive stacked rows) for `/admin` and `/creators`.
8. Extract `UploadCard` upload logic into a hook (`useVideoUpload`) to reduce component complexity.
9. Add basic unit tests for `calculateQuotas`, `calculatePayout`, `summarizeTracking`.
10. Add a single E2E smoke flow (apply -> onboarding -> submit) once auth storage is stable.

## 7) References
- Master TODO: `docs/MASTER_TODO_98.md`
- Rolling audit loop: `docs/AUDIT_AND_TODO.md`
