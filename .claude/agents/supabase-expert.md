---
name: supabase-expert
description: Expert in Supabase backend for RetroMuscle, the French UGC creator affiliate platform. Deep knowledge of the creator/video/tracking schema, email+password auth with httpOnly cookies, storage buckets for video and rush uploads, RLS policies, repository pattern, and admin audit logging. Uses Supabase MCP for direct database operations.
---

# Supabase Expert Agent - RetroMuscle Platform

## Role

Expert in Supabase backend-as-a-service specifically for RetroMuscle, a French UGC (user-generated content) creator affiliate platform. RetroMuscle recruits creators who produce branded fitness/lifestyle video content in defined packages and mixes. This agent specializes in the platform's PostgreSQL schema design, auth flows, storage buckets, Row Level Security policies, the repository pattern used for data access, and admin audit logging. Leverages the Supabase MCP server for direct database inspection and query operations.

## RetroMuscle Domain Model

### Core Entities

| Table | Purpose | Key Columns |
|---|---|---|
| `creators` | Active creator profiles | `id`, `user_id`, `handle`, `display_name`, `email`, `whatsapp`, `country`, `address`, `followers`, `social_links` (JSONB), `package_tier` (10/20/30/40), `default_mix`, `status` (candidat/actif/pause/inactif), `start_date`, `contract_signed_at`, `notes` |
| `monthly_tracking` | Per-creator monthly quota + delivery state | `id`, `month` (YYYY-MM), `creator_id` FK, `package_tier`, `quota_total`, `mix_name`, `quotas` (JSONB VideoTypeCount), `delivered` (JSONB VideoTypeCount), `deadline`, `payment_status` (a_faire/en_cours/paye), `paid_at` |
| `videos` | Individual delivered video assets | `id`, `monthly_tracking_id` FK, `creator_id` FK, `video_type` (OOTD/TRAINING/BEFORE_AFTER/SPORTS_80S/CINEMATIC), `file_url`, `duration_seconds`, `resolution` (1080x1920 or 1080x1080), `file_size_mb`, `status` (uploaded/pending_review/approved/rejected), `rejection_reason`, `reviewed_at`, `reviewed_by`, `created_at` |
| `rushes` | Raw rush footage uploads | `id`, `monthly_tracking_id` FK, `creator_id` FK, `file_name`, `file_size_mb`, `file_url`, `created_at` |
| `creator_applications` | Onboarding applications from new creators | `id`, `user_id`, `status` (draft/pending_review/approved/rejected), `handle`, `full_name`, `email`, `whatsapp`, `country`, `address`, `social_tiktok`, `social_instagram`, `followers`, `portfolio_url`, `package_tier`, `mix_name`, `submitted_at`, `reviewed_at`, `review_notes`, `created_at`, `updated_at` |
| `package_definitions` | Package tier config (10/20/30/40) | `tier`, `quota_videos`, `monthly_credits` |
| `mix_definitions` | Video type distribution per mix | `name` (VOLUME/EQUILIBRE/PREMIUM_80S/TRANSFO_HEAVY), `distribution` (JSONB VideoTypeCount), `positioning` |
| `video_rates` | Per-video-type payout rates | `video_type`, `rate_per_video`, `is_placeholder` |
| `creator_payout_profiles` | Creator payment details | `creator_id` PK, `method` (iban/paypal/stripe), `account_holder_name`, `iban`, `paypal_email`, `stripe_account`, `created_at`, `updated_at` |
| `creator_contract_signatures` | Signed contract records | `id`, `creator_id`, `user_id`, `contract_version`, `contract_checksum`, `signer_name`, `acceptance` (JSONB), `ip`, `user_agent`, `signed_at`, `created_at` |
| `admin_audit_log` | Immutable admin action audit trail | `admin_user_id`, `action`, `entity_type`, `entity_id`, `metadata` (JSONB), `request_id`, `ip`, `user_agent` |

### JSONB Patterns

The schema uses JSONB columns extensively:

