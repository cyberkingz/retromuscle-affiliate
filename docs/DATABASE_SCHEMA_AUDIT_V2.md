# RetroMuscle Database Schema Audit V2

**Audit Date**: 2026-02-23
**Auditor**: Automated via Supabase MCP (live database inspection)
**Database**: Supabase PostgreSQL (hosted)
**Auth Users Count**: 6

---

## Table of Contents

1. [Extensions](#1-extensions)
2. [Tables](#2-tables)
3. [RLS Policies](#3-rls-policies)
4. [Storage Policies](#4-storage-policies)
5. [Indexes](#5-indexes)
6. [Triggers](#6-triggers)
7. [Functions](#7-functions)
8. [Storage Buckets](#8-storage-buckets)
9. [Migrations](#9-migrations)
10. [Reference Data](#10-reference-data)
11. [Entity Relationship Diagram](#11-entity-relationship-diagram)
12. [Security Analysis](#12-security-analysis)

---

## 1. Extensions

### Installed Extensions

| Extension | Schema | Installed Version | Description |
|---|---|---|---|
| `plpgsql` | `pg_catalog` | 1.0 | PL/pgSQL procedural language |
| `pgcrypto` | `extensions` | 1.3 | Cryptographic functions |
| `pg_stat_statements` | `extensions` | 1.11 | Track planning and execution statistics of all SQL statements |
| `pg_graphql` | `graphql` | 1.5.11 | GraphQL support |
| `supabase_vault` | `vault` | 0.3.1 | Supabase Vault Extension |
| `uuid-ossp` | `extensions` | 1.1 | Generate universally unique identifiers (UUIDs) |

### Notable NOT-Installed Extensions

- `pg_trgm` (trigram text search) -- not needed currently
- `pg_cron` (job scheduler) -- not in use
- `vector` (pgvector) -- not in use
- `pg_jsonschema` -- could be used to validate JSONB columns but is not installed
- `pgjwt` -- available but not installed (JWT handling is done in application layer)

---

## 2. Tables

### 2.1 `creators`

**Purpose**: Active creator profiles linked to auth.users
**Row Count**: 1
**RLS**: Enabled

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | **PK** |
| `handle` | `text` | NO | -- | **UNIQUE** |
| `display_name` | `text` | NO | -- | -- |
| `email` | `text` | NO | -- | **UNIQUE** |
| `whatsapp` | `text` | NO | -- | -- |
| `country` | `text` | NO | -- | -- |
| `address` | `text` | NO | -- | -- |
| `followers` | `integer` | NO | `0` | -- |
| `social_links` | `jsonb` | NO | `'{}'::jsonb` | -- |
| `package_tier` | `integer` | NO | -- | FK -> `package_definitions.tier` |
| `default_mix` | `text` | NO | -- | FK -> `mix_definitions.name` |
| `status` | `text` | NO | -- | CHECK `IN ('candidat','actif','pause','inactif')` |
| `start_date` | `date` | NO | -- | -- |
| `contract_signed_at` | `timestamptz` | YES | -- | -- |
| `notes` | `text` | YES | -- | -- |
| `created_at` | `timestamptz` | NO | `timezone('utc', now())` | -- |
| `updated_at` | `timestamptz` | NO | `timezone('utc', now())` | -- |
| `user_id` | `uuid` | YES | -- | **UNIQUE**, FK -> `auth.users.id` ON DELETE SET NULL |

**CHECK Constraints**:
- `creators_status_check`: `status = ANY (ARRAY['candidat','actif','pause','inactif'])`

**UNIQUE Constraints**:
- `creators_handle_key`: `UNIQUE (handle)`
- `creators_email_key`: `UNIQUE (email)`
- `creators_user_id_key`: `UNIQUE (user_id)`

**Foreign Keys**:
| Constraint | Column | References | ON DELETE |
|---|---|---|---|
| `creators_package_tier_fkey` | `package_tier` | `package_definitions(tier)` | NO ACTION |
| `creators_default_mix_fkey` | `default_mix` | `mix_definitions(name)` | NO ACTION |
| `creators_user_id_fkey` | `user_id` | `auth.users(id)` | SET NULL |

---

### 2.2 `monthly_tracking`

**Purpose**: Per-creator monthly quota + delivery state
**Row Count**: 1
**RLS**: Enabled

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | **PK** |
| `month` | `text` | NO | -- | CHECK regex, part of UNIQUE(month, creator_id) |
| `creator_id` | `uuid` | NO | -- | FK -> `creators.id`, part of UNIQUE(month, creator_id) |
| `package_tier` | `integer` | NO | -- | FK -> `package_definitions.tier` |
| `quota_total` | `integer` | NO | -- | CHECK `> 0` |
| `mix_name` | `text` | NO | -- | FK -> `mix_definitions.name` |
| `quotas` | `jsonb` | NO | -- | -- |
| `delivered` | `jsonb` | NO | -- | -- |
| `deadline` | `date` | NO | -- | -- |
| `payment_status` | `text` | NO | -- | CHECK `IN ('a_faire','en_cours','paye')` |
| `paid_at` | `timestamptz` | YES | -- | -- |
| `created_at` | `timestamptz` | NO | `timezone('utc', now())` | -- |
| `updated_at` | `timestamptz` | NO | `timezone('utc', now())` | -- |

**CHECK Constraints**:
- `monthly_tracking_month_check`: `month ~ '^[0-9]{4}-[0-9]{2}$'`
- `monthly_tracking_quota_total_check`: `quota_total > 0`
- `monthly_tracking_payment_status_check`: `payment_status = ANY (ARRAY['a_faire','en_cours','paye'])`

**UNIQUE Constraints**:
- `monthly_tracking_month_creator_id_key`: `UNIQUE (month, creator_id)`

**Foreign Keys**:
| Constraint | Column | References | ON DELETE |
|---|---|---|---|
| `monthly_tracking_creator_id_fkey` | `creator_id` | `creators(id)` | CASCADE |
| `monthly_tracking_package_tier_fkey` | `package_tier` | `package_definitions(tier)` | NO ACTION |
| `monthly_tracking_mix_name_fkey` | `mix_name` | `mix_definitions(name)` | NO ACTION |

---

### 2.3 `videos`

**Purpose**: Individual delivered video assets
**Row Count**: 0
**RLS**: Enabled

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | **PK** |
| `monthly_tracking_id` | `uuid` | NO | -- | FK -> `monthly_tracking.id` |
| `creator_id` | `uuid` | NO | -- | FK -> `creators.id` |
| `video_type` | `text` | NO | -- | CHECK `IN ('OOTD','TRAINING','BEFORE_AFTER','SPORTS_80S','CINEMATIC')` |
| `file_url` | `text` | NO | -- | -- |
| `duration_seconds` | `integer` | NO | -- | CHECK `> 0` |
| `resolution` | `text` | NO | -- | CHECK `IN ('1080x1920','1080x1080')` |
| `file_size_mb` | `integer` | NO | -- | CHECK `> 0` |
| `status` | `text` | NO | -- | CHECK `IN ('uploaded','pending_review','approved','rejected')` |
| `rejection_reason` | `text` | YES | -- | -- |
| `reviewed_at` | `timestamptz` | YES | -- | -- |
| `reviewed_by` | `uuid` | YES | -- | -- |
| `created_at` | `timestamptz` | NO | `timezone('utc', now())` | -- |

**CHECK Constraints**:
- `videos_video_type_check`: `video_type = ANY (ARRAY['OOTD','TRAINING','BEFORE_AFTER','SPORTS_80S','CINEMATIC'])`
- `videos_duration_seconds_check`: `duration_seconds > 0`
- `videos_resolution_check`: `resolution = ANY (ARRAY['1080x1920','1080x1080'])`
- `videos_file_size_mb_check`: `file_size_mb > 0`
- `videos_status_check`: `status = ANY (ARRAY['uploaded','pending_review','approved','rejected'])`

**Foreign Keys**:
| Constraint | Column | References | ON DELETE |
|---|---|---|---|
| `videos_monthly_tracking_id_fkey` | `monthly_tracking_id` | `monthly_tracking(id)` | CASCADE |
| `videos_creator_id_fkey` | `creator_id` | `creators(id)` | CASCADE |

---

### 2.4 `rushes`

**Purpose**: Raw rush footage uploads
**Row Count**: 0
**RLS**: Enabled

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | **PK** |
| `monthly_tracking_id` | `uuid` | NO | -- | FK -> `monthly_tracking.id` |
| `creator_id` | `uuid` | NO | -- | FK -> `creators.id` |
| `file_name` | `text` | NO | -- | -- |
| `file_size_mb` | `integer` | NO | -- | CHECK `> 0` |
| `file_url` | `text` | YES | -- | -- |
| `created_at` | `timestamptz` | NO | `timezone('utc', now())` | -- |

**CHECK Constraints**:
- `rushes_file_size_mb_check`: `file_size_mb > 0`

**Foreign Keys**:
| Constraint | Column | References | ON DELETE |
|---|---|---|---|
| `rushes_monthly_tracking_id_fkey` | `monthly_tracking_id` | `monthly_tracking(id)` | CASCADE |
| `rushes_creator_id_fkey` | `creator_id` | `creators(id)` | CASCADE |

---

### 2.5 `creator_applications`

**Purpose**: Onboarding applications from new creators
**Row Count**: 1
**RLS**: Enabled

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | **PK** |
| `user_id` | `uuid` | NO | -- | **UNIQUE**, FK -> `auth.users(id)` ON DELETE CASCADE |
| `status` | `text` | NO | `'draft'` | CHECK `IN ('draft','pending_review','approved','rejected')` |
| `handle` | `text` | NO | -- | -- |
| `full_name` | `text` | NO | -- | -- |
| `email` | `text` | NO | -- | -- |
| `whatsapp` | `text` | NO | -- | -- |
| `country` | `text` | NO | -- | -- |
| `address` | `text` | NO | -- | -- |
| `social_tiktok` | `text` | YES | -- | -- |
| `social_instagram` | `text` | YES | -- | -- |
| `followers` | `integer` | NO | `0` | CHECK `>= 0` |
| `portfolio_url` | `text` | YES | -- | -- |
| `package_tier` | `integer` | NO | -- | FK -> `package_definitions(tier)` |
| `mix_name` | `text` | NO | -- | FK -> `mix_definitions(name)` |
| `submitted_at` | `timestamptz` | YES | -- | -- |
| `reviewed_at` | `timestamptz` | YES | -- | -- |
| `review_notes` | `text` | YES | -- | -- |
| `created_at` | `timestamptz` | NO | `timezone('utc', now())` | -- |
| `updated_at` | `timestamptz` | NO | `timezone('utc', now())` | -- |

**CHECK Constraints**:
- `creator_applications_status_check`: `status = ANY (ARRAY['draft','pending_review','approved','rejected'])`
- `creator_applications_followers_check`: `followers >= 0`

**UNIQUE Constraints**:
- `creator_applications_user_id_key`: `UNIQUE (user_id)`

**Foreign Keys**:
| Constraint | Column | References | ON DELETE |
|---|---|---|---|
| `creator_applications_user_id_fkey` | `user_id` | `auth.users(id)` | CASCADE |
| `creator_applications_package_tier_fkey` | `package_tier` | `package_definitions(tier)` | NO ACTION |
| `creator_applications_mix_name_fkey` | `mix_name` | `mix_definitions(name)` | NO ACTION |

---

### 2.6 `creator_contract_signatures`

**Purpose**: Signed contract records
**Row Count**: 1
**RLS**: Enabled

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | **PK** |
| `creator_id` | `uuid` | NO | -- | FK -> `creators(id)` |
| `user_id` | `uuid` | NO | -- | FK -> `auth.users(id)` |
| `contract_version` | `text` | NO | -- | -- |
| `contract_checksum` | `text` | NO | -- | -- |
| `contract_text` | `text` | NO | -- | -- |
| `signer_name` | `text` | NO | -- | -- |
| `acceptance` | `jsonb` | NO | -- | -- |
| `ip` | `inet` | YES | -- | -- |
| `user_agent` | `text` | YES | -- | -- |
| `signed_at` | `timestamptz` | NO | `now()` | -- |
| `created_at` | `timestamptz` | NO | `now()` | -- |

**Unique Indexes** (enforced via index, not formal constraint):
- `creator_contract_signatures_user_checksum_unique`: `UNIQUE (user_id, contract_checksum)`

**Foreign Keys**:
| Constraint | Column | References | ON DELETE |
|---|---|---|---|
| `creator_contract_signatures_creator_id_fkey` | `creator_id` | `creators(id)` | CASCADE |
| `creator_contract_signatures_user_id_fkey` | `user_id` | `auth.users(id)` | CASCADE |

---

### 2.7 `creator_payout_profiles`

**Purpose**: Creator payment details
**Row Count**: 0
**RLS**: Enabled

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `creator_id` | `uuid` | NO | -- | **PK**, FK -> `creators(id)` |
| `method` | `text` | NO | `'iban'` | CHECK `IN ('iban','paypal','stripe')` |
| `account_holder_name` | `text` | YES | -- | -- |
| `iban` | `text` | YES | -- | -- |
| `paypal_email` | `text` | YES | -- | -- |
| `stripe_account` | `text` | YES | -- | -- |
| `created_at` | `timestamptz` | NO | `timezone('utc', now())` | -- |
| `updated_at` | `timestamptz` | NO | `timezone('utc', now())` | -- |

**CHECK Constraints**:
- `creator_payout_profiles_method_check`: `method = ANY (ARRAY['iban','paypal','stripe'])`

**Foreign Keys**:
| Constraint | Column | References | ON DELETE |
|---|---|---|---|
| `creator_payout_profiles_creator_id_fkey` | `creator_id` | `creators(id)` | CASCADE |

---

### 2.8 `onboarding_drafts`

**Purpose**: Temporary onboarding form draft storage
**Row Count**: 0
**RLS**: Enabled

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | **PK** |
| `user_id` | `uuid` | NO | -- | **UNIQUE**, FK -> `auth.users(id)` ON DELETE CASCADE |
| `form_data` | `jsonb` | NO | `'{}'::jsonb` | -- |
| `step` | `integer` | NO | `0` | CHECK `step >= 0 AND step <= 2` |
| `created_at` | `timestamptz` | NO | `timezone('utc', now())` | -- |
| `updated_at` | `timestamptz` | NO | `timezone('utc', now())` | -- |

**CHECK Constraints**:
- `onboarding_drafts_step_check`: `step >= 0 AND step <= 2`

**UNIQUE Constraints**:
- `onboarding_drafts_user_id_key`: `UNIQUE (user_id)`

**Foreign Keys**:
| Constraint | Column | References | ON DELETE |
|---|---|---|---|
| `onboarding_drafts_user_id_fkey` | `user_id` | `auth.users(id)` | CASCADE |

---

### 2.9 `admin_audit_log`

**Purpose**: Immutable admin action audit trail
**Row Count**: 18
**RLS**: Enabled

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | **PK** |
| `created_at` | `timestamptz` | NO | `timezone('utc', now())` | -- |
| `admin_user_id` | `uuid` | NO | -- | -- |
| `action` | `text` | NO | -- | -- |
| `entity_type` | `text` | NO | -- | -- |
| `entity_id` | `uuid` | YES | -- | -- |
| `metadata` | `jsonb` | NO | `'{}'::jsonb` | -- |
| `request_id` | `text` | YES | -- | -- |
| `ip` | `inet` | YES | -- | -- |
| `user_agent` | `text` | YES | -- | -- |

**Note**: No foreign key on `admin_user_id` to `auth.users`. This is intentional for audit immutability (user deletion should not cascade to audit records).

---

### 2.10 `package_definitions`

**Purpose**: Package tier configuration
**Row Count**: 4
**RLS**: Enabled

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `tier` | `integer` | NO | -- | **PK**, CHECK `IN (10, 20, 30, 40)` |
| `quota_videos` | `integer` | NO | -- | CHECK `> 0` |
| `monthly_credits` | `numeric` | NO | `0` | -- |
| `created_at` | `timestamptz` | NO | `timezone('utc', now())` | -- |
| `updated_at` | `timestamptz` | NO | `timezone('utc', now())` | -- |

**CHECK Constraints**:
- `package_definitions_tier_check`: `tier = ANY (ARRAY[10, 20, 30, 40])`
- `package_definitions_quota_videos_check`: `quota_videos > 0`

---

### 2.11 `mix_definitions`

**Purpose**: Video type distribution per mix
**Row Count**: 4
**RLS**: Enabled

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `name` | `text` | NO | -- | **PK**, CHECK `IN ('VOLUME','EQUILIBRE','PREMIUM_80S','TRANSFO_HEAVY')` |
| `distribution` | `jsonb` | NO | -- | -- |
| `positioning` | `text` | YES | -- | -- |
| `created_at` | `timestamptz` | NO | `timezone('utc', now())` | -- |
| `updated_at` | `timestamptz` | NO | `timezone('utc', now())` | -- |

**CHECK Constraints**:
- `mix_definitions_name_check`: `name = ANY (ARRAY['VOLUME','EQUILIBRE','PREMIUM_80S','TRANSFO_HEAVY'])`

---

### 2.12 `video_rates`

**Purpose**: Per-video-type payout rates
**Row Count**: 5
**RLS**: Enabled

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `video_type` | `text` | NO | -- | **PK**, CHECK (video type enum) |
| `rate_per_video` | `numeric` | NO | -- | CHECK `>= 0` |
| `is_placeholder` | `boolean` | NO | `false` | -- |
| `created_at` | `timestamptz` | NO | `timezone('utc', now())` | -- |
| `updated_at` | `timestamptz` | NO | `timezone('utc', now())` | -- |

**CHECK Constraints**:
- `video_rates_video_type_check`: `video_type = ANY (ARRAY['OOTD','TRAINING','BEFORE_AFTER','SPORTS_80S','CINEMATIC'])`
- `video_rates_rate_per_video_check`: `rate_per_video >= 0`

---

### Row Count Summary

| Table | Rows |
|---|---|
| `admin_audit_log` | 18 |
| `creator_applications` | 1 |
| `creator_contract_signatures` | 1 |
| `creator_payout_profiles` | 0 |
| `creators` | 1 |
| `mix_definitions` | 4 |
| `monthly_tracking` | 1 |
| `onboarding_drafts` | 0 |
| `package_definitions` | 4 |
| `rushes` | 0 |
| `video_rates` | 5 |
| `videos` | 0 |
| `auth.users` | 6 |

---

## 3. RLS Policies

### 3.1 `admin_audit_log` Policies

| Policy Name | Operation | Roles | USING | WITH CHECK |
|---|---|---|---|---|
| `Admins read audit log` | SELECT | `{authenticated}` | `COALESCE(((SELECT auth.jwt()) -> 'app_metadata' ->> 'role'), '') = 'admin'` | -- |
| `Service insert audit log` | INSERT | `{authenticated}` | -- | `true` |

**Analysis**: SELECT is admin-only (good). INSERT allows any authenticated user (relies on service_role bypass for actual inserts). No UPDATE or DELETE policies exist, enforcing immutability via RLS.

---

### 3.2 `creator_applications` Policies

| Policy Name | Operation | Roles | USING | WITH CHECK |
|---|---|---|---|---|
| `Creator applications read own` | SELECT | `{public}` | `(SELECT auth.uid()) = user_id` | -- |
| `Creator applications insert own` | INSERT | `{public}` | -- | `(SELECT auth.uid()) = user_id` |
| `Creator applications update own` | UPDATE | `{public}` | `(SELECT auth.uid()) = user_id` | `(SELECT auth.uid()) = user_id` |

**Analysis**: Uses initplan optimization `(SELECT auth.uid())`. Role is `public` (covers both anon and authenticated). No DELETE policy. No admin-specific policies (admin uses service_role).

---

### 3.3 `creator_contract_signatures` Policies

| Policy Name | Operation | Roles | USING | WITH CHECK |
|---|---|---|---|---|
| `Authenticated read contract signatures` | SELECT | `{authenticated}` | `COALESCE(((SELECT auth.jwt()) -> 'app_metadata' ->> 'role'), '') = 'admin' OR user_id = (SELECT auth.uid())` | -- |
| `Authenticated insert contract signatures` | INSERT | `{authenticated}` | -- | `user_id = (SELECT auth.uid())` |

**Analysis**: Read allows admin OR own user. Insert restricted to own user_id. No UPDATE or DELETE policies (contracts are immutable).

---

### 3.4 `creator_payout_profiles` Policies

| Policy Name | Operation | Roles | USING | WITH CHECK |
|---|---|---|---|---|
| `Admins read all payout profiles` | SELECT | `{authenticated}` | `COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'` | -- |
| `Payout profiles read own` | SELECT | `{authenticated}` | `EXISTS (SELECT 1 FROM creators c WHERE c.id = creator_payout_profiles.creator_id AND (c.user_id = auth.uid() OR lower(c.email) = lower(COALESCE(auth.jwt() ->> 'email', ''))))` | -- |
| `Payout profiles insert own` | INSERT | `{authenticated}` | -- | Same EXISTS subquery |
| `Payout profiles update own` | UPDATE | `{authenticated}` | Same EXISTS subquery | Same EXISTS subquery |

**IMPORTANT NOTE**: The "Admins read all payout profiles" and "Payout profiles read/insert/update own" policies do NOT use the `(SELECT ...)` initplan optimization for `auth.jwt()` and `auth.uid()`. This means these functions are re-evaluated per row instead of once per query, which is a performance concern.

---

### 3.5 `creators` Policies

| Policy Name | Operation | Roles | USING | WITH CHECK |
|---|---|---|---|---|
| `Authenticated read creators` | SELECT | `{authenticated}` | `COALESCE(((SELECT auth.jwt()) -> 'app_metadata' ->> 'role'), '') = 'admin' OR user_id = (SELECT auth.uid()) OR lower(email) = lower(COALESCE((SELECT auth.jwt()) ->> 'email', ''))` | -- |

**Analysis**: Only SELECT policy exists. No INSERT, UPDATE, or DELETE policies via RLS. All write operations go through service_role. Uses initplan optimization. Email fallback matching via `lower()` comparison for backward compatibility.

---

### 3.6 `mix_definitions` Policies

| Policy Name | Operation | Roles | USING | WITH CHECK |
|---|---|---|---|---|
| `Authenticated read mix definitions` | SELECT | `{authenticated}` | `true` | -- |
| `Admins update mix definitions` | UPDATE | `{authenticated}` | Admin JWT check with initplan | Admin JWT check with initplan |

**Analysis**: All authenticated users can read. Only admins can update. No INSERT or DELETE policies (reference data is managed via migrations or service_role).

---

### 3.7 `monthly_tracking` Policies

| Policy Name | Operation | Roles | USING | WITH CHECK |
|---|---|---|---|---|
| `Authenticated read monthly tracking` | SELECT | `{authenticated}` | `COALESCE(((SELECT auth.jwt()) -> 'app_metadata' ->> 'role'), '') = 'admin' OR EXISTS (SELECT 1 FROM creators c WHERE c.id = monthly_tracking.creator_id AND (c.user_id = (SELECT auth.uid()) OR lower(c.email) = lower(COALESCE((SELECT auth.jwt()) ->> 'email', ''))))` | -- |

**Analysis**: Only SELECT policy. Admin OR own creator (via user_id or email). Uses initplan optimization. All writes go through service_role.

---

### 3.8 `onboarding_drafts` Policies

| Policy Name | Operation | Roles | USING | WITH CHECK |
|---|---|---|---|---|
| `Onboarding drafts read own` | SELECT | `{public}` | `auth.uid() = user_id` | -- |
| `Onboarding drafts insert own` | INSERT | `{public}` | -- | `auth.uid() = user_id` |
| `Onboarding drafts update own` | UPDATE | `{public}` | `auth.uid() = user_id` | `auth.uid() = user_id` |
| `Onboarding drafts delete own` | DELETE | `{public}` | `auth.uid() = user_id` | -- |

**Analysis**: Full CRUD scoped to own user. Uses direct `auth.uid()` (NO initplan optimization). Role is `public`.

---

### 3.9 `package_definitions` Policies

| Policy Name | Operation | Roles | USING | WITH CHECK |
|---|---|---|---|---|
| `Authenticated read package definitions` | SELECT | `{authenticated}` | `true` | -- |
| `Admins update package definitions` | UPDATE | `{authenticated}` | Admin JWT check with initplan | Admin JWT check with initplan |

**Analysis**: Same pattern as mix_definitions. All authenticated can read, admin-only update.

---

### 3.10 `rushes` Policies

| Policy Name | Operation | Roles | USING | WITH CHECK |
|---|---|---|---|---|
| `Authenticated read rushes` | SELECT | `{authenticated}` | Admin OR own creator (via EXISTS subquery with initplan) | -- |

**Analysis**: SELECT-only. Same pattern as monthly_tracking and videos.

---

### 3.11 `video_rates` Policies

| Policy Name | Operation | Roles | USING | WITH CHECK |
|---|---|---|---|---|
| `Authenticated read video rates` | SELECT | `{authenticated}` | `true` | -- |
| `Admins update video rates` | UPDATE | `{authenticated}` | Admin JWT check with initplan | Admin JWT check with initplan |

**Analysis**: Same pattern as mix_definitions and package_definitions.

---

### 3.12 `videos` Policies

| Policy Name | Operation | Roles | USING | WITH CHECK |
|---|---|---|---|---|
| `Authenticated read videos` | SELECT | `{authenticated}` | Admin OR own creator (via EXISTS subquery with initplan) | -- |

**Analysis**: SELECT-only. Same pattern as rushes and monthly_tracking.

---

## 4. Storage Policies

All policies are on `storage.objects`:

| Policy Name | Operation | Roles | USING/WITH CHECK |
|---|---|---|---|
| `Admins can read all storage objects` | SELECT | `{authenticated}` | `COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'` |
| `Creators can read own videos` | SELECT | `{authenticated}` | `bucket_id = 'videos' AND (storage.foldername(name))[1] = auth.uid()::text` |
| `Creators can read own rushes` | SELECT | `{authenticated}` | `bucket_id = 'rushes' AND (storage.foldername(name))[1] = auth.uid()::text` |
| `Creators can upload own videos` | INSERT | `{authenticated}` | WITH CHECK: `bucket_id = 'videos' AND (storage.foldername(name))[1] = auth.uid()::text` |
| `Creators can upload own rushes` | INSERT | `{authenticated}` | WITH CHECK: `bucket_id = 'rushes' AND (storage.foldername(name))[1] = auth.uid()::text` |
| `Creators can update own videos` | UPDATE | `{authenticated}` | USING + WITH CHECK: `bucket_id = 'videos' AND (storage.foldername(name))[1] = auth.uid()::text` |
| `Creators can update own rushes` | UPDATE | `{authenticated}` | USING + WITH CHECK: `bucket_id = 'rushes' AND (storage.foldername(name))[1] = auth.uid()::text` |
| `Creators can delete own videos` | DELETE | `{authenticated}` | `bucket_id = 'videos' AND (storage.foldername(name))[1] = auth.uid()::text` |
| `Creators can delete own rushes` | DELETE | `{authenticated}` | `bucket_id = 'rushes' AND (storage.foldername(name))[1] = auth.uid()::text` |

**Analysis**: Storage is folder-scoped by `auth.uid()`. Creators can only access files in their own `userId/` prefix. Admins can read all objects but have no explicit INSERT/UPDATE/DELETE storage policies (admin file operations use service_role). Storage admin policies do NOT use initplan optimization.

---

## 5. Indexes

### 5.1 `admin_audit_log`

| Index Name | Columns | Unique | Type |
|---|---|---|---|
| `admin_audit_log_pkey` | `(id)` | YES | btree |
| `idx_admin_audit_log_action` | `(action)` | NO | btree |
| `idx_admin_audit_log_created_at` | `(created_at DESC)` | NO | btree |
| `idx_admin_audit_log_entity` | `(entity_type, entity_id)` | NO | btree |

### 5.2 `creator_applications`

| Index Name | Columns | Unique | Type |
|---|---|---|---|
| `creator_applications_pkey` | `(id)` | YES | btree |
| `creator_applications_user_id_key` | `(user_id)` | YES | btree |
| `idx_creator_applications_status` | `(status)` | NO | btree |
| `idx_creator_applications_submitted_at` | `(submitted_at)` | NO | btree |
| `idx_creator_applications_package_tier` | `(package_tier)` | NO | btree |
| `idx_creator_applications_mix_name` | `(mix_name)` | NO | btree |

### 5.3 `creator_contract_signatures`

| Index Name | Columns | Unique | Type |
|---|---|---|---|
| `creator_contract_signatures_pkey` | `(id)` | YES | btree |
| `creator_contract_signatures_user_checksum_unique` | `(user_id, contract_checksum)` | YES | btree |
| `creator_contract_signatures_creator_id_idx` | `(creator_id)` | NO | btree |
| `creator_contract_signatures_user_id_idx` | `(user_id)` | NO | btree |

### 5.4 `creator_payout_profiles`

| Index Name | Columns | Unique | Type |
|---|---|---|---|
| `creator_payout_profiles_pkey` | `(creator_id)` | YES | btree |
| `idx_creator_payout_profiles_method` | `(method)` | NO | btree |

### 5.5 `creators`

| Index Name | Columns | Unique | Type |
|---|---|---|---|
| `creators_pkey` | `(id)` | YES | btree |
| `creators_handle_key` | `(handle)` | YES | btree |
| `creators_email_key` | `(email)` | YES | btree |
| `creators_user_id_key` | `(user_id)` | YES | btree |
| `idx_creators_user_id` | `(user_id)` | NO | btree |
| `idx_creators_package_tier` | `(package_tier)` | NO | btree |
| `idx_creators_default_mix` | `(default_mix)` | NO | btree |

**REDUNDANCY**: `idx_creators_user_id` is redundant with `creators_user_id_key` (unique index already provides the same btree lookup). This index should be dropped.

### 5.6 `mix_definitions`

| Index Name | Columns | Unique | Type |
|---|---|---|---|
| `mix_definitions_pkey` | `(name)` | YES | btree |

### 5.7 `monthly_tracking`

| Index Name | Columns | Unique | Type |
|---|---|---|---|
| `monthly_tracking_pkey` | `(id)` | YES | btree |
| `monthly_tracking_month_creator_id_key` | `(month, creator_id)` | YES | btree |
| `idx_monthly_tracking_creator_id` | `(creator_id)` | NO | btree |
| `idx_monthly_tracking_month` | `(month)` | NO | btree |
| `idx_monthly_tracking_package_tier` | `(package_tier)` | NO | btree |
| `idx_monthly_tracking_mix_name` | `(mix_name)` | NO | btree |

**NOTE**: `idx_monthly_tracking_month` is partially redundant with `monthly_tracking_month_creator_id_key` for queries filtering by month alone, since a composite index on `(month, creator_id)` can serve prefix lookups on `month`. However, the separate index is slightly more efficient for month-only scans (no creator_id overhead). Acceptable at current scale.

### 5.8 `onboarding_drafts`

| Index Name | Columns | Unique | Type |
|---|---|---|---|
| `onboarding_drafts_pkey` | `(id)` | YES | btree |
| `onboarding_drafts_user_id_key` | `(user_id)` | YES | btree |

### 5.9 `package_definitions`

| Index Name | Columns | Unique | Type |
|---|---|---|---|
| `package_definitions_pkey` | `(tier)` | YES | btree |

### 5.10 `rushes`

| Index Name | Columns | Unique | Type |
|---|---|---|---|
| `rushes_pkey` | `(id)` | YES | btree |
| `idx_rushes_tracking_id` | `(monthly_tracking_id)` | NO | btree |
| `idx_rushes_creator_id` | `(creator_id)` | NO | btree |

### 5.11 `video_rates`

| Index Name | Columns | Unique | Type |
|---|---|---|---|
| `video_rates_pkey` | `(video_type)` | YES | btree |

### 5.12 `videos`

| Index Name | Columns | Unique | Type |
|---|---|---|---|
| `videos_pkey` | `(id)` | YES | btree |
| `idx_videos_tracking_id` | `(monthly_tracking_id)` | NO | btree |
| `idx_videos_creator_id` | `(creator_id)` | NO | btree |
| `idx_videos_status` | `(status)` | NO | btree |

### 5.13 `storage.objects` (for reference)

| Index Name | Columns | Unique | Type |
|---|---|---|---|
| `objects_pkey` | `(id)` | YES | btree |
| `bucketid_objname` | `(bucket_id, name)` | YES | btree |
| `idx_objects_bucket_id_name` | `(bucket_id, name COLLATE "C")` | NO | btree |
| `idx_objects_bucket_id_name_lower` | `(bucket_id, lower(name) COLLATE "C")` | NO | btree |
| `name_prefix_search` | `(name text_pattern_ops)` | NO | btree |

---

## 6. Triggers

All triggers are BEFORE UPDATE triggers that call `touch_updated_at()`:

| Table | Trigger Name | Timing | Event | Function |
|---|---|---|---|---|
| `creator_applications` | `trg_creator_applications_updated_at` | BEFORE | UPDATE | `touch_updated_at()` |
| `creator_payout_profiles` | `trg_creator_payout_profiles_updated_at` | BEFORE | UPDATE | `touch_updated_at()` |
| `creators` | `trg_creators_updated_at` | BEFORE | UPDATE | `touch_updated_at()` |
| `mix_definitions` | `trg_mix_definitions_updated_at` | BEFORE | UPDATE | `touch_updated_at()` |
| `monthly_tracking` | `trg_monthly_tracking_updated_at` | BEFORE | UPDATE | `touch_updated_at()` |
| `onboarding_drafts` | `trg_onboarding_drafts_updated_at` | BEFORE | UPDATE | `touch_updated_at()` |
| `package_definitions` | `trg_package_definitions_updated_at` | BEFORE | UPDATE | `touch_updated_at()` |
| `video_rates` | `trg_video_rates_updated_at` | BEFORE | UPDATE | `touch_updated_at()` |

### Tables WITHOUT `updated_at` triggers

- `admin_audit_log` -- intentional, immutable audit trail
- `videos` -- **MISSING**: has no `updated_at` column at all, but status changes via `reviewed_at`
- `rushes` -- has no `updated_at` column (only `created_at`)
- `creator_contract_signatures` -- has no `updated_at` column (immutable records)

---

## 7. Functions

### 7.1 `public.touch_updated_at()`

```sql
CREATE OR REPLACE FUNCTION public.touch_updated_at()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $function$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$function$
```

**Analysis**: Properly sets `search_path` to `'public'` (security best practice to prevent search_path injection). Uses UTC timezone consistently.

This is the ONLY custom function in the `public` schema.

---

## 8. Storage Buckets

| Bucket ID | Name | Public | File Size Limit | Allowed MIME Types | Created |
|---|---|---|---|---|---|
| `rushes` | `rushes` | **false** | 2,000,000,000 bytes (~1.86 GB) | `video/mp4`, `video/quicktime` | 2026-02-05 |
| `videos` | `videos` | **false** | 629,145,600 bytes (~600 MB) | `video/mp4`, `video/quicktime` | 2026-02-05 |

**Analysis**:
- Both buckets are private (not publicly accessible).
- MIME type restrictions are appropriate for video content.
- File size limits: `rushes` allows up to ~1.86 GB (raw footage is larger), `videos` allows up to ~600 MB (final cuts).
- Objects count: 3 total in `storage.objects`.

---

## 9. Migrations

| Version | Name | Date (from version) |
|---|---|---|
| `20260204122000` | `create_ugc_platform_schema` | 2026-02-04 12:20 |
| `20260204123000` | `seed_ugc_reference_and_demo_data` | 2026-02-04 12:30 |
| `20260204124500` | `create_creator_applications` | 2026-02-04 12:45 |
| `20260205131725` | `add_core_rls_policies` | 2026-02-05 13:17 |
| `20260205133951` | `fix_touch_updated_at_search_path` | 2026-02-05 13:39 |
| `20260205134203` | `add_creators_user_id_mapping` | 2026-02-05 13:42 |
| `20260205151258` | `create_storage_buckets_and_policies` | 2026-02-05 15:12 |
| `20260205173412` | `add_indexes_and_merge_read_policies` | 2026-02-05 17:34 |
| `20260205174002` | `optimize_rls_initplan` | 2026-02-05 17:40 |
| `20260205190000` | `optimize_rls_initplan_auth_jwt` | 2026-02-05 19:00 |
| `20260205200000` | `create_admin_audit_log` | 2026-02-05 20:00 |
| `20260206173452` | `create_contract_signatures` | 2026-02-06 17:34 |
| `20260211232437` | `create_creator_payout_profiles` | 2026-02-11 23:24 |
| `20260211233150` | `create_onboarding_drafts` | 2026-02-11 23:31 |
| `20260212143830` | `remove_demo_seed_data` | 2026-02-12 14:38 |
| `20260215181217` | `add_admin_write_policies_config_tables` | 2026-02-15 18:12 |

**Total**: 16 migrations over 11 days (2026-02-04 to 2026-02-15).

**Migration Narrative**:
1. Initial schema creation with all core tables
2. Seed data for reference tables + demo data
3. Creator applications table added
4. Core RLS policies added
5. Security fix: `search_path` set on `touch_updated_at`
6. `user_id` column added to `creators` for auth mapping
7. Storage buckets and policies created
8. Performance indexes added, RLS read policies merged/consolidated
9. RLS initplan optimization (wrapping `auth.uid()` in `SELECT`)
10. Further initplan optimization for `auth.jwt()` calls
11. Admin audit log table created
12. Contract signatures table created
13. Creator payout profiles table created
14. Onboarding drafts table created
15. Demo seed data removed
16. Admin write policies added for config tables

---

## 10. Reference Data

### 10.1 `package_definitions`

| Tier | Quota Videos | Monthly Credits |
|---|---|---|
| 10 | 10 | 0.00 |
| 20 | 20 | 25.00 |
| 30 | 30 | 38.00 |
| 40 | 40 | 50.00 |

### 10.2 `mix_definitions`

| Name | Distribution | Positioning |
|---|---|---|
| **VOLUME** | `{"OOTD": 0.4, "TRAINING": 0.35, "CINEMATIC": 0.05, "SPORTS_80S": 0, "BEFORE_AFTER": 0.2}` | Max volume performance. Direction artistique minimale. |
| **EQUILIBRE** | `{"OOTD": 0.3, "TRAINING": 0.3, "CINEMATIC": 0.05, "SPORTS_80S": 0.1, "BEFORE_AFTER": 0.25}` | Mix equilibre performance + image de marque. |
| **PREMIUM_80S** | `{"OOTD": 0.2, "TRAINING": 0.25, "CINEMATIC": 0.15, "SPORTS_80S": 0.2, "BEFORE_AFTER": 0.2}` | Direction artistique forte, cout creatif plus eleve. |
| **TRANSFO_HEAVY** | `{"OOTD": 0.2, "TRAINING": 0.25, "CINEMATIC": 0.05, "SPORTS_80S": 0.1, "BEFORE_AFTER": 0.4}` | Focus transformations Before/After. |

**Verification**: All distributions sum to 1.0 (checked).

### 10.3 `video_rates`

| Video Type | Rate Per Video | Is Placeholder |
|---|---|---|
| OOTD | 100.00 | false |
| TRAINING | 95.00 | false |
| BEFORE_AFTER | 120.00 | false |
| SPORTS_80S | 140.00 | false |
| CINEMATIC | 180.00 | false |

**Note**: All rates have `is_placeholder = false`, meaning they are finalized production rates. TRAINING was last updated 2026-02-15, others on 2026-02-12 or earlier.

---

## 11. Entity Relationship Diagram

```
                                    +-------------------+
                                    |    auth.users      |
                                    |-------------------|
                                    | id (PK)           |
                                    | email             |
                                    | ...               |
                                    +--------+----------+
                                             |
                   +-------------------------+---------------------------+----------------+
                   | ON DELETE CASCADE        | ON DELETE SET NULL        | ON DELETE CASCADE| ON DELETE CASCADE
                   v                          v                          v                v
        +---------------------+    +------------------+    +---------------------------+  +------------------+
        | creator_applications|    |     creators     |    | creator_contract_signatures|  | onboarding_drafts|
        |---------------------|    |------------------|    |---------------------------|  |------------------|
        | id (PK)             |    | id (PK)          |    | id (PK)                   |  | id (PK)          |
        | user_id (FK,UNIQUE) |    | user_id (FK,UQ)  |    | creator_id (FK)           |  | user_id (FK,UQ)  |
        | status              |    | handle (UQ)      |    | user_id (FK)              |  | form_data (JSONB)|
        | handle              |    | display_name     |    | contract_version          |  | step             |
        | full_name           |    | email (UQ)       |    | contract_checksum         |  +------------------+
        | email               |    | whatsapp         |    | contract_text             |
        | package_tier (FK)---+--->| package_tier(FK) |    | signer_name               |
        | mix_name (FK)-------+--->| default_mix (FK) |    | acceptance (JSONB)        |
        | ...                 |    | status           |    | ip, user_agent            |
        +---------------------+    | social_links(JSON)|    | signed_at                |
                                   | start_date       |    +---------------------------+
                                   | contract_signed_at|           ^
                                   | notes            |           | ON DELETE CASCADE
                                   +--------+---------+           |
                                            |                     |
              +-----------------------------+-----------------------------+
              | ON DELETE CASCADE            | ON DELETE CASCADE           | ON DELETE CASCADE
              v                             v                             v
   +----------------------+    +------------------------+    +---------------------------+
   |  monthly_tracking    |    | creator_payout_profiles|    |        (see above)        |
   |----------------------|    |------------------------|    +---------------------------+
   | id (PK)              |    | creator_id (PK,FK)     |
   | month                |    | method                 |
   | creator_id (FK)      |    | account_holder_name    |
   | package_tier (FK)    |    | iban                   |
   | quota_total          |    | paypal_email           |
   | mix_name (FK)        |    | stripe_account         |
   | quotas (JSONB)       |    +------------------------+
   | delivered (JSONB)    |
   | deadline             |
   | payment_status       |
   | paid_at              |
   +---------+------------+
             |
    +--------+--------+
    | ON DELETE CASCADE| ON DELETE CASCADE
    v                  v
+----------+    +---------+
|  videos  |    |  rushes |
|----------|    |---------|
| id (PK)  |    | id (PK) |
| mt_id(FK)|    | mt_id(FK|
| cr_id(FK)|    | cr_id(FK|
| video_type|   | file_name|
| file_url |    | file_url|
| duration |    | file_mb |
| resolution|   +---------+
| file_mb  |
| status   |
| rej_reason|
| reviewed_at|
| reviewed_by|
+----------+

  +--------------------+     +-------------------+     +--------------+
  | package_definitions|     |  mix_definitions  |     |  video_rates |
  |--------------------|     |-------------------|     |--------------|
  | tier (PK)          |<----| name (PK)         |     | video_type(PK|
  | quota_videos       |     | distribution(JSON)|     | rate_per_video|
  | monthly_credits    |     | positioning       |     | is_placeholder|
  +--------------------+     +-------------------+     +--------------+
        ^                           ^
        | (referenced by)           | (referenced by)
        +--creators.package_tier    +--creators.default_mix
        +--monthly_tracking.package_tier  +--monthly_tracking.mix_name
        +--creator_applications.package_tier  +--creator_applications.mix_name

  +--------------------+
  |  admin_audit_log   |
  |--------------------|
  | id (PK)            |
  | admin_user_id      |  (NO FK to auth.users -- intentional)
  | action             |
  | entity_type        |
  | entity_id          |
  | metadata (JSONB)   |
  | request_id         |
  | ip, user_agent     |
  +--------------------+
```

### Foreign Key Summary

| Source Table | Column | Target Table | Column | ON DELETE |
|---|---|---|---|---|
| `creators` | `user_id` | `auth.users` | `id` | **SET NULL** |
| `creators` | `package_tier` | `package_definitions` | `tier` | NO ACTION |
| `creators` | `default_mix` | `mix_definitions` | `name` | NO ACTION |
| `creator_applications` | `user_id` | `auth.users` | `id` | **CASCADE** |
| `creator_applications` | `package_tier` | `package_definitions` | `tier` | NO ACTION |
| `creator_applications` | `mix_name` | `mix_definitions` | `name` | NO ACTION |
| `creator_contract_signatures` | `creator_id` | `creators` | `id` | **CASCADE** |
| `creator_contract_signatures` | `user_id` | `auth.users` | `id` | **CASCADE** |
| `creator_payout_profiles` | `creator_id` | `creators` | `id` | **CASCADE** |
| `monthly_tracking` | `creator_id` | `creators` | `id` | **CASCADE** |
| `monthly_tracking` | `package_tier` | `package_definitions` | `tier` | NO ACTION |
| `monthly_tracking` | `mix_name` | `mix_definitions` | `name` | NO ACTION |
| `onboarding_drafts` | `user_id` | `auth.users` | `id` | **CASCADE** |
| `rushes` | `monthly_tracking_id` | `monthly_tracking` | `id` | **CASCADE** |
| `rushes` | `creator_id` | `creators` | `id` | **CASCADE** |
| `videos` | `monthly_tracking_id` | `monthly_tracking` | `id` | **CASCADE** |
| `videos` | `creator_id` | `creators` | `id` | **CASCADE** |

---

## 12. Security Analysis

### 12.1 RLS Coverage Matrix

| Table | SELECT | INSERT | UPDATE | DELETE | Assessment |
|---|---|---|---|---|---|
| `admin_audit_log` | Admin only | `true` (any authenticated) | NONE | NONE | See finding S-01 |
| `creator_applications` | Own (public) | Own (public) | Own (public) | NONE | See finding S-02 |
| `creator_contract_signatures` | Admin+Own | Own | NONE | NONE | Good (immutable) |
| `creator_payout_profiles` | Admin+Own | Own | Own | NONE | See finding S-03 |
| `creators` | Admin+Own+email | NONE | NONE | NONE | Writes via service_role |
| `mix_definitions` | All authenticated | NONE | Admin only | NONE | Good |
| `monthly_tracking` | Admin+Own | NONE | NONE | NONE | Writes via service_role |
| `onboarding_drafts` | Own (public) | Own (public) | Own (public) | Own (public) | Good |
| `package_definitions` | All authenticated | NONE | Admin only | NONE | Good |
| `rushes` | Admin+Own | NONE | NONE | NONE | Writes via service_role |
| `video_rates` | All authenticated | NONE | Admin only | NONE | Good |
| `videos` | Admin+Own | NONE | NONE | NONE | Writes via service_role |

### 12.2 Security Findings

#### S-01: CRITICAL -- `admin_audit_log` INSERT allows ANY authenticated user

**Policy**: `Service insert audit log` has `WITH CHECK (true)` for role `authenticated`.

**Impact**: Any authenticated user (including regular creators) can insert arbitrary records into the audit log via the PostgREST/Supabase client API. This could be used to:
- Flood the audit log with fake entries
- Inject misleading audit records to cover tracks
- Fill storage with junk data

**Recommendation**: Change to `WITH CHECK (false)` or remove the INSERT policy entirely. All audit inserts happen via service_role (which bypasses RLS), so this policy serves no legitimate purpose. Alternatively, restrict to a custom claim or remove the policy.

```sql
-- Fix: Remove the overly permissive INSERT policy
DROP POLICY "Service insert audit log" ON admin_audit_log;
-- If needed for service_role, it already bypasses RLS
```

#### S-02: MEDIUM -- `creator_applications` has no DELETE policy but has no protection against status regression

**Current state**: Creators can UPDATE their own applications (status check is in application code, not RLS). A malicious creator could potentially set their status back to `draft` or change `reviewed_at` fields via direct Supabase client calls.

**Recommendation**: Add column-level restrictions in the UPDATE policy or add a CHECK constraint that prevents status regression:

```sql
-- Option: RLS with column restriction via WITH CHECK
CREATE POLICY "..." ON creator_applications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND status IN ('draft', 'pending_review'));
```

#### S-03: MEDIUM -- `creator_payout_profiles` policies lack initplan optimization

**Impact**: The `creator_payout_profiles` RLS policies call `auth.uid()` and `auth.jwt()` directly (not wrapped in `SELECT`). While functionally correct, this causes per-row function evaluation instead of per-query evaluation. At scale, this will cause performance degradation.

**Recommendation**: Rewrite policies with initplan pattern:
```sql
-- Before (current):
c.user_id = auth.uid()
-- After (optimized):
c.user_id = (SELECT auth.uid())
```

#### S-04: MEDIUM -- `onboarding_drafts` policies lack initplan optimization

**Impact**: Same as S-03. The `onboarding_drafts` policies use direct `auth.uid()` calls instead of `(SELECT auth.uid())`.

#### S-05: LOW -- Redundant index `idx_creators_user_id`

**Current**: Both `creators_user_id_key` (unique) and `idx_creators_user_id` (non-unique) exist on `creators.user_id`. The unique index already serves all lookup purposes.

**Recommendation**: Drop the redundant index:
```sql
DROP INDEX idx_creators_user_id;
```

#### S-06: LOW -- Missing `lower(email)` index for RLS email fallback

**Impact**: Multiple RLS policies on `creators`, `monthly_tracking`, `videos`, `rushes`, and `creator_payout_profiles` use `lower(c.email) = lower(COALESCE(...))` in EXISTS subqueries. The `creators_email_key` unique index is on `email` (case-sensitive), not `lower(email)`, so these comparisons cannot use the index.

**Recommendation**: Add a functional index:
```sql
CREATE INDEX idx_creators_email_lower ON creators (lower(email));
```

At current scale (1 row), this is irrelevant. At scale (1000+ creators), this will matter.

#### S-07: LOW -- `admin_audit_log.admin_user_id` has no FK constraint

**Status**: Intentionally omitted. The audit log should not be affected by user deletion. This is correct design for an immutable audit trail.

#### S-08: LOW -- `videos.reviewed_by` has no FK constraint to `auth.users`

**Impact**: There is no referential integrity check on who reviewed a video. If a user is deleted from `auth.users`, the `reviewed_by` UUID becomes a dangling reference.

**Recommendation**: Accept as-is (similar rationale to audit log -- review history should survive user deletion) or add FK with ON DELETE SET NULL.

#### S-09: INFO -- Excessive table-level grants to `anon` role

**Observation**: All public tables grant full privileges (DELETE, INSERT, SELECT, UPDATE, TRUNCATE, etc.) to the `anon` role. While RLS policies restrict actual access, the overly broad grants mean that if RLS is ever disabled on a table (accidentally or via migration bug), the `anon` role would have full access.

**Recommendation**: Revoke unnecessary grants from `anon` on tables that should only be accessed by `authenticated` users:
```sql
REVOKE ALL ON admin_audit_log FROM anon;
REVOKE ALL ON creator_contract_signatures FROM anon;
REVOKE ALL ON creator_payout_profiles FROM anon;
REVOKE ALL ON creators FROM anon;
REVOKE ALL ON monthly_tracking FROM anon;
REVOKE ALL ON rushes FROM anon;
REVOKE ALL ON video_rates FROM anon;
REVOKE ALL ON videos FROM anon;
```

Note: `creator_applications` and `onboarding_drafts` correctly use `public` role in their RLS policies, so `anon` access may be intentional for the sign-up flow.

#### S-10: INFO -- No JSONB schema validation on `quotas`/`delivered` columns

**Observation**: The `monthly_tracking.quotas` and `monthly_tracking.delivered` JSONB columns have no database-level validation. Malformed JSONB could be inserted (via service_role). The `pg_jsonschema` extension is available but not installed.

**Recommendation**: Either install `pg_jsonschema` and add CHECK constraints, or accept that validation is handled at the application layer (which it is, via `toVideoTypeCount()`).

#### S-11: INFO -- CASCADE delete chain depth

**Observation**: Deleting a `creators` row cascades to: `monthly_tracking` (which cascades to `videos` and `rushes`), `creator_contract_signatures`, `creator_payout_profiles`. This is a 3-level cascade depth. Deleting an `auth.users` row sets `creators.user_id` to NULL but cascades to `creator_applications`, `creator_contract_signatures`, and `onboarding_drafts`.

**Assessment**: The cascade behavior is well-designed:
- Creator deletion removes all associated business data (appropriate for GDPR compliance)
- Auth user deletion preserves creator records (SET NULL) for business continuity while removing personal auth data via cascades on other tables

#### S-12: MEDIUM -- Storage policies lack initplan optimization

**Observation**: Storage object policies use `auth.jwt()` and `auth.uid()` directly, not wrapped in `(SELECT ...)`. At scale with many storage objects, this could cause performance issues.

---

### 12.3 Privilege Audit Summary

| Role | Tables with Full Grants |
|---|---|
| `anon` | ALL 12 public tables (DELETE, INSERT, SELECT, UPDATE, REFERENCES, TRIGGER, TRUNCATE) |
| `authenticated` | ALL 12 public tables (same as anon) |
| `service_role` | ALL 12 public tables (same, bypasses RLS) |
| `postgres` | ALL 12 public tables (superuser) |

**Assessment**: The `anon` role having TRUNCATE and DELETE on all tables is concerning. Even with RLS enabled, this is a defense-in-depth failure. If RLS were accidentally disabled during a migration, an unauthenticated request could TRUNCATE production tables.

---

### 12.4 Security Recommendations Priority

| Priority | ID | Finding | Effort |
|---|---|---|---|
| **CRITICAL** | S-01 | Audit log INSERT policy allows any authenticated user | 5 min (drop policy) |
| **MEDIUM** | S-02 | Creator application status regression via direct UPDATE | 30 min |
| **MEDIUM** | S-03 | Payout profiles RLS missing initplan optimization | 15 min |
| **MEDIUM** | S-04 | Onboarding drafts RLS missing initplan optimization | 10 min |
| **MEDIUM** | S-12 | Storage policies missing initplan optimization | 15 min |
| **LOW** | S-05 | Redundant `idx_creators_user_id` index | 2 min |
| **LOW** | S-06 | Missing `lower(email)` functional index | 5 min |
| **LOW** | S-08 | `videos.reviewed_by` dangling reference possible | Accept |
| **INFO** | S-09 | Excessive `anon` role grants | 15 min |
| **INFO** | S-10 | No JSONB schema validation | Accept or 30 min |
| **INFO** | S-11 | CASCADE chain review | Accept (well-designed) |

---

## Appendix A: Table Grants Detail

Every public table has identical grants:

```
anon:          DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
authenticated: DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
postgres:      DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
service_role:  DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
```

## Appendix B: Auth Schema Stats

- **auth.users**: 6 rows
- **auth.sessions**: 8 rows
- **auth.refresh_tokens**: 8 rows
- **auth.identities**: 6 rows
- **auth.mfa_amr_claims**: 8 rows
- **auth.schema_migrations**: 74 rows (GoTrue internal)

---

*End of audit. Generated 2026-02-23 via live Supabase MCP inspection.*
