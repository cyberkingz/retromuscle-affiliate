# RetroMuscle Webapp - Architecture Audit v3
**Date**: 2026-02-23
**Methodology**: 10 parallel audit agents, each specialized in one architectural layer
**Scope**: Complete codebase + live Supabase database

---

## Executive Summary

| Layer | Agent | Grade | Key Finding |
|-------|-------|-------|-------------|
| Domain | #1 | **B+** | Clean DDD, zero framework imports, minor validation gaps |
| Repository | #2 | **B+** | 23 methods, ~1010 LOC Supabase impl, service-role singleton concern |
| Use-Cases | #3 | **B** | 22 use-cases, 5 critical authorization gaps |
| API Routes | #4 | **A-** | 31 endpoints, strong guards, rate-limiting on all auth routes |
| Auth & Middleware | #5 | **B+** | JWT not signature-verified in Edge (acceptable), session refresh works |
| Admin UI | #6 | **A-** | 4 feature pages, clean RSC/client split |
| Creator UI | #7 | **A-** | 17 components, XHR upload with progress, good UX flows |
| Public Pages | #8 | **A** | Cohesive retro design system, strong SEO metadata, WCAG basics |
| Database Schema | #9 | **A-** | 12 tables, 41 indexes, RLS on all tables, 1 critical audit-log gap |
| Config/Tests/Deps | #10 | **B+** | Strict TS, strong security headers, 104 tests but ~4% coverage |

**Overall Grade: B+ (Strong architecture, security-aware, needs test coverage and authorization hardening)**

---

## 1. CRITICAL Issues (Fix Immediately)

### CRIT-1: Audit log INSERT open to all authenticated users
**Location**: `admin_audit_log` RLS policy
**Risk**: Any authenticated creator can insert fake audit entries
**Fix**: Change INSERT policy `WITH CHECK` from `true` to `(select auth.jwt()->>'role') = 'admin'` or remove the policy entirely (service role bypasses RLS anyway)

### CRIT-2: Missing admin authorization in several use-cases
**Location**: `src/application/use-cases/`
**Affected**:
- `review-video.ts` -- no admin role check before approve/reject
- `review-creator-application.ts` -- no admin role check
- `mark-monthly-tracking-paid.ts` -- no admin role check
- `update-package-definition.ts` -- no admin role check
- `update-mix-definition.ts` -- no admin role check
- `update-video-rate.ts` -- no admin role check

**Note**: API route-level guards (`requireApiRole("admin")`) protect these, but defense-in-depth requires use-case layer validation too. If a new API route or internal caller uses these without the guard, authorization is bypassed.

### CRIT-3: Non-atomic video review (race condition)
**Location**: `review-video.ts`
**Risk**: Two admins can approve the same video simultaneously, potentially double-counting delivered videos. The `reviewVideo` use-case reads then writes without a transaction lock.
**Fix**: Use `SELECT ... FOR UPDATE` or a Supabase RPC with transaction isolation.

### CRIT-4: Service role key singleton bypasses ALL RLS
**Location**: `src/application/dependencies.ts:6-20`
**Risk**: A single `createClient(url, serviceRoleKey)` instance is used for ALL server-side operations. Any code path that accesses the repository can read/write any row in any table.
**Mitigation**: Currently protected by API route guards. But a bug in any route handler could leak full DB access.
**Recommendation**: Consider per-request clients with user JWT for read operations, service role only for admin writes.

---

## 2. HIGH Issues

### HIGH-1: No input validation in `calculatePayout()`
**Location**: `src/domain/services/calculate-payout.ts:16-38`
**Risk**: Negative delivered counts produce negative subtotals (potential payout fraud)
**Fix**: Add `if (delivered < 0) throw` guard

### HIGH-2: CSV export vulnerable to formula injection
**Location**: CSV export in admin dashboard use-case
**Status**: Partially mitigated -- `csvEscape()` now prefixes formula chars with `'`. Tests confirm. But the mitigation only covers `=, +, -, @, \t` -- other vectors like `DDE` commands are not tested.

### HIGH-3: In-memory rate limiting useless in serverless
**Location**: `src/lib/rate-limit.ts`
**Risk**: Each serverless function invocation gets a fresh memory space. Rate limits reset on every cold start.
**Fix**: Use Upstash Redis, Vercel KV, or Supabase-backed rate limiting.