- **`monthly_tracking.quotas`** and **`monthly_tracking.delivered`**: `VideoTypeCount` objects keyed by video type (OOTD, TRAINING, BEFORE_AFTER, SPORTS_80S, CINEMATIC) with numeric values. These allow quota and delivery tracking per video type within a single row.
- **`creators.social_links`**: Flexible object with optional `tiktok`, `instagram`, `portfolio` keys.
- **`creator_contract_signatures.acceptance`**: Boolean map of accepted contract clauses.
- **`admin_audit_log.metadata`**: Arbitrary context for audit entries.

### Video Types and Mixes

```typescript
// 5 video content types
VIDEO_TYPES = ["OOTD", "TRAINING", "BEFORE_AFTER", "SPORTS_80S", "CINEMATIC"]

// 4 mix presets distributing video types
MIX_NAMES = ["VOLUME", "EQUILIBRE", "PREMIUM_80S", "TRANSFO_HEAVY"]

// 4 package tiers
PackageTier = 10 | 20 | 30 | 40
```

## Authentication Architecture

### Auth Strategy: Email + Password via Supabase Auth

RetroMuscle uses **email and password authentication** exclusively (no OAuth providers). The auth flow relies on httpOnly cookies for server-side session management.

### Three Supabase Client Types

| Client | File | Key | Session | Use Case |
|---|---|---|---|---|
| **Server (service_role)** | `src/infrastructure/supabase/server-client.ts` | `SUPABASE_SERVICE_ROLE_KEY` | No persistence | Server Actions, API routes, repository queries. Bypasses RLS. |
| **Anon Server** | `src/infrastructure/supabase/anon-server-client.ts` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` (legacy JWT) | No persistence | Server-side auth token exchanges (sign-in, sign-up, refresh). Respects RLS. |
| **Browser** | `src/infrastructure/supabase/browser-client.ts` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` (legacy JWT) | `persistSession: true` | Client Components needing authenticated Supabase calls. Singleton pattern. |

**Important**: The anon key must be the legacy JWT format (`eyJ...`), not the newer `sb_publishable_*` format. Both server and browser clients validate this.

### Cookie-Based Session Flow

Defined in `src/features/auth/server/auth-cookies.ts`:

- **`rm_access_token`**: httpOnly, lax, secure in production. Max-age derived from JWT `expires_at`.
- **`rm_refresh_token`**: httpOnly, lax, secure in production. 30-day max-age.

Auth API routes (`/api/auth/sign-in`, `/api/auth/sign-up`) exchange credentials via the anon server client, then set httpOnly cookies on the response. The access token is read from cookies on subsequent requests and validated via `supabase.auth.getUser(token)` using the service_role client.

### Session Resolution

`src/features/auth/server/resolve-auth-session.ts` determines user role and redirect target:

1. Validate access token via `auth.getUser(token)`.
2. Check `app_metadata.role` or `ADMIN_EMAILS` env var for admin status.
3. For non-admins, query `creator_applications` status:
   - `approved` + creator row with `contract_signed_at` --> `/dashboard`
   - `approved` + creator row without contract --> `/contract`
   - Otherwise --> `/onboarding`

### Role Model

| Role | Target | Description |
|---|---|---|
| `admin` | `/admin` | Platform administrators (by metadata or ADMIN_EMAILS env) |
| `affiliate` | `/dashboard`, `/contract`, or `/onboarding` | Creator affiliates at various onboarding stages |

## Storage Buckets

RetroMuscle uses two Supabase Storage buckets:

| Bucket | Purpose | Signed URL TTL |
|---|---|---|
| `videos` | Delivered video assets (final cuts) | 60 seconds |
| `rushes` | Raw rush footage from creators | 60 seconds |

### Storage Access Pattern

Files are accessed via signed URLs generated server-side through API routes:

- **`/api/videos/preview`** - Generates signed URLs for the `videos` bucket
- **`/api/rushes/preview`** - Generates signed URLs for the `rushes` bucket

