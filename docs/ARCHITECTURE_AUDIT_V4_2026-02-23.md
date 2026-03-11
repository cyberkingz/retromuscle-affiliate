# RetroMuscle Architecture Audit V4 -- Deep Documentation

**Audit Date:** 2026-02-23
**Auditors:** 10 specialized Claude Opus 4.6 agents (parallel deep analysis)
**Codebase:** `main` branch, clean working tree
**Scope:** Complete architecture -- every file, every layer, end-to-end

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Layer Grades](#2-layer-grades)
3. [All Findings by Severity](#3-all-findings-by-severity)
4. [Layer 1: Domain](#4-layer-1-domain)
5. [Layer 2: Infrastructure / Repository](#5-layer-2-infrastructure--repository)
6. [Layer 3: Application / Use-Cases](#6-layer-3-application--use-cases)
7. [Layer 4: API Routes](#7-layer-4-api-routes)
8. [Layer 5: Auth & Middleware](#8-layer-5-auth--middleware)
9. [Layer 6: Admin UI](#9-layer-6-admin-ui)
10. [Layer 7: Creator UI](#10-layer-7-creator-ui)
11. [Layer 8: Public Pages & Design System](#11-layer-8-public-pages--design-system)
12. [Layer 9: Database Schema](#12-layer-9-database-schema)
13. [Layer 10: Config, Tests & Dependencies](#13-layer-10-config-tests--dependencies)
14. [Prioritized Action Plan](#14-prioritized-action-plan)
15. [Architecture Diagrams](#15-architecture-diagrams)

---

## 1. Executive Summary

This is the deepest audit performed on the RetroMuscle codebase. Each of 10 agents read **every file** in their assigned layer, documenting method-by-method analysis, security findings, and architectural observations.

### Headline Numbers

| Metric | Value |
|--------|-------|
| **Total findings** | 52 |
| **CRITICAL** | 5 |
| **HIGH** | 8 |
| **MEDIUM** | 16 |
| **LOW** | 14 |
| **INFO** | 9 |
| **Lines of code** | ~15,000 (src/) |
| **Test coverage** | ~5% (5 test files, domain-only) |
| **TypeScript discipline** | Excellent (0 `any`, 0 `@ts-ignore`) |

### Progress Since V3 Audit

| Area | V3 Status | V4 Status |
|------|-----------|-----------|
| `user_metadata.role` fallback | CRITICAL | **FIXED** -- now uses `app_metadata.role` |
| API guards consistency | Mixed | **IMPROVED** -- all admin routes use `requireApiRole("admin")` |
| Admin config management | Missing | **BUILT** -- full CRUD for packages/rates/mixes |
| Payment guard | Missing | **BUILT** -- Stripe-like payment guard system |

### Top 5 Remaining Risks

1. **Service-role singleton** bypasses all RLS (single client for all requests)
2. **In-memory rate limiting** is useless in serverless (documented but unfixed)
3. **Audit log INSERT policy** open to any authenticated user
4. **No pagination** on any repository query (will fail at scale)
5. **Non-atomic video review** (tracking count update is separate from review)

---

## 2. Layer Grades

| # | Layer | Grade | Security | Quality | Notes |
|---|-------|-------|----------|---------|-------|
| 1 | Domain | **A** | N/A | Excellent | Clean, pure, well-tested. Minor inconsistencies. |
| 2 | Infrastructure | **C+** | Weak | Good patterns | Service-role singleton, no pagination, N+1 queries |
| 3 | Use-Cases | **B** | Needs work | Good | Missing use-cases for 6 routes, no input validation |
| 4 | API Routes | **B+** | Good | Consistent | Excellent guard pattern, rate-limit is decorative |
| 5 | Auth & Middleware | **B+** | Good | Clean | JWT not signature-verified (documented), refresh flow solid |
| 6 | Admin UI | **B+** | Good | Excellent | Consistent patterns, missing loading states on mutations |
| 7 | Creator UI | **B** | Good | Good | 16 observations, MIME inconsistency, no upload progress for rushes |
| 8 | Public Pages | **A-** | Good | Excellent | Beautiful design system, rich SEO, minor performance items |
| 9 | Database | **B** | Needs fixes | Good schema | Audit log RLS critical, anon grants too broad |
| 10 | Config/Tests | **B-** | Acceptable | Needs work | Low test coverage, ESLint EOL, dependency monitoring needed |

---

## 3. All Findings by Severity

### CRITICAL (5)

| ID | Layer | Finding | Impact | Fix Effort |
|----|-------|---------|--------|------------|
| C-01 | Database | `admin_audit_log` INSERT policy has `WITH CHECK (true)` for `authenticated` role | Any authenticated user can insert fake audit logs | 5 min |
| C-02 | Infrastructure | Service-role key singleton bypasses ALL RLS for every query | If app code has a bug, RLS cannot save you | 2-4 hours |
| C-03 | API Routes | In-memory rate limiting (`Map` on `globalThis`) resets on every cold start | Rate limiting is effectively disabled in production (Vercel serverless) | 2-4 hours (need external store) |
| C-04 | Use-Cases | `reviewVideoUpload` non-atomic: video review + tracking count update are separate operations | Race condition can cause incorrect delivered counts | 1 hour |
| C-05 | Auth | `ADMIN_EMAILS` env var is a secondary admin path without `app_metadata` | If attacker compromises account with admin email, they get admin access | 30 min |

### HIGH (8)

| ID | Layer | Finding | Impact | Fix Effort |
|----|-------|---------|--------|------------|
| H-01 | Use-Cases | 6 API routes bypass use-case/repository pattern entirely (incl. application submit, contract sign) | Business logic in route handlers, untestable, inconsistent | 4-6 hours |
| H-02 | Infrastructure | No row-level authorization in repository methods | Repository trusts caller to enforce ownership | 2 hours |
| H-03 | Infrastructure | `select("*")` on 24/25 methods -- fetches all columns always | Over-fetching, exposes sensitive data to upper layers | 2 hours |
| H-04 | Infrastructure | No pagination on ANY query (`listCreators`, `listVideosByStatus`, etc.) | Will cause timeouts/OOM at scale (100+ creators, 1000+ videos) | 3 hours |
| H-05 | Use-Cases | Zero input validation in use-cases (trusted caller assumption) | Garbage in, garbage stored. Validation only at API route layer | 3 hours |
| H-06 | Config | Test coverage at ~5% (5 files, domain-only). No integration, no API, no E2E tests | Regressions go undetected | 20+ hours |
| H-07 | API Routes | CSV export vulnerable to formula injection (PII fields not sanitized) | Excel macro execution via crafted creator names/emails | 30 min |
| H-08 | Database | `anon` role has TRUNCATE + DELETE on all 12 public tables | If RLS disabled accidentally, unauthenticated users could wipe tables | 15 min |

### MEDIUM (16)

| ID | Layer | Finding | Impact | Fix Effort |
|----|-------|---------|--------|------------|
| M-01 | Domain | `summarizeTracking` inconsistency: aggregate vs per-type remainder calculation | `remainingTotal` can be 0 while `remainingDetails` has positive values | 30 min |
| M-02 | Domain | French/English language mix in union type values (`candidat` vs `uploaded`) | Cognitive friction, serialization confusion | 1 hour |
| M-03 | Infrastructure | N+1 query in `getAdminDashboardData` (fetches payout profile per creator) | Slow dashboard load at scale | 1 hour |
| M-04 | Infrastructure | N+1 query in CSV export (same payout profile issue) | Slow export at scale | 1 hour |
| M-05 | Infrastructure | Audit logging is best-effort (errors swallowed) | Failed audit entries silently lost | 30 min |
| M-06 | Use-Cases | `getCreatorDashboardData` fetches ALL creators then filters with `creators[0]` | Leaks all creator data into memory, inefficient | 30 min |
| M-07 | Use-Cases | `markMonthlyTrackingPaid` has no idempotency guard | Double-marking as paid goes through without warning | 30 min |
| M-08 | Use-Cases | `saveCreatorPayoutProfile` has zero validation on IBAN/PayPal/Stripe fields | Invalid payment details stored without error | 30 min |
| M-09 | Auth | `onAuthStateChange` not used -- email verification callback may silently fail | Users who verify email via link might not get properly redirected | 2 hours |
| M-10 | Database | Creator application status regression via direct UPDATE (RLS allows any status) | User could revert rejected application to pending | 30 min |
| M-11 | Database | RLS policies missing `initplan` optimization (subquery wrapping) | Performance degradation at scale | 15 min |
| M-12 | Database | Storage policies lack `initplan` optimization | Same performance concern for storage operations | 15 min |
| M-13 | Creator UI | MIME type validation inconsistency between video and rush upload | `.mov` files accepted for videos but rejected for rushes (no extension fallback) | 15 min |
| M-14 | Creator UI | No upload progress indicator for rush files (uses raw `fetch()`) | Users uncertain during large file uploads (up to 2GB) | 1 hour |
| M-15 | Config | ESLint 8.57.1 reached EOL (Oct 2024), no further security patches | Linting tool unmaintained | 2 hours |
| M-16 | Admin UI | No loading states during API mutations (only "..." on buttons) | Users may double-click or navigate away during operations | 1 hour |

### LOW (14)

| ID | Layer | Finding | Impact | Fix Effort |
|----|-------|---------|--------|------------|
| L-01 | Domain | No input validation on `calculatePayout`/`calculateQuotas` (negative numbers allowed) | Pure functions accept garbage input | 30 min |
| L-02 | Domain | `PayoutBreakdownItem.key` typed as `string` not `VideoType` | Weaker type safety | 10 min |
| L-03 | Domain | `startDate`/`contractSignedAt` are `string` not validated as ISO dates | No domain-level date validation | 15 min |
| L-04 | Domain | Missing test case for mixed over/under-delivery in `summarizeTracking` | Edge case untested | 15 min |
| L-05 | Infrastructure | `InMemoryCreatorRepository` exists but is unused in any test | Dead code | 5 min |
| L-06 | Use-Cases | `resolveMonth` function counts by UTC months (timezone-naive) | Could assign wrong month for users near midnight | 15 min |
| L-07 | Creator UI | IBAN validation is format-only (no mod-97 checksum) | Invalid IBANs accepted as long as format matches | 30 min |
| L-08 | Creator UI | Contract sign endpoint sends hardcoded `true` values regardless of checkbox state | UI-level guard only, server should validate | 15 min |
| L-09 | Creator UI | Admin users without `?creator=` param on `/uploads` redirect to `/onboarding` | Unintended redirect for admin browsing | 15 min |
| L-10 | Creator UI | Draft auto-save fires every 1200ms with no exponential backoff on failure | Could flood server if backend is slow | 15 min |
| L-11 | Database | Redundant `idx_creators_user_id` index (btree duplicates unique index) | Wasted storage | 2 min |
| L-12 | Database | Missing `lower(email)` functional index on `creators` | Case-insensitive email lookup not optimized | 5 min |
| L-13 | Public Pages | Login page not set as `noindex` in metadata | Minor SEO concern | 2 min |
| L-14 | Config | `class-variance-authority` unmaintained (no release in 1+ year) | Maintenance risk, not security | Monitor |

### INFO (9)

| ID | Layer | Finding | Notes |
|----|-------|---------|-------|
| I-01 | Database | All tables grant full privileges to `anon` (Supabase default) | Defense-in-depth concern |
| I-02 | Database | No JSONB schema validation on `quotas`/`delivered` columns | Handled at app layer |
| I-03 | Database | CASCADE delete chain depth of 3 levels | Well-designed, GDPR appropriate |
| I-04 | Auth | `sameSite: "lax"` cookies allow GET navigations cross-origin | By design, combined with origin check on mutations |
| I-05 | Auth | Middleware is UX-only, not a security boundary | Correctly documented |
| I-06 | Public Pages | Duplicate component mounting for responsive layouts (desktop + mobile) | CSS show/hide, both DOMs exist |
| I-07 | Config | No `Cross-Origin-Opener-Policy` or `Cross-Origin-Embedder-Policy` headers | Would break third-party embeds if added |
| I-08 | API Routes | `Content-Length` header check before body read (spoofable but second check catches) | Belt-and-suspenders, good |
| I-09 | Use-Cases | No use-case calls another use-case (all independent) | Good architecture |

---

## 4. Layer 1: Domain

**Agent:** a95e263 | **Files:** 13 | **Chars analyzed:** 44,492

### Structure

```
src/domain/
  types.ts                          -- All types, interfaces, unions
  contracts/
    affiliate-program-contract.ts   -- Legal contract text + SHA-256 generation
  constants/
    packages.ts                     -- Package tier definitions (10/20/30/40)
    video-rates.ts                  -- Per-video-type EUR rates
    mixes.ts                        -- Distribution mix strategies
    labels.ts                       -- Human-readable labels (French)
    brand-assets.ts                 -- CDN URLs for brand imagery
  services/
    calculate-payout.ts             -- Payout = SUM(delivered * rate) + monthlyCredits
    calculate-payout.test.ts        -- 10 tests
    calculate-quotas.ts             -- Largest Remainder Method allocation
    calculate-quotas.test.ts        -- 10 tests
    tracking-summary.ts             -- Monthly tracking status summarization
    tracking-summary.test.ts        -- 8 tests
```

### Key Types

| Type | Values | Language |
|------|--------|----------|
| `VideoType` | `OOTD`, `TRAINING`, `BEFORE_AFTER`, `SPORTS_80S`, `CINEMATIC` | English |
| `MixName` | `VOLUME`, `EQUILIBRE`, `PREMIUM_80S`, `TRANSFO_HEAVY` | Mixed |
| `PackageTier` | `10`, `20`, `30`, `40` | N/A |
| `CreatorStatus` | `candidat`, `actif`, `pause`, `inactif` | **French** |
| `PaymentStatus` | `a_faire`, `en_cours`, `paye` | **French** |
| `VideoStatus` | `uploaded`, `pending_review`, `approved`, `rejected` | **English** |
| `ApplicationStatus` | `draft`, `pending_review`, `approved`, `rejected` | **English** |
| `PayoutMethod` | `iban`, `paypal`, `stripe` | English |

### Assessment

The domain layer is **exemplary DDD**: zero framework imports, pure TypeScript, all business logic in pure functions. The `calculatePayout` function correctly handles the formula: `SUM(delivered[type] * rate[type]) + monthlyCredits`. The `calculateQuotas` function implements the Largest Remainder Method for fair video distribution.

**Key bug (M-01):** `summarizeTracking` computes `remainingTotal` as `max(0, quotaTotal - deliveredTotal)` but computes `remainingDetails` per-type as `max(0, quotas[type] - delivered[type])`. When some types are over-delivered and others under-delivered, `remainingTotal` can be 0 while individual types still show remaining quotas.

---

## 5. Layer 2: Infrastructure / Repository

**Agent:** a2d942f | **Files:** 5 | **Chars analyzed:** 40,345

### Repository Interface (25 methods)

| Category | Methods | Notes |
|----------|---------|-------|
| Creators | 4 | `listCreators`, `getById`, `getByUserId`, `upsertFromApplication` |
| Monthly Tracking | 7 | CRUD + `markPaid`, `createMonthlyTracking` |
| Videos | 4 | `listByStatus`, `listByTracking`, `create`, `review` |
| Rushes | 2 | `listByTracking`, `create` |
| Config | 6 | `listRates`, `listPackages`, `listMixes`, `update*` (3) |
| Payout Profiles | 2 | `getByCreatorId`, `upsert` |
| Contract Signatures | 1 | `listByCreatorId` |
| Applications | 3 | `list`, `getByUserId`, `submitApplication` |

### Critical Issues

**C-02 (Service-Role Singleton):** `dependencies.ts` creates a single `SupabaseCreatorRepository` using the service-role key at module load time. Every query in the entire application bypasses RLS. This means:
- A bug in any use-case could expose data from other users
- There is zero defense-in-depth from the database
- The singleton pattern means all requests share the same client

**H-03 (`select("*")`):** 24 of 25 repository methods use `select("*")`, fetching all columns including sensitive data (IBAN, PayPal email, etc.) even when the caller only needs a subset.

**H-04 (No Pagination):** Every list method returns ALL rows. At scale:
- `listCreators()` -> all creators in memory
- `listVideosByStatus("pending_review")` -> all pending videos
- `listCreatorApplications()` -> all applications

### N+1 Patterns

1. **Admin Dashboard:** `getAdminDashboardData` calls `getPayoutProfileByCreatorId` in a loop for each creator
2. **CSV Export:** Same pattern in `getAdminPaymentsExportData`
3. **Both could be solved** with a single `listPayoutProfiles()` method + in-memory join

---

## 6. Layer 3: Application / Use-Cases

**Agent:** a56ead2 | **Files:** 22 | **Chars analyzed:** 40,880

### Use-Case Inventory (21 use-cases)

| # | Use-Case | Domain | Security Rating |
|---|----------|--------|-----------------|
| 1 | `getOnboardingPageData` | Public | SECURE |
| 2 | `getLandingPageData` | Public | SECURE |
| 3 | `getApplyPageData` | Public | SECURE |
| 4 | `getSaasLandingData` | Public | SECURE |
| 5 | `getCreatorSettingsData` | Creator | NEEDS_IMPROVEMENT |
| 6 | `getCreatorPayoutProfile` | Creator | SECURE |
| 7 | `saveCreatorPayoutProfile` | Creator | NEEDS_IMPROVEMENT |
| 8 | `getCreatorDashboardData` | Creator | NEEDS_IMPROVEMENT |
| 9 | `recordVideoUpload` | Creator | SECURE |
| 10 | `recordRushUpload` | Creator | SECURE |
| 11 | `getAdminApplicationsData` | Admin | SECURE |
| 12 | `reviewCreatorApplication` | Admin | SECURE (excellent atomicity) |
| 13 | `reviewVideoUpload` | Admin | NEEDS_IMPROVEMENT |
| 14 | `markMonthlyTrackingPaid` | Admin | NEEDS_IMPROVEMENT |
| 15 | `getAdminDashboardData` | Admin | SECURE (N+1 perf issue) |
| 16 | `getAdminCreatorDetailData` | Admin | SECURE |
| 17 | `getAdminPaymentsExportData` | Admin | SECURE |
| 18 | `getAdminConfigData` | Admin | SECURE |
| 19 | `updatePackageDefinition` | Admin | SECURE |
| 20 | `updateMixDefinition` | Admin | SECURE (excellent validation) |
| 21 | `updateVideoRate` | Admin | SECURE |

### Missing Use-Cases (H-01)

6 API routes bypass the use-case/repository pattern entirely:

| Route | Operation | Severity |
|-------|-----------|----------|
| `POST /api/applications/me` | Submit creator application | HIGH |
| `POST /api/contract/sign` | Sign affiliate contract (complex multi-step) | HIGH |
| `GET /api/applications/me` | Get own application | MEDIUM |
| `PUT /api/applications/draft` | Save onboarding draft | LOW |
| `GET /api/applications/draft` | Get onboarding draft | LOW |
| `DELETE /api/applications/draft` | Delete onboarding draft | LOW |

The contract signing route is the most concerning -- it performs creator lookup, SHA-256 checksumming, signature upsert with deduplication, creator update, and IP capture all within the route handler.

### Non-Atomic Video Review (C-04)

`reviewVideoUpload` does:
1. Fetch current tracking delivered counts
2. Update video status (approve/reject)
3. If approved, increment tracking delivered count
4. If rejected (was previously approved), decrement tracking delivered count

Steps 2 and 3 are **separate Supabase calls**. If step 3 fails, the video is approved but the count is wrong. No transaction wrapping.

---

## 7. Layer 4: API Routes

**Agent:** a05e533 | **Files:** 30 routes | **Chars analyzed:** 45,430

### Shared Infrastructure

| Component | File | Assessment |
|-----------|------|------------|
| `api-response.ts` | Response helpers + structured logging | Excellent |
| `rate-limit.ts` | In-memory Map rate limiter | **Decorative** (C-03) |
| `request-body.ts` | Payload size + JSON parsing | Good (dual check) |
| `origin.ts` | Same-origin CSRF defense | Good |
| `api-guards.ts` | `requireApiSession` + `requireApiRole` | Solid |

### Route Security Matrix

| Route | Method | Auth | Origin | Rate Limit | Use-Case |
|-------|--------|------|--------|------------|----------|
| `/api/auth/sign-in` | POST | None | Yes | 20/min | N/A |
| `/api/auth/sign-up` | POST | None | Yes | 5/min | N/A |
| `/api/auth/sign-out` | POST | Session | Yes | 10/min | N/A |
| `/api/auth/me` | GET | Session | No | 30/min | N/A |
| `/api/auth/redirect-target` | GET | Session | No | 30/min | N/A |
| `/api/auth/resend-verification` | POST | None | Yes | 3/min | N/A |
| `/api/applications/me` | POST/GET | Session | POST:Yes | 10/min | **MISSING** |
| `/api/applications/draft` | GET/PUT/DEL | Session | PUT:Yes | 30/min | **MISSING** |
| `/api/contract/sign` | POST | Session | Yes | 5/min | **MISSING** |
| `/api/creator/uploads/video/signed-url` | POST | Session | Yes | 20/min | Via use-case |
| `/api/creator/uploads/rush/signed-url` | POST | Session | Yes | 20/min | Via use-case |
| `/api/videos/preview` | GET | Session | No | 60/min | Infra |
| `/api/rushes/preview` | GET | Session | No | 60/min | Infra |
| `/api/admin/videos/review-batch` | POST | Admin | Yes | 10/min | Via use-case |
| `/api/admin/payments/mark-paid` | POST | Admin | Yes | 10/min | Via use-case |
| `/api/admin/payments/export` | GET | Admin | No | 5/min | Via use-case |
| `/api/admin/applications/review` | POST | Admin | Yes | 10/min | Via use-case |
| `/api/admin/config/packages` | PUT | Admin | Yes | 10/min | Via use-case |
| `/api/admin/config/rates` | PUT | Admin | Yes | 10/min | Via use-case |
| `/api/admin/config/mixes` | PUT | Admin | Yes | 10/min | Via use-case |
| `/api/creator/settings` | GET | Session | No | 30/min | Via use-case |
| `/api/creator/payout-profile` | GET/PUT | Session | PUT:Yes | 10/min | Via use-case |

### Assessment

Excellent consistency: every route follows the pattern `context -> origin check -> rate limit -> auth guard -> payload parse -> use-case -> audit log -> response`. The main weakness is that rate limiting is decorative (in-memory resets on cold start).

---

## 8. Layer 5: Auth & Middleware

**Agent:** ab5de65 | **Files:** 8 | **Chars analyzed:** 39,555

### Auth Architecture

```
Request -> Edge Middleware (JWT structure/exp/aud only, NO signature)
        -> Server Guards (Supabase getUser() = REAL verification)
        -> Session Resolution (app_metadata.role + ADMIN_EMAILS)
        -> Supabase Backend (service-role or anon client)
```

### Two Client Types

| Client | Key | RLS | Usage |
|--------|-----|-----|-------|
| `createSupabaseServerClient()` | `SERVICE_ROLE_KEY` | **BYPASSED** | Session resolution, admin ops, sign-out |
| `createSupabaseAnonServerClient()` | `ANON_KEY` | Respected | Sign-in, sign-up, session refresh |

### Cookie Configuration

| Cookie | httpOnly | sameSite | secure | maxAge |
|--------|----------|----------|--------|--------|
| `rm_access_token` | true | lax | prod-only | JWT exp (min 60s) |
| `rm_refresh_token` | true | lax | prod-only | 30 days |

### Middleware JWT Checks

Checks: structure (3 base64url parts), `exp` not expired, `aud` = "authenticated"
Does NOT check: signature, issuer, subject, iat, nbf, custom claims

**This is documented and intentional** -- Edge runtime lacks Node crypto. Server-side guards do real verification via `supabase.auth.getUser(token)`.

### Key Findings

**C-05 (ADMIN_EMAILS):** `resolve-auth-session.ts` line 68 checks `app_metadata.role === "admin"` OR email in `ADMIN_EMAILS` env var. This secondary path means if an attacker compromises an account with an admin email, they bypass the `app_metadata` check entirely.

**M-09 (No onAuthStateChange):** After `exchangeCodeForSession` in the email verification callback, the session lives in browser localStorage but there is no `onAuthStateChange` listener to sync it to httpOnly server cookies. The redirect to `/api/auth/redirect-target` requires cookies, creating a potential dead end.

**FIX VERIFIED:** `resolve-auth-session.ts` line 67 now reads `app_metadata.role` (not `user_metadata.role`). The v1 critical vulnerability is resolved.

---

## 9. Layer 6: Admin UI

**Agent:** ad8354d | **Files:** 25+ | **Chars analyzed:** 47,471

### Routes & Features

| Route | Feature | Components |
|-------|---------|------------|
| `/admin` | Operations Dashboard | MetricsStrip, ValidationQueue, PaymentsTable, CreatorsMasterTable, MonthlyTrackingTable |
| `/admin/applications` | Application Review | ApplicationsPage with approve/reject actions |
| `/admin/config` | Platform Config | PackagesTable, RatesTable, MixesTable (inline edit) |
| `/admin/creators/[id]` | Creator Detail | Full creator profile, tracking history, video list |

### Architecture Pattern (Consistent)

```
Route (RSC) -> protectPage("admin") -> Use-Case -> Repository -> Data
           -> Client Component -> API mutation -> Use-Case -> Repository
```

### Assessment

**Excellent consistency.** Every admin page follows the same pattern. Error boundaries, loading skeletons, and structured API calls are all present. The config management system (packages/rates/mixes) uses a clean `useConfigMutation` hook pattern for inline editing.

**Observations:**
- No optimistic updates (all mutations wait for server response)
- No full-page loading indicators during mutations (M-16)
- `router.refresh()` after success triggers full RSC re-render
- Bulk video review (approve/reject all) processes sequentially in a loop

---

## 10. Layer 7: Creator UI

**Agent:** a48ff5d | **Files:** 30+ | **Chars analyzed:** 45,525

### Routes & Features

| Route | Feature | Guard |
|-------|---------|-------|
| `/onboarding` | Multi-step application wizard | Session (any authenticated user) |
| `/contract` | Contract reading + digital signature | Session + approved application |
| `/dashboard` | Monthly tracking overview | Session + active creator |
| `/uploads` | Video + rush upload | Session + active creator |
| `/payouts` | Payout history + profile management | Session + active creator |
| `/settings` | Read-only profile display | Session + active creator |

### Onboarding Flow (3 steps)

1. **StepPersonalForm:** Name, email, WhatsApp, country, address
2. **StepPlanForm:** Package selection (10/20/30/40 videos) + mix strategy
3. **StepProfileForm:** Social links (TikTok, Instagram), followers count

Draft auto-saves every 1200ms (debounced). No exponential backoff on failure (L-10).

### Key Observations

1. **M-13 (MIME inconsistency):** Videos check `video/mp4` and `video/quicktime` with extension fallback. Rushes check `video/mp4` and `video/quicktime` without extension fallback. A `.mov` file with no MIME type is rejected for rushes but accepted for videos.

2. **M-14 (No rush upload progress):** Video uploads use `XMLHttpRequest` with `onprogress` for progress tracking. Rush uploads use raw `fetch()` with no progress indicator. Files can be up to 2GB.

3. **L-08 (Contract hardcoded values):** `signContract()` sends `{ terms: true, age18: true, rightsAndReleases: true }` regardless of checkbox state. The UI validates checkboxes, but someone bypassing the UI could submit without actually accepting.

4. **L-09 (Admin redirect bug):** Admin users accessing `/uploads` without `?creator=` param get `creatorId = undefined`, which triggers redirect to `/onboarding`.

---

## 11. Layer 8: Public Pages & Design System

**Agent:** ac253b5 | **Files:** 40+ | **Chars analyzed:** 48,884

### Design System

| Aspect | Implementation |
|--------|----------------|
| **Fonts** | Barlow Condensed (display) + Inter (body) via `next/font/google` |
| **Colors** | HSL CSS variables: magenta primary, purple accent, yellow highlights |
| **Components** | CVA (class-variance-authority) + Radix UI primitives |
| **Utility** | `cn()` = clsx + tailwind-merge |
| **Background** | Gradient orbs with blur + subtle grid texture |

### Component Library (17 base components)

| Component | Variants | Notes |
|-----------|----------|-------|
| `Button` | 6 variants x 5 sizes | Primary, secondary, outline, ghost, destructive, link |
| `Card` | 5 sub-components | Root, Header, Title, Content, Footer |
| `Badge` | 4 variants | Default, secondary, outline, destructive |
| `Input` | Base styling | Consistent border/focus treatment |
| `Dialog` | Radix-based | Portal + overlay + content |
| `ProgressBar` | Accessible | aria-valuenow/max/label |
| `DataTable` | TanStack-powered | Sorting, pagination, column visibility |
| `StatusBadge` | 3 tones | Success, warning, neutral |
| `SectionHeading` | Eyebrow pattern | Title + subtitle + optional eyebrow |

### SEO

- `createPageMetadata()` factory generates OpenGraph, Twitter, robots metadata
- JSON-LD `Organization` schema on root layout
- Robots.txt and sitemap.xml present
- `Barlow Condensed` display font with `swap` for CLS prevention

### Assessment

The design system is **production-quality**. Beautiful retro fitness aesthetic with consistent glass-morphism panels, gradient backgrounds, and responsive layouts. The CVA pattern ensures type-safe variant composition.

---

## 12. Layer 9: Database Schema

**Agent:** a1cccce | **Full report:** `docs/DATABASE_SCHEMA_AUDIT_V2.md` (1,158 lines)

### Schema Overview

| Metric | Value |
|--------|-------|
| **Tables** | 12 (public schema) |
| **Auth users** | 6 |
| **RLS policies** | 24+ |
| **Indexes** | 41 |
| **Migrations** | 16 |
| **Storage buckets** | 2 (videos, rushes) |
| **Extensions** | 6 (plpgsql, pgcrypto, pg_stat_statements, pg_graphql, supabase_vault, uuid-ossp) |

### Tables

| Table | Rows | RLS | FK Relationships |
|-------|------|-----|------------------|
| `creators` | 1 | Yes | -> auth.users (SET NULL) |
| `creator_applications` | 1 | Yes | -> auth.users (CASCADE) |
| `creator_contract_signatures` | 1 | Yes | -> creators (CASCADE), -> auth.users (CASCADE) |
| `creator_payout_profiles` | 1 | Yes | -> creators (CASCADE) |
| `monthly_tracking` | 2 | Yes | -> creators (CASCADE) |
| `videos` | 2 | Yes | -> monthly_tracking (CASCADE) |
| `rushes` | 0 | Yes | -> monthly_tracking (CASCADE) |
| `video_rates` | 5 | Yes | (reference data) |
| `package_definitions` | 4 | Yes | (reference data) |
| `mix_definitions` | 4 | Yes | (reference data) |
| `onboarding_drafts` | 0 | Yes | -> auth.users (CASCADE) |
| `admin_audit_log` | 50+ | Yes | (no FK, by design) |

### Critical: Audit Log RLS (C-01)

```sql
-- Current policy (DANGEROUS):
CREATE POLICY "Authenticated users can insert audit logs"
  ON admin_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (true);
```

Any authenticated user can insert fake audit log entries. Fix: restrict to service_role only (remove the policy, since the app uses service-role client for inserts anyway).

### Privilege Concern (H-08)

All 12 public tables grant full privileges (DELETE, INSERT, SELECT, UPDATE, TRUNCATE) to the `anon` role. While RLS protects against unauthorized access, if RLS were accidentally disabled during a migration, unauthenticated users could TRUNCATE production tables.

---

## 13. Layer 10: Config, Tests & Dependencies

**Agent:** ab35bb8 | **Files:** 15+ | **Chars analyzed:** 45,318

### Dependencies (14 production, 9 dev)

| Package | Version | Status |
|---------|---------|--------|
| `next` | `^15.5.12` | Patched against CVE-2025-29927, CVE-2025-66478 |
| `react` / `react-dom` | `^19.1.0` | Latest stable |
| `@supabase/supabase-js` | `^2.49.4` | Current |
| `@supabase/ssr` | `^0.6.1` | Current |
| `@tanstack/react-table` | `^8.21.3` | Current |
| `class-variance-authority` | `^0.7.1` | **Unmaintained** (1+ year no release) |
| `eslint` | `8.57.1` | **EOL** (Oct 2024) |

### Test Coverage

| File | Tests | Coverage Area |
|------|-------|---------------|
| `calculate-payout.test.ts` | 10 | Payout computation |
| `calculate-quotas.test.ts` | 10 | Quota allocation |
| `tracking-summary.test.ts` | 8 | Tracking summarization |
| `validation-utils.test.ts` | ~15 | Input validation helpers |
| `format-utils.test.ts` | ~10 | Formatting utilities |

**Total: ~53 tests, all domain/utility-level. Zero integration, API, or E2E tests.**

### Security Headers (next.config.mjs)

| Header | Value | Assessment |
|--------|-------|------------|
| `Strict-Transport-Security` | 2-year + preload (prod-only) | Excellent |
| `X-Frame-Options` | DENY | Good |
| `X-Content-Type-Options` | nosniff | Good |
| `Referrer-Policy` | strict-origin-when-cross-origin | Good |
| `Permissions-Policy` | camera=(), microphone=(), geolocation=() | Could add more |
| CSP (via middleware) | Nonce-based, strict | Excellent |

**Missing:** `Cross-Origin-Opener-Policy`, `Cross-Origin-Embedder-Policy`, `Cross-Origin-Resource-Policy`

### Scripts

| Script | Purpose | Notes |
|--------|---------|-------|
| `check` | lint + typecheck + test:unit | CI quality gate |
| `check:secrets` | Scan for leaked secrets/JWTs | Good practice |
| `smoke:flow` | 12-step API smoke test | Exists but not in CI |
| `audit:ui` | Playwright screenshot audit | Exists but not in CI |
| `seed:admin` | Create/update admin user | Useful for dev setup |

---

## 14. Prioritized Action Plan

### Immediate (< 1 day)

| Priority | ID | Action | Effort |
|----------|-----|--------|--------|
| 1 | C-01 | Drop `admin_audit_log` INSERT policy for `authenticated` | 5 min |
| 2 | H-08 | Revoke unnecessary `anon` grants on sensitive tables | 15 min |
| 3 | H-07 | Add CSV formula injection sanitization (`=`, `+`, `-`, `@`, `\t`, `\r` prefix) | 30 min |
| 4 | M-13 | Fix MIME validation inconsistency in rush upload (add extension fallback) | 15 min |
| 5 | L-11 | Drop redundant `idx_creators_user_id` index | 2 min |
| 6 | L-13 | Add `noindex` to login page metadata | 2 min |

### Short-term (1-3 days)

| Priority | ID | Action | Effort |
|----------|-----|--------|--------|
| 7 | C-04 | Wrap video review + tracking update in a Supabase RPC (transaction) | 1 hour |
| 8 | C-05 | Remove `ADMIN_EMAILS` env var fallback or make it supplementary to `app_metadata` | 30 min |
| 9 | M-01 | Fix `summarizeTracking` to compute `remainingTotal` as sum of per-type remainders | 30 min |
| 10 | M-06 | Change `getCreatorDashboardData` to use `getCreatorByUserId` instead of `listCreators` | 30 min |
| 11 | M-07 | Add idempotency guard to `markMonthlyTrackingPaid` | 30 min |
| 12 | M-08 | Add IBAN/PayPal/Stripe field validation in `saveCreatorPayoutProfile` | 30 min |
| 13 | M-10 | Add CHECK constraint or RLS policy to prevent application status regression | 30 min |
| 14 | M-11, M-12 | Add `initplan` optimization to RLS and storage policies | 30 min |

### Medium-term (1-2 weeks)

| Priority | ID | Action | Effort |
|----------|-----|--------|--------|
| 15 | C-02 | Replace service-role singleton with per-request anon client + RLS | 2-4 hours |
| 16 | C-03 | Replace in-memory rate limiter with Redis/Upstash KV | 2-4 hours |
| 17 | H-01 | Create use-cases for application submit, contract sign, draft CRUD | 4-6 hours |
| 18 | H-04 | Add pagination to all list methods in repository | 3 hours |
| 19 | H-03 | Replace `select("*")` with explicit column lists | 2 hours |
| 20 | M-03, M-04 | Fix N+1 queries (add `listPayoutProfiles()` method) | 1 hour |
| 21 | M-14 | Add upload progress for rush files (use XMLHttpRequest) | 1 hour |
| 22 | M-15 | Migrate ESLint to v9+ | 2 hours |

### Long-term (1+ month)

| Priority | ID | Action | Effort |
|----------|-----|--------|--------|
| 23 | H-06 | Build comprehensive test suite (API routes, integration, E2E) | 20+ hours |
| 24 | H-02 | Add row-level authorization to repository methods | 2 hours |
| 25 | M-09 | Implement `onAuthStateChange` for email verification callback | 2 hours |
| 26 | M-02 | Standardize French/English in union type values | 1 hour |

---

## 15. Architecture Diagrams

### Request Flow

```
Browser
  |
  v
Edge Middleware (CSP nonce, JWT structure check, session refresh)
  |
  v
Next.js Router
  |
  +-- RSC Page Route --> protectPage(role) --> Use-Case --> Repository --> Supabase
  |
  +-- API Route --> apiContext --> origin check --> rate limit --> requireApiRole
                       |
                       v
                   Use-Case --> Repository --> Supabase (service-role)
                       |
                       v
                   Audit Log (best-effort)
```

### Data Flow (Creator Video Upload)

```
Creator Browser
  |
  1. POST /api/creator/uploads/video/signed-url
  |    -> requireApiSession -> verify ownership -> Supabase Storage createSignedUploadUrl
  |    <- { signedUrl, token, path }
  |
  2. PUT <signedUrl> (direct to Supabase Storage)
  |    -> XHR with progress tracking
  |    <- 200 OK
  |
  3. POST /api/creator/uploads/video/signed-url (record upload)
  |    -> recordVideoUpload use-case -> createVideoAsset in repository
  |    <- { video: VideoAsset }
  |
  4. Admin reviews via /api/admin/videos/review-batch
  |    -> reviewVideoUpload use-case -> update video status + tracking count
```

### Database Entity Relationships

```
auth.users (6)
  |
  +--[1:1 SET NULL]--> creators (1)
  |                      |
  |                      +--[1:N CASCADE]--> monthly_tracking (2)
  |                      |                      |
  |                      |                      +--[1:N CASCADE]--> videos (2)
  |                      |                      +--[1:N CASCADE]--> rushes (0)
  |                      |
  |                      +--[1:N CASCADE]--> creator_contract_signatures (1)
  |                      +--[1:1 CASCADE]--> creator_payout_profiles (1)
  |
  +--[1:1 CASCADE]--> creator_applications (1)
  +--[1:1 CASCADE]--> onboarding_drafts (0)

Reference tables (no FK):
  video_rates (5), package_definitions (4), mix_definitions (4)

Standalone:
  admin_audit_log (50+, no FK by design)
```

---

## Appendix A: Essential Files Index

### Domain Layer
- `src/domain/types.ts` -- All types and interfaces
- `src/domain/services/calculate-payout.ts` -- Payout formula
- `src/domain/services/calculate-quotas.ts` -- Largest Remainder Method
- `src/domain/services/tracking-summary.ts` -- Monthly tracking summarization
- `src/domain/contracts/affiliate-program-contract.ts` -- Legal contract text
- `src/domain/constants/packages.ts` -- Package tiers (10/20/30/40)
- `src/domain/constants/video-rates.ts` -- Per-video EUR rates
- `src/domain/constants/mixes.ts` -- Distribution strategies

### Infrastructure
- `src/application/dependencies.ts` -- Composition root (service-role singleton)
- `src/application/repositories/creator-repository.ts` -- Interface (25 methods)
- `src/infrastructure/supabase/supabase-creator-repository.ts` -- Implementation (~1000 lines)
- `src/infrastructure/supabase/supabase-server-client.ts` -- Service-role client
- `src/infrastructure/supabase/supabase-anon-server-client.ts` -- Anon client

### Auth
- `src/middleware.ts` -- Edge middleware (CSP + JWT structure check)
- `src/features/auth/server/api-guards.ts` -- `requireApiSession`, `requireApiRole`
- `src/features/auth/server/resolve-auth-session.ts` -- Role resolution
- `src/features/auth/server/auth-cookies.ts` -- Cookie management
- `src/features/auth/server/route-guards.ts` -- `protectPage`

### API Routes
- `src/lib/api-response.ts` -- Response helpers + logging
- `src/lib/rate-limit.ts` -- In-memory rate limiter
- `src/lib/request-body.ts` -- Payload parsing
- `src/lib/origin.ts` -- Same-origin check

### Use-Cases
- `src/application/use-cases/` -- 21 use-case files
- `src/application/use-cases/shared.ts` -- `resolveMonth` utility

### UI (Admin)
- `src/features/admin-dashboard/` -- Dashboard components
- `src/features/admin-applications/` -- Application review
- `src/features/admin-config/` -- Package/rate/mix config
- `src/features/admin-creators/` -- Creator detail

### UI (Creator)
- `src/features/apply/` -- Onboarding wizard
- `src/features/creator-dashboard/` -- Creator dashboard
- `src/features/creator-uploads/` -- Video + rush upload
- `src/features/creator-payouts/` -- Payout history + profile
- `src/features/creator-settings/` -- Read-only settings

### UI (Public)
- `src/features/saas-landing/` -- Home page
- `src/features/landing/` -- Creators page
- `src/components/ui/` -- 17 base components (CVA + Radix)
- `src/components/layout/` -- Shell, header, footer, card sections

---

## Appendix B: Individual Agent Reports

Full agent outputs (375K+ chars total) are preserved in session subagent files:

| Agent | ID | Layer | Size |
|-------|-----|-------|------|
| Domain | a95e263 | `src/domain/` | 44K chars |
| Infrastructure | a2d942f | `src/infrastructure/` + `src/application/dependencies.ts` | 40K chars |
| Use-Cases | a56ead2 | `src/application/use-cases/` | 41K chars |
| API Routes | a05e533 | `src/app/api/` | 45K chars |
| Auth & Middleware | ab5de65 | Auth system + middleware | 40K chars |
| Admin UI | ad8354d | `src/features/admin-*` + `/admin` routes | 47K chars |
| Creator UI | a48ff5d | Creator features + routes | 46K chars |
| Public Pages | ac253b5 | Public pages + design system | 49K chars |
| Database | a1cccce | Live Supabase MCP inspection | See `docs/DATABASE_SCHEMA_AUDIT_V2.md` |
| Config/Tests | ab35bb8 | Config files + test suite + dependencies | 45K chars |

---

*Generated 2026-02-23 by 10 parallel Claude Opus 4.6 agents. Total analysis: ~375,000 characters of detailed documentation across every layer of the RetroMuscle codebase.*