### HIGH-4: Sign-out doesn't revoke server-side session
**Location**: `src/app/api/auth/sign-out/route.ts`
**Risk**: After sign-out, stolen refresh tokens remain valid until Supabase's own expiry.
**Fix**: Call `supabase.auth.admin.signOut(userId, 'global')` on sign-out.

### HIGH-5: `reviewed_by` column has no FK constraint
**Location**: `videos.reviewed_by`
**Risk**: Orphaned UUIDs, no referential integrity for audit trail
**Fix**: Add FK to `auth.users(id)` with `ON DELETE SET NULL`

### HIGH-6: Payout profile financial data stored in plaintext
**Location**: `creator_payout_profiles.iban`
**Risk**: IBAN numbers visible in database dumps/backups
**Recommendation**: Column-level encryption via `pgcrypto` or application-layer encryption

### HIGH-7: `creator_applications` RLS uses `public` role
**Location**: `creator_applications`, `onboarding_drafts` RLS policies
**Risk**: Policies are granted to `public` role instead of `authenticated`. While Supabase anon key maps to `public`, this is less restrictive than intended.
**Fix**: Change role to `authenticated`

---

## 3. MEDIUM Issues

### MED-1: RLS InitPlan optimization inconsistency
`creator_payout_profiles` policies call `auth.jwt()` directly without `(select auth.jwt())` wrapper. Causes per-row re-evaluation.

### MED-2: Redundant index on `creators.user_id`
Both `creators_user_id_key` (UNIQUE) and `idx_creators_user_id` (regular) exist. Drop the regular one.

### MED-3: Missing migration file locally
Migration `20260215181217_add_admin_write_policies_config_tables` exists only in remote DB. Local `supabase/migrations/` is out of sync.

### MED-4: No functional index on `lower(email)` for RLS
Several RLS policies use `lower(c.email) = lower(...)` for creator matching. Missing functional index impacts query performance.

### MED-5: Date fields as strings in domain types
All date fields in domain types are `string` instead of `Date`. Type safety lost, ISO8601 parsing required in application layer.

### MED-6: Over-delivery masked by clamping
`tracking-summary.ts` clamps remaining to 0. Over-delivery (2x quota) shows status="OK" -- admin has no visibility.

### MED-7: No `updated_at` on `videos` table
Status changes (pending_review -> approved) have no timestamp. Only `reviewed_at` exists for review events.

### MED-8: `monthly_tracking.month` stored as text
Uses regex CHECK instead of date type. Prevents native date operations and range queries.

### MED-9: Contract `reviewed_by` field leaks admin UUID to RLS
Not security-critical but could be a data exposure concern if RLS policies are weakened.

### MED-10: No Playwright E2E tests despite being installed
Playwright is in `devDependencies` but zero E2E test files exist.

---

## 4. LOW Issues

### LOW-1: ESLint config minimal (no TypeScript rules)
Only `next/core-web-vitals` preset. Missing `@typescript-eslint/recommended`.

### LOW-2: Inconsistent label language
`VIDEO_TYPE_LABELS` uses English, other labels use French.

### LOW-3: `contract_signed_at` uses `now()` vs `timezone('utc', now())`
Inconsistency with other tables (both return UTC in Supabase, but style differs).

### LOW-4: No JSDoc on domain service functions
`calculatePayout`, `calculateQuotas`, `summarizeTracking` lack documentation.

### LOW-5: No browserslist configuration
Autoprefixer uses defaults. Should be explicit for production target.

### LOW-6: No CSP `report-uri`
CSP violations are not monitored.

---

## 5. Architecture Deep Dive

### 5.1 Domain Layer (13 files, ~557 LOC)
- **Types**: 20 interfaces/types, 5 video types, 4 mixes, 4 statuses
- **Constants**: 14 named constants (packages, rates, mixes, labels, brand assets, contract)
- **Services**: 3 pure functions (payout, quotas, tracking summary)
- **Tests**: 32 test cases, 100% algorithm coverage
- **Grade**: B+ (excellent architecture, minor validation gaps)

### 5.2 Repository Layer (2 files, ~1010 LOC)
- **Interface**: `CreatorRepository` with 23 methods
- **Implementation**: `SupabaseCreatorRepository` (~800 LOC)
- **InMemory**: Exists but unused in tests
- **DI**: Singleton via `dependencies.ts`
- **Key concern**: Service role client bypasses all RLS