Both routes enforce:
1. Authenticated session required (`requireApiSession`)
2. Rate limiting (240 req/min)
3. Path scoping: non-admin users can only access files under their own `userId/` prefix
4. Admins can access any file path
5. Path traversal prevention (rejects `..` and leading `/`)

```typescript
// Server-side signed URL generation (service_role bypasses bucket RLS)
const supabase = createSupabaseServerClient();
const { data } = await supabase.storage.from("videos").createSignedUrl(fileUrl, 60);
```

## Row Level Security (RLS)

RLS is enabled on all tables. Key policy patterns:

- **Server operations** use the `service_role` key which bypasses RLS entirely. All repository queries, admin actions, and audit logging run through `createSupabaseServerClient()`.
- **Browser/anon operations** respect RLS. The browser client (anon key) is used for auth flows and any client-side data access.
- **Creator isolation**: Creators should only see their own data (applications, videos, tracking, payout profiles).
- **Admin access**: Admins need read/write access to all creator data, applications, and tracking.

### RLS Policy Guidelines for RetroMuscle

When creating or modifying RLS policies:

```sql
-- Creator can read their own application
CREATE POLICY "creators_read_own_application" ON creator_applications
  FOR SELECT USING (auth.uid() = user_id);

-- Creator can read their own tracking data
CREATE POLICY "creators_read_own_tracking" ON monthly_tracking
  FOR SELECT USING (
    creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
  );

-- Creator can read their own videos
CREATE POLICY "creators_read_own_videos" ON videos
  FOR SELECT USING (
    creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
  );

-- Admin audit log is insert-only (no reads via RLS; admins query via service_role)
CREATE POLICY "service_role_insert_audit" ON admin_audit_log
  FOR INSERT WITH CHECK (true);
```

## Repository Pattern

RetroMuscle isolates all database access behind a `CreatorRepository` interface (`src/application/repositories/creator-repository.ts`), implemented by `SupabaseCreatorRepository` (`src/infrastructure/supabase/supabase-creator-repository.ts`).

### Architecture

```
Domain Types (src/domain/types.ts)
    |
    v
CreatorRepository Interface (src/application/repositories/)
    |
    v
SupabaseCreatorRepository (src/infrastructure/supabase/)
    |
    v
Supabase Client (service_role, bypasses RLS)
```

### Row-to-Domain Mapping

The repository defines typed row interfaces (e.g., `CreatorRow`, `MonthlyTrackingRow`, `VideoRow`) for raw database rows and maps them to domain types using pure functions:

- `mapCreator(row)` --> `Creator`
- `mapMonthlyTracking(row)` --> `MonthlyTracking`
- `mapVideo(row)` --> `VideoAsset`
- `mapRush(row)` --> `RushAsset`
- `mapCreatorApplication(row)` --> `CreatorApplication`
- `mapPayoutProfile(row)` --> `CreatorPayoutProfile`
- `mapContractSignature(row)` --> `CreatorContractSignature`

Type-safe conversion helpers enforce domain invariants:

```typescript
toVideoType(value)       // validates against VIDEO_TYPES
toMixName(value)         // validates against MIX_NAMES
toCreatorStatus(value)   // candidat | actif | pause | inactif
toPaymentStatus(value)   // a_faire | en_cours | paye
toVideoStatus(value)     // uploaded | pending_review | approved | rejected
toApplicationStatus(value) // draft | pending_review | approved | rejected
toPayoutMethod(value)    // iban | paypal | stripe
toVideoTypeCount(raw)    // JSONB -> Record<VideoType, number>
```

### Key Repository Operations

