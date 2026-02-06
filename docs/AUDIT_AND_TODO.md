# RetroMuscle Affiliate Platform — Audit + Master TODO

Date: 2026-02-06

This document is the single source of truth for the GAFA-grade loop:
Audit -> TODO -> Execute -> Audit again.

## 1) Executive Snapshot

### What’s already strong
- Clean layered architecture (`domain` -> `application` -> `features` -> `app`) with a repository seam.
- Role-based routing is now enforced (middleware + server guards + auth context).
- Creator application review + creator provisioning are implemented (admin approves -> creator row + monthly tracking).
- Storage buckets + upload/review pipeline for videos is implemented (private buckets + signed previews + admin review).

### Current risks (production)
- Auth cookie uses a JS-written access token (`rm_access_token`) and is not HttpOnly (XSS risk).
- Supabase dashboard security feature “Leaked Password Protection” is disabled (manual toggle).
- UX/design still needs a polishing pass across the whole app (padding consistency, tables, mobile conversion).

## 2) Product + UX Audit (Conversion)

### Funnel (desired)
Landing -> Apply (signup) -> Onboarding (profile) -> Contract -> Dashboard
Admin: Login -> Applications review -> Video review -> Payout ops

### Gaps / Opportunities
- Copy must stay “revenue + benefits” (not “SaaS / tool”). Some sections can still feel “feature list” vs “vision”.
- Key conversion pages need less “brick layout” and more narrative flow (AIDA + social proof + reassurance).
- Auth pages must be ultra-clear: signup = signup; login = login; no mixed CTAs in the form area.
- Mobile should feel iOS-like: generous rhythm, sticky primary actions when relevant, no cramped cards.

## 3) Frontend / Design System Audit

### What exists
- A consistent visual token set in `src/app/globals.css` (RetroMuscle palette).
- Core primitives: `Button`, `Card`, `Table`, `Input`, `Badge`, `StatusBadge`, `DataTableCard`.

### Issues to fix
- Inconsistent padding on some cards/pages (mixed `p-3`/`p-5`/custom wrappers).
- Hero typography + spacing still needs tightening across breakpoints.
- Tables are readable but can be upgraded (sticky header, responsive row layout, “empty state”, better density controls).

## 4) Backend / API / Auth Audit

### What exists
- Bearer-token protected admin endpoints.
- Creator dashboard endpoint verifies creator ownership unless admin.
- Redirect-target resolver used by middleware to enforce route access.

### Issues to fix
- Move away from JS-set access token cookie to a secure HttpOnly session approach.
- Add rate-limits + consistent error envelopes.
- Add tests for critical flows (auth, onboarding save, upload review).
- Supabase Auth incident: `/auth/v1/token` 500 "Database error querying schema" can happen when `auth.users.email_change` is NULL
  (observed for an admin created via `admin.createUser`). We also observed the same failure mode for other token columns like
  `confirmation_token`. Quick fix: set NULL token columns to `''` (empty string) for all rows. Long-term: enforce defaults + NOT NULL
  on these columns (requires owner / SQL editor).

## 5) Database / RLS / Storage Audit

### What exists
- RLS enabled on core tables.
- Policies for authenticated reads (admin or owner) and creator applications CRUD.
- Storage buckets for `videos` and `rushes` with private access patterns.

### Issues to fix
- Add missing write policies where needed (creator insert/update for their own assets).
- Add payout bookkeeping tables/fields for production ops.

## 6) Master TODO (80+ granular tasks)

Legend:
- P0 = production blocker
- P1 = must-have polish
- P2 = improvements

### P0 — Reliability, Auth, Security
- [x] Prefer anon JWT key over publishable key in browser Supabase client (fixes /auth/v1/token reliability).
- [x] Enforce `SUPABASE_SERVICE_ROLE_KEY` for server client (avoid using non-JWT `sb_secret_*`).
- [x] Fix Supabase linter `auth_rls_initplan` warnings for auth.jwt() policies (new migration).
- [ ] Replace `rm_access_token` JS cookie with HttpOnly cookie session (Supabase SSR approach).
- [ ] Add a strict CSP + security headers (at least `frame-ancestors`, `object-src`, `base-uri`).
- [ ] Add basic API rate limiting (admin + upload endpoints).
- [ ] Standardize API error envelope `{ code, message, details? }` everywhere.
- [ ] Ensure `/api/*` never leaks raw DB errors (audit all routes).
- [ ] Add a “session expired” UX (clear cookie + redirect + toast).
- [ ] Enable “Leaked Password Protection” in Supabase dashboard (manual).

### P0 — Admin/User Separation & Routing
- [ ] Add explicit “admin-only” layouts/nav for admin pages (no marketing links when admin).
- [ ] Add explicit “creator-only” nav for signed-in creators (dashboard shortcuts).
- [ ] Add server-side guards on page-level for admin/dashboard (defense in depth vs middleware).
- [ ] Add `not-authorized` UX page (403) and route it from guards.