### 5.3 Use-Cases Layer (22 use-cases)
| Category | Count | Use-Cases |
|----------|-------|-----------|
| Auth/Onboarding | 5 | findCreatorIdForUser, getOnboardingPageData, submitApplication, signContract, saveOnboardingDraft |
| Creator Dashboard | 4 | getCreatorDashboardData, getCreatorSettingsData, uploadVideo, uploadRush |
| Admin Operations | 8 | getAdminDashboardData, reviewVideo, reviewApplication, markPaid, updatePackage/Mix/Rate, exportPaymentsCsv |
| Shared | 5 | getCreatorPayoutProfile, savePayoutProfile, deleteOnboardingDraft, findCreatorByEmail, getAdminConfigData |

### 5.4 API Routes (31 endpoints)
| Group | Endpoints | Auth | Rate Limited |
|-------|-----------|------|-------------|
| Auth | 4 (sign-in, sign-out, sign-up, verify-email) | Public | Yes (20/min) |
| Creator | 10 (dashboard, uploads, payout, settings) | Affiliate | Partial |
| Admin | 12 (dashboard, applications, config, payments) | Admin | Partial |
| Public | 5 (onboarding options, previews) | Mixed | No |

### 5.5 Auth System (7 components)
| Component | Status | Notes |
|-----------|--------|-------|
| Middleware JWT decode | ACCEPTABLE | No signature verification (Edge limitation), full verify server-side |
| Auth cookies (httpOnly) | SECURE | SameSite=Lax, Secure in prod, proper expiry |
| Session refresh | SECURE | Auto-refresh in middleware, fallback to login |
| Route guards (protectPage) | SECURE | Server-side, checks role + creator status |
| API guards (requireApiRole) | SECURE | Verifies JWT server-side with Supabase client |
| Auth context (client) | NEEDS_IMPROVEMENT | Polls session state, no event-based updates |
| Sign-out | NEEDS_IMPROVEMENT | Clears cookies but doesn't revoke server session |

### 5.6 Database Schema (12 tables)
| Table | Rows | RLS | Policies | Indexes |
|-------|------|-----|----------|---------|
| package_definitions | 4 | Yes | 2 (read + admin update) | 1 |
| mix_definitions | 4 | Yes | 2 (read + admin update) | 1 |
| video_rates | 5 | Yes | 2 (read + admin update) | 1 |
| creators | 2 | Yes | 1 (admin + self read) | 7 |
| monthly_tracking | 2 | Yes | 1 (admin + linked creator) | 6 |
| videos | 4 | Yes | 1 (admin + linked creator) | 4 |
| rushes | 3 | Yes | 1 (admin + linked creator) | 3 |
| creator_applications | 2 | Yes | 3 (self CRUD) | 6 |
| creator_contract_signatures | 1 | Yes | 2 (admin read + self insert) | 4 |
| creator_payout_profiles | 1 | Yes | 4 (self CRUD + admin read) | 2 |
| onboarding_drafts | 0 | Yes | 4 (self CRUD) | 2 |
| admin_audit_log | 18 | Yes | 2 (admin read + ANY insert) | 4 |

**Storage Buckets**: 2 (videos: 600MB limit, rushes: 2GB limit)
**Migrations**: 16 applied

### 5.7 Frontend Architecture
| Layer | RSC Components | Client Components |
|-------|---------------|-------------------|
| Admin | 4 page routes, admin shell | Config editor, payments table, applications table |
| Creator | 4 page routes | Upload card, rushes card, settings form, uploads page, payouts page |
| Public | 5+ page routes, page shell | Onboarding wizard, contract signing, auth forms |
| Shared UI | Section headings, cards | Mobile nav, auth credentials panel |

### 5.8 Design System
- **Colors**: 14 semantic HSL variables + 4 retro aliases (canvas, ink, frost, ember)
- **Typography**: 2 font families (display condensed + body), uppercase display style
- **Components**: CVA-based variants (Button 6 variants x 5 sizes, Badge 4 variants, Card family)
- **Animations**: 6 keyframes (fade-up, fade-in, float, marquee, accordion)
- **Responsive**: 5 breakpoints (xs:480, sm:640, md:768, lg:1024, 2xl:1400)

---

## 6. Test Coverage