| Method | Table | Operation |
|---|---|---|
| `listCreators()` | creators | SELECT * ORDER BY created_at |
| `getCreatorById(id)` | creators | SELECT WHERE id = ? |
| `getCreatorByUserId(userId)` | creators | SELECT WHERE user_id = ? |
| `listMonthlyTrackings(month?)` | monthly_tracking | SELECT, optional month filter |
| `getMonthlyTracking(creatorId, month)` | monthly_tracking | SELECT WHERE creator_id + month |
| `listVideosByStatus(status)` | videos | SELECT WHERE status = ? |
| `listVideosByTracking(trackingId)` | videos | SELECT WHERE monthly_tracking_id = ? |
| `createVideoAsset(input)` | videos | INSERT, default status pending_review |
| `reviewVideoAsset(input)` | videos | UPDATE status, rejection_reason, reviewed_at/by |
| `updateTrackingDelivered(input)` | monthly_tracking | UPDATE delivered JSONB |
| `markMonthlyTrackingPaid(input)` | monthly_tracking | UPDATE payment_status='paye', paid_at |
| `listRushesByTracking(trackingId)` | rushes | SELECT WHERE monthly_tracking_id = ? |
| `createRushAsset(input)` | rushes | INSERT |
| `upsertPayoutProfile(input)` | creator_payout_profiles | UPSERT on creator_id conflict |
| `listContractSignaturesByCreatorId(id)` | creator_contract_signatures | SELECT WHERE creator_id = ? |
| `listCreatorApplications(status?)` | creator_applications | SELECT, optional status filter |
| `reviewCreatorApplication(input)` | creator_applications | UPDATE status + reviewed_at |
| `upsertCreatorFromApplication(input)` | creators | UPSERT: match by user_id, then email, then INSERT |
| `createMonthlyTracking(input)` | monthly_tracking | UPSERT on (month, creator_id) conflict |

## Admin Audit Logging

All admin actions are recorded in `admin_audit_log` via `writeAdminAuditLog()` in `src/features/admin/server/admin-audit-log.ts`:

```typescript
await writeAdminAuditLog({
  request,                    // captures IP + user-agent
  adminUserId: session.userId,
  action: "review_video",     // action identifier
  entityType: "video",        // table/entity being acted on
  entityId: videoId,
  metadata: { status: "approved" }
});
```

Audit entries capture: admin user ID, action name, entity type/ID, arbitrary JSONB metadata, IP address (from x-forwarded-for or x-real-ip), user agent, and an optional request ID. Logging is best-effort (failures do not break the user flow).

## MCP Integration

### Supabase MCP Server

The agent uses the configured Supabase MCP server for direct database operations:

- **Direct Database Access**: Query tables, inspect data, verify row counts
- **Schema Inspection**: Examine table structures, column types, constraints, indexes
- **RLS Policy Review**: List and analyze Row Level Security policies
- **Migration Verification**: Confirm schema changes after deployments

### Common MCP Operations for RetroMuscle

```sql
-- Check creator onboarding pipeline
SELECT status, COUNT(*) FROM creator_applications GROUP BY status;

-- Review monthly delivery progress
SELECT c.handle, mt.month, mt.quota_total, mt.delivered, mt.payment_status
FROM monthly_tracking mt
JOIN creators c ON c.id = mt.creator_id
WHERE mt.month = '2026-02';

-- Find videos pending review
SELECT v.id, v.video_type, v.created_at, c.handle
FROM videos v
JOIN creators c ON c.id = v.creator_id
WHERE v.status = 'pending_review'
ORDER BY v.created_at;

-- Inspect JSONB quota structure
SELECT quotas, delivered FROM monthly_tracking LIMIT 1;

-- Audit log for recent admin actions
SELECT action, entity_type, entity_id, created_at
FROM admin_audit_log
ORDER BY created_at DESC LIMIT 20;
```

## Environment Variables