### P0 — Conversion Pages (Landing / Apply / Login)
- [x] Reduce home hero typography + fix CTA wrap/spacing across breakpoints.
- [x] Reduce extra top spacing on homepage; increase spacing on auth pages for clearer layout.
- [ ] Rewrite landing copy with a strict AIDA structure (Attention/Interest/Desire/Action).
- [ ] Add “how you get paid” section with concrete cadence + example (no tech).
- [ ] Add “who this is for / not for” section (qualifies and improves conversion quality).
- [ ] Add stronger social proof: creator quotes + simple revenue outcomes + trusted-by strip.
- [ ] Add “risk reversal” block (human review, clear rules, monthly payouts).
- [ ] Apply page: ensure form is the primary focus; marketing content is secondary on mobile.
- [ ] Login page: ensure no signup CTA inside the form block; keep only below-form link.
- [ ] Add microcopy under password fields (format, privacy, no spam).
- [ ] Add loading states that don’t shift layout (skeletons).

### P1 — Onboarding (Multi-step) UX
- [ ] Tighten spacing from navbar on onboarding (consistent with auth pages).
- [ ] Improve stepper: better labels, mobile-friendly.
- [x] Validate URLs (portfolio/social) with safe `https://` only; show inline error.
- [ ] Add input masks where useful (WhatsApp / country).
- [x] Remove draft UX (no "save draft"; submit only on step 3).
- [ ] Add post-submit screen (“Merci, on revient sous 48h”) + status recap.

### P1 — Creator Dashboard (Value Delivery)
- [ ] Make quota tracking more visual (progress bars per video type).
- [ ] Add payout estimate summary (month-to-date + pending validation).
- [ ] Add upload guidelines card (formats, naming, examples).
- [ ] Add “recent activity” feed (uploads, approvals, rejections).
- [ ] Add “rejected” handling UX (reason + next steps + re-upload CTA).
- [ ] Add rushes upload UI + list + preview (end-to-end).

### P1 — Admin Ops (Scale)
- [ ] Admin “applications” table: sorting/filtering/status tabs.
- [ ] Admin application review: decision modal + required notes on rejection.
- [ ] Admin “validation queue” improvements: bulk actions, keyboard navigation.
- [ ] Add admin creator detail page (profile, uploads, tracking, notes).
- [ ] Add admin notes field with audit trail.

### P1 — Payouts / Accounting
- [ ] Define payout model (per month): status, totals, paid_at, paid_by, export snapshot.
- [ ] Add admin endpoint to “mark month paid” (idempotent).
- [ ] Add CSV export for payouts (creator, amount, IBAN/paypal placeholder).
- [ ] Add dashboard payout history for creators.

### P1 — Data Model / RLS Completeness
- [ ] Add creator write policies for `videos`/`rushes` inserts (own creator only).
- [ ] Add admin update policies for review fields (approved/rejected).
- [ ] Ensure storage policies match table policies (path prefix = auth.uid()).
- [ ] Add constraints: file_url max length, enums, non-negative credits.
- [ ] Add `updated_at` triggers consistently for all tables.

### P2 — Tables / Shadcn-like Components Polish
- [ ] Upgrade `Table` for sticky header option + zebra stripes variant.
- [ ] Add responsive “table -> cards” mode for mobile.
- [ ] Add empty states + loading skeleton for all tables.
- [ ] Centralize button usage; ban ad-hoc button classes (lint rule or review checklist).
- [ ] Add `Container` + `Section` wrappers to standardize paddings.

### P2 — Testing / CI / Observability
- [ ] Add Vitest + RTL; unit tests for `calculateQuotas`, `calculatePayout`.
- [ ] Add request-level tests for auth guards (admin vs creator).
- [ ] Add Playwright e2e skeleton (apply -> onboarding -> contract -> dashboard).
- [ ] Add GitHub Actions: lint/typecheck/build + unit tests.
- [ ] Add error tracking (Sentry) + structured logs.

### P2 — Performance / DX
- [ ] Reduce N+1 patterns in admin dashboard use-case (joins/views).
- [ ] Add caching where safe (reference data like rates/packages/mixes).
- [ ] Add `prettier` + consistent formatting rules.
- [ ] Add “env check” script to fail fast on missing server vars.

### P3 — SEO / Marketing Enhancements
- [ ] OpenGraph + Twitter cards (share preview).
- [ ] Add FAQ schema (JSON-LD) to landing.
- [ ] Add analytics (privacy-friendly) + conversion events.

## 7) Loop Checklist

When the P0 list is done:
1) Re-audit UI (desktop + iOS).
2) Re-audit backend security posture (auth, RLS, headers).
3) Generate a new TODO list (next 50 items) and repeat.