### Current State
| Layer | Test Files | Test Cases | Coverage |
|-------|-----------|-----------|---------|
| Domain services | 3 | 26 | 100% of algorithms |
| Utility libs | 7 | 78 | 100% of utilities |
| **Total** | **10** | **104** | **~4.4% of source files** |

### Untested Areas (by risk)
1. **API Routes** (30+ files) -- CRITICAL gap
2. **Middleware** (auth, CSP, refresh) -- HIGH gap
3. **Use-cases** (22 files) -- HIGH gap
4. **Components** (100+ files) -- MEDIUM gap
5. **Infrastructure** (repository, clients) -- MEDIUM gap

### Testing Roadmap
| Phase | Priority | Action |
|-------|----------|--------|
| P0 | Immediate | Integration tests for auth API routes |
| P1 | High | Use-case tests with mocked repository |
| P2 | Medium | Component tests with @testing-library/react |
| P3 | Low | Playwright E2E smoke tests |

---

## 7. Dependency Audit

### Production Dependencies (19 packages)
- **Framework**: next 15.1.6, react 19.0.0
- **Database**: @supabase/supabase-js 2.49.1, @supabase/ssr 0.5.2
- **UI**: @radix-ui/* (6 packages), class-variance-authority, clsx, tailwind-merge
- **Icons**: lucide-react
- **Tables**: @tanstack/react-table
- **Analytics**: @vercel/analytics, @vercel/speed-insights
- **No known CVEs** in current versions

### Dev Dependencies (14 packages)
- **Build**: typescript 5.x, tailwindcss 3.4.17, postcss, autoprefixer
- **Test**: vitest 3.x, playwright (installed, unused)
- **Types**: @types/node, @types/react, @types/react-dom

---

## 8. Comparison with Previous Audits

| Metric | v1 (2026-02-06) | v2 (2026-02-12) | v3 (2026-02-23) |
|--------|-----------------|-----------------|-----------------|
| Critical | 3 | 4 | 4 |
| High | 19 | 12 | 7 |
| Medium | 54 | 30 | 10 |
| Low | 49+ | 32 | 6 |
| Total | 125+ | 78 | 27 |

**Progress**: 64% reduction in total issues from v1, 65% reduction from v2. Major improvements in API route hardening, auth cookie security, and guard patterns. Remaining criticals are deeper architectural issues (service role singleton, use-case authorization, audit log RLS).

---

## 9. Recommended Priority Actions

### Immediate (This Week)
1. Fix audit log INSERT RLS policy (CRIT-1) -- 5 min
2. Add admin role checks to use-cases (CRIT-2) -- 30 min
3. Add transaction isolation to video review (CRIT-3) -- 1 hr
4. Fix `creator_applications` RLS role from `public` to `authenticated` (HIGH-7) -- 5 min

### Short-Term (Next 2 Weeks)
5. Implement proper rate limiting (Upstash Redis) (HIGH-3)
6. Add server-side session revocation on sign-out (HIGH-4)
7. Add FK constraint on `videos.reviewed_by` (HIGH-5)
8. Write integration tests for auth API routes (P0 testing)
9. Sync local migration files with remote DB (MED-3)

### Medium-Term (Next Month)
10. Column-level encryption for IBAN data (HIGH-6)
11. Per-request Supabase clients for reads (CRIT-4 mitigation)
12. Add functional index on `lower(email)` (MED-4)
13. Write use-case tests with mocked repository (P1 testing)
14. Configure Playwright for E2E smoke tests (MED-10)

---

## Appendix: Agent Reports

Individual detailed reports are available in the task output files:
- Agent 1 (Domain): Domain types, constants, services, contracts
- Agent 2 (Repository): Interface methods, Supabase implementation, DI
- Agent 3 (Use-Cases): 22 use-case analysis with authorization matrix
- Agent 4 (API Routes): 31 endpoint security matrix
- Agent 5 (Auth): 7-component auth system rating
- Agent 6 (Admin UI): Dashboard, applications, config, creator detail
- Agent 7 (Creator UI): Dashboard, uploads, payouts, settings, onboarding
- Agent 8 (Public Pages): Landing, apply, login, design system, components
- Agent 9 (Database): See `docs/DATABASE_SCHEMA_AUDIT.md`
- Agent 10 (Config/Tests): package.json, next.config, tsconfig, tailwind, vitest, 104 tests