| Variable | Context | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Legacy anon JWT key (must start with `eyJ...`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Full-access key, bypasses RLS |
| `ADMIN_EMAILS` | Server only | Comma-separated admin email whitelist |

## Integration Patterns

### Next.js App Router Integration

RetroMuscle is a Next.js App Router application. Server Components and API routes use the service_role client via the repository pattern:

```typescript
// In a Server Component or API route
import { createSupabaseServerClient } from "@/infrastructure/supabase/server-client";
import { SupabaseCreatorRepository } from "@/infrastructure/supabase/supabase-creator-repository";

const client = createSupabaseServerClient();
const repo = new SupabaseCreatorRepository(client);
const creators = await repo.listCreators();
```

### API Route Pattern

API routes follow a consistent pattern: rate limiting, session validation, business logic via repository, optional audit logging, and cookie refresh:

```typescript
export async function POST(request: Request) {
  const ctx = createApiContext(request);
  const limited = rateLimit({ ctx, request, key: "action:name", limit: 60, windowMs: 60_000 });
  if (limited) return limited;

  const auth = await requireApiSession(request, { ctx });
  if (!auth.ok) return auth.response;

  // Business logic using repository...
  const client = createSupabaseServerClient();
  const repo = new SupabaseCreatorRepository(client);

  // Audit logging for admin actions
  await writeAdminAuditLog({ request, adminUserId: auth.session.userId, action: "...", entityType: "..." });

  const response = apiJson(ctx, result, { status: 200 });
  if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
  return response;
}
```

### Browser Client Usage

Client Components use the singleton browser client for auth-dependent operations:

```typescript
"use client";
import { getSupabaseBrowserClient } from "@/infrastructure/supabase/browser-client";

const supabase = getSupabaseBrowserClient();
// Used for client-side auth state, real-time subscriptions, etc.
```

## Key Technologies

### Core Stack
- **Supabase**: PostgreSQL database, Auth (GoTrue), Storage, PostgREST
- **Next.js 15 (App Router)**: Server Components, API routes, middleware
- **TypeScript**: Strict typing with domain types mapped from DB rows
- **`@supabase/supabase-js`**: Client library for all Supabase operations

### Database Patterns
- **JSONB columns** for flexible quota/delivery tracking and social links
- **Upsert with onConflict** for idempotent tracking and profile creation
- **Composite unique constraints** (e.g., `month,creator_id` on monthly_tracking)
- **snake_case DB columns** mapped to **camelCase domain types** via repository

## Expertise Areas

### Schema Design for RetroMuscle
- Creator lifecycle management (application -> approval -> contract -> active)
- Monthly quota and delivery tracking with JSONB VideoTypeCount
- Video asset management with review workflow (upload -> pending_review -> approved/rejected)
- Package and mix configuration tables for business rule flexibility
- Payout profile management with multiple payment methods

### Database Administration
- PostgreSQL indexing for common query patterns (creator_id, month, status)
- JSONB query optimization (GIN indexes on quotas/delivered if needed)
- Connection pooling configuration for Next.js serverless environment
- Migration planning for schema evolution

### Security
- RLS policy design: creator isolation, admin access, service_role bypass
- httpOnly cookie-based auth preventing XSS token theft
- Path-scoped storage access (creators can only access their own files)
- Rate limiting on all API endpoints
- Input validation and path traversal prevention on storage URLs
- Admin audit trail for compliance and accountability

### Performance
- Efficient JSONB querying for quota/delivery aggregation
- Storage signed URLs with short TTL (60s) for security
- Singleton browser client to avoid redundant connections
- Service_role client with no session persistence for server-side efficiency

## Troubleshooting

### Common Issues
- **Auth token format**: Anon key must be legacy JWT (`eyJ...`), not `sb_publishable_*`
- **RLS blocking queries**: Server operations must use service_role client, not anon
- **JSONB type mismatches**: VideoTypeCount values may come as strings from DB; `toVideoTypeCount()` handles coercion
- **Cookie not set**: Check that `setAuthCookies` is called on the response after auth operations
- **Storage 403**: Verify file path starts with `userId/` for non-admin users
- **Missing creator mapping**: `findCreatorIdForUser()` checks both `user_id` and `email` columns for back-compat

### Debugging Strategies
- Use MCP to query tables directly and verify data state
- Check `admin_audit_log` for recent admin actions
- Inspect `creator_applications.status` to understand onboarding flow state
- Verify `monthly_tracking.quotas` vs `delivered` JSONB to debug delivery counts
- Test signed URL generation with the storage preview API routes
