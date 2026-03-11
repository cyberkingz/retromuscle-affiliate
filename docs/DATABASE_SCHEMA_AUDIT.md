# RetroMuscle Database Schema Audit

**Date**: 2026-02-23
**Database**: Supabase PostgreSQL (hosted)
**Schema**: `public`

---

## Table of Contents

1. [Extensions](#1-extensions)
2. [Tables](#2-tables)
   - [package_definitions](#21-package_definitions)
   - [mix_definitions](#22-mix_definitions)
   - [video_rates](#23-video_rates)
   - [creators](#24-creators)
   - [monthly_tracking](#25-monthly_tracking)
   - [videos](#26-videos)
   - [rushes](#27-rushes)
   - [creator_applications](#28-creator_applications)
   - [creator_contract_signatures](#29-creator_contract_signatures)
   - [creator_payout_profiles](#210-creator_payout_profiles)
   - [onboarding_drafts](#211-onboarding_drafts)
   - [admin_audit_log](#212-admin_audit_log)
3. [Entity Relationship Diagram](#3-entity-relationship-diagram)
4. [RLS Policies](#4-rls-policies)
   - [Public Schema Policies](#41-public-schema-policies)
   - [Storage Policies](#42-storage-policies)
5. [Indexes](#5-indexes)
6. [Triggers](#6-triggers)
7. [Functions](#7-functions)
8. [Storage Buckets](#8-storage-buckets)
9. [Migrations History](#9-migrations-history)
10. [Reference Data](#10-reference-data)
11. [Security Observations](#11-security-observations)

---

## 1. Extensions

### Installed Extensions

| Extension | Schema | Version | Purpose |
|-----------|--------|---------|---------|
| `plpgsql` | pg_catalog | 1.0 | PL/pgSQL procedural language (default) |
| `pgcrypto` | extensions | 1.3 | Cryptographic functions (`gen_random_uuid()`) |
| `uuid-ossp` | extensions | 1.1 | UUID generation functions |
| `pg_graphql` | graphql | 1.5.11 | GraphQL support (Supabase built-in) |
| `pg_stat_statements` | extensions | 1.11 | Query performance statistics |
| `supabase_vault` | vault | 0.3.1 | Supabase secrets management |

**Note**: Many extensions are available but not installed (PostGIS, pgvector, pg_cron, etc.). Only the above are actively installed.

---

## 2. Tables

### 2.1 package_definitions

**Purpose**: Defines the 4 package tiers available to creators (10/20/30/40 videos/month).
**RLS**: Enabled | **Rows**: 4

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| `tier` | integer | NOT NULL | -- | **PK**, CHECK (tier IN (10, 20, 30, 40)) |
| `quota_videos` | integer | NOT NULL | -- | CHECK (quota_videos > 0) |
| `monthly_credits` | numeric(10,2) | NOT NULL | `0` | -- |
| `created_at` | timestamptz | NOT NULL | `timezone('utc', now())` | -- |
| `updated_at` | timestamptz | NOT NULL | `timezone('utc', now())` | -- |

**Primary Key**: `tier`
**Foreign Keys**: None (referenced by `creators`, `monthly_tracking`, `creator_applications`)

---

### 2.2 mix_definitions

**Purpose**: Defines the 4 content mix strategies with video type distribution percentages.
**RLS**: Enabled | **Rows**: 4

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| `name` | text | NOT NULL | -- | **PK**, CHECK (name IN ('VOLUME', 'EQUILIBRE', 'PREMIUM_80S', 'TRANSFO_HEAVY')) |
| `distribution` | jsonb | NOT NULL | -- | -- |
| `positioning` | text | NULL | -- | -- |
| `created_at` | timestamptz | NOT NULL | `timezone('utc', now())` | -- |
| `updated_at` | timestamptz | NOT NULL | `timezone('utc', now())` | -- |

**Primary Key**: `name`
**Foreign Keys**: None (referenced by `creators`, `monthly_tracking`, `creator_applications`)

**distribution JSONB schema**:
```json
{
  "OOTD": 0.4,
  "TRAINING": 0.35,
  "BEFORE_AFTER": 0.2,
  "SPORTS_80S": 0.0,
  "CINEMATIC": 0.05
}
```

---

### 2.3 video_rates

**Purpose**: Per-video-type payment rates (in EUR). Used for payout calculation.
**RLS**: Enabled | **Rows**: 5

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| `video_type` | text | NOT NULL | -- | **PK**, CHECK (video_type IN ('OOTD', 'TRAINING', 'BEFORE_AFTER', 'SPORTS_80S', 'CINEMATIC')) |
| `rate_per_video` | numeric(10,2) | NOT NULL | -- | CHECK (rate_per_video >= 0) |
| `is_placeholder` | boolean | NOT NULL | `false` | -- |
| `created_at` | timestamptz | NOT NULL | `timezone('utc', now())` | -- |
| `updated_at` | timestamptz | NOT NULL | `timezone('utc', now())` | -- |

**Primary Key**: `video_type`
**Foreign Keys**: None (standalone lookup table)

---

### 2.4 creators

**Purpose**: Core creator profiles. Central entity linking auth users to their UGC work.
**RLS**: Enabled | **Rows**: 1

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| `id` | uuid | NOT NULL | `gen_random_uuid()` | **PK** |
| `handle` | text | NOT NULL | -- | UNIQUE |
| `display_name` | text | NOT NULL | -- | -- |
| `email` | text | NOT NULL | -- | UNIQUE |
| `whatsapp` | text | NOT NULL | -- | -- |
| `country` | text | NOT NULL | -- | -- |
| `address` | text | NOT NULL | -- | -- |
| `followers` | integer | NOT NULL | `0` | -- |
| `social_links` | jsonb | NOT NULL | `'{}'::jsonb` | -- |
| `package_tier` | integer | NOT NULL | -- | FK -> `package_definitions.tier` |
| `default_mix` | text | NOT NULL | -- | FK -> `mix_definitions.name` |
| `status` | text | NOT NULL | -- | CHECK (status IN ('candidat', 'actif', 'pause', 'inactif')) |
| `start_date` | date | NOT NULL | -- | -- |
| `contract_signed_at` | timestamptz | NULL | -- | -- |
| `notes` | text | NULL | -- | -- |
| `created_at` | timestamptz | NOT NULL | `timezone('utc', now())` | -- |
| `updated_at` | timestamptz | NOT NULL | `timezone('utc', now())` | -- |
| `user_id` | uuid | NULL | -- | UNIQUE, FK -> `auth.users.id` ON DELETE SET NULL |

**Primary Key**: `id`
**Unique Constraints**: `handle`, `email`, `user_id`
**Foreign Keys**:
- `creators_package_tier_fkey`: `package_tier` -> `package_definitions(tier)`
- `creators_default_mix_fkey`: `default_mix` -> `mix_definitions(name)`
- `creators_user_id_fkey`: `user_id` -> `auth.users(id)` ON DELETE SET NULL

**Referenced By**: `monthly_tracking`, `videos`, `rushes`, `creator_contract_signatures`, `creator_payout_profiles`

---

### 2.5 monthly_tracking

**Purpose**: Monthly content production tracking per creator. Tracks quotas, deliveries, and payment status.
**RLS**: Enabled | **Rows**: 1

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| `id` | uuid | NOT NULL | `gen_random_uuid()` | **PK** |
| `month` | text | NOT NULL | -- | CHECK (month ~ '^[0-9]{4}-[0-9]{2}$') |
| `creator_id` | uuid | NOT NULL | -- | FK -> `creators.id` ON DELETE CASCADE |
| `package_tier` | integer | NOT NULL | -- | FK -> `package_definitions.tier` |
| `quota_total` | integer | NOT NULL | -- | CHECK (quota_total > 0) |
| `mix_name` | text | NOT NULL | -- | FK -> `mix_definitions.name` |
| `quotas` | jsonb | NOT NULL | -- | -- |
| `delivered` | jsonb | NOT NULL | -- | -- |
| `deadline` | date | NOT NULL | -- | -- |
| `payment_status` | text | NOT NULL | -- | CHECK (payment_status IN ('a_faire', 'en_cours', 'paye')) |
| `paid_at` | timestamptz | NULL | -- | -- |
| `created_at` | timestamptz | NOT NULL | `timezone('utc', now())` | -- |
| `updated_at` | timestamptz | NOT NULL | `timezone('utc', now())` | -- |

**Primary Key**: `id`
**Unique Constraints**: `(month, creator_id)` -- one tracking record per creator per month
**Foreign Keys**:
- `monthly_tracking_creator_id_fkey`: `creator_id` -> `creators(id)` ON DELETE CASCADE
- `monthly_tracking_package_tier_fkey`: `package_tier` -> `package_definitions(tier)`
- `monthly_tracking_mix_name_fkey`: `mix_name` -> `mix_definitions(name)`

**Referenced By**: `videos`, `rushes`

**quotas/delivered JSONB schema** (mirrors mix distribution as integer counts):
```json
{
  "OOTD": 8,
  "TRAINING": 7,
  "BEFORE_AFTER": 4,
  "SPORTS_80S": 0,
  "CINEMATIC": 1
}
```

---

### 2.6 videos

**Purpose**: Individual video deliverables uploaded by creators. Linked to monthly tracking periods.
**RLS**: Enabled | **Rows**: 0

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| `id` | uuid | NOT NULL | `gen_random_uuid()` | **PK** |
| `monthly_tracking_id` | uuid | NOT NULL | -- | FK -> `monthly_tracking.id` ON DELETE CASCADE |
| `creator_id` | uuid | NOT NULL | -- | FK -> `creators.id` ON DELETE CASCADE |
| `video_type` | text | NOT NULL | -- | CHECK (video_type IN ('OOTD', 'TRAINING', 'BEFORE_AFTER', 'SPORTS_80S', 'CINEMATIC')) |
| `file_url` | text | NOT NULL | -- | -- |
| `duration_seconds` | integer | NOT NULL | -- | CHECK (duration_seconds > 0) |
| `resolution` | text | NOT NULL | -- | CHECK (resolution IN ('1080x1920', '1080x1080')) |
| `file_size_mb` | integer | NOT NULL | -- | CHECK (file_size_mb > 0) |
| `status` | text | NOT NULL | -- | CHECK (status IN ('uploaded', 'pending_review', 'approved', 'rejected')) |
| `rejection_reason` | text | NULL | -- | -- |
| `reviewed_at` | timestamptz | NULL | -- | -- |
| `reviewed_by` | uuid | NULL | -- | -- |
| `created_at` | timestamptz | NOT NULL | `timezone('utc', now())` | -- |

**Primary Key**: `id`
**Foreign Keys**:
- `videos_monthly_tracking_id_fkey`: `monthly_tracking_id` -> `monthly_tracking(id)` ON DELETE CASCADE
- `videos_creator_id_fkey`: `creator_id` -> `creators(id)` ON DELETE CASCADE

**Note**: `reviewed_by` has no FK constraint to `auth.users` -- potential integrity issue.

---

### 2.7 rushes

**Purpose**: Raw video footage uploaded by creators (unedited source material).
**RLS**: Enabled | **Rows**: 0

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| `id` | uuid | NOT NULL | `gen_random_uuid()` | **PK** |
| `monthly_tracking_id` | uuid | NOT NULL | -- | FK -> `monthly_tracking.id` ON DELETE CASCADE |
| `creator_id` | uuid | NOT NULL | -- | FK -> `creators.id` ON DELETE CASCADE |
| `file_name` | text | NOT NULL | -- | -- |
| `file_size_mb` | integer | NOT NULL | -- | CHECK (file_size_mb > 0) |
| `file_url` | text | NULL | -- | -- |
| `created_at` | timestamptz | NOT NULL | `timezone('utc', now())` | -- |

**Primary Key**: `id`
**Foreign Keys**:
- `rushes_monthly_tracking_id_fkey`: `monthly_tracking_id` -> `monthly_tracking(id)` ON DELETE CASCADE
- `rushes_creator_id_fkey`: `creator_id` -> `creators(id)` ON DELETE CASCADE

---

### 2.8 creator_applications

**Purpose**: Onboarding applications submitted by prospective creators through the SaaS flow.
**RLS**: Enabled | **Rows**: 1

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| `id` | uuid | NOT NULL | `gen_random_uuid()` | **PK** |
| `user_id` | uuid | NOT NULL | -- | UNIQUE, FK -> `auth.users.id` ON DELETE CASCADE |
| `status` | text | NOT NULL | `'draft'` | CHECK (status IN ('draft', 'pending_review', 'approved', 'rejected')) |
| `handle` | text | NOT NULL | -- | -- |
| `full_name` | text | NOT NULL | -- | -- |
| `email` | text | NOT NULL | -- | -- |
| `whatsapp` | text | NOT NULL | -- | -- |
| `country` | text | NOT NULL | -- | -- |
| `address` | text | NOT NULL | -- | -- |
| `social_tiktok` | text | NULL | -- | -- |
| `social_instagram` | text | NULL | -- | -- |
| `followers` | integer | NOT NULL | `0` | CHECK (followers >= 0) |
| `portfolio_url` | text | NULL | -- | -- |
| `package_tier` | integer | NOT NULL | -- | FK -> `package_definitions.tier` |
| `mix_name` | text | NOT NULL | -- | FK -> `mix_definitions.name` |
| `submitted_at` | timestamptz | NULL | -- | -- |
| `reviewed_at` | timestamptz | NULL | -- | -- |
| `review_notes` | text | NULL | -- | -- |
| `created_at` | timestamptz | NOT NULL | `timezone('utc', now())` | -- |
| `updated_at` | timestamptz | NOT NULL | `timezone('utc', now())` | -- |

**Primary Key**: `id`
**Unique Constraints**: `user_id` (one application per auth user)
**Foreign Keys**:
- `creator_applications_user_id_fkey`: `user_id` -> `auth.users(id)` ON DELETE CASCADE
- `creator_applications_package_tier_fkey`: `package_tier` -> `package_definitions(tier)`
- `creator_applications_mix_name_fkey`: `mix_name` -> `mix_definitions(name)`

---

### 2.9 creator_contract_signatures

**Purpose**: Legal audit trail for contract signatures. Stores full contract text + acceptance metadata.
**RLS**: Enabled | **Rows**: 1

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| `id` | uuid | NOT NULL | `gen_random_uuid()` | **PK** |
| `creator_id` | uuid | NOT NULL | -- | FK -> `creators.id` ON DELETE CASCADE |
| `user_id` | uuid | NOT NULL | -- | FK -> `auth.users.id` ON DELETE CASCADE |
| `contract_version` | text | NOT NULL | -- | -- |
| `contract_checksum` | text | NOT NULL | -- | -- |
| `contract_text` | text | NOT NULL | -- | -- |
| `signer_name` | text | NOT NULL | -- | -- |
| `acceptance` | jsonb | NOT NULL | -- | -- |
| `ip` | inet | NULL | -- | -- |
| `user_agent` | text | NULL | -- | -- |
| `signed_at` | timestamptz | NOT NULL | `now()` | -- |
| `created_at` | timestamptz | NOT NULL | `now()` | -- |

**Primary Key**: `id`
**Unique Constraints**: `(user_id, contract_checksum)` -- prevents duplicate signatures for the same contract version
**Foreign Keys**:
- `creator_contract_signatures_creator_id_fkey`: `creator_id` -> `creators(id)` ON DELETE CASCADE
- `creator_contract_signatures_user_id_fkey`: `user_id` -> `auth.users(id)` ON DELETE CASCADE

---

### 2.10 creator_payout_profiles

**Purpose**: Creator bank/payment information for receiving monthly payouts.
**RLS**: Enabled | **Rows**: 1

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| `creator_id` | uuid | NOT NULL | -- | **PK**, FK -> `creators.id` ON DELETE CASCADE |
| `method` | text | NOT NULL | `'iban'` | CHECK (method IN ('iban', 'paypal', 'stripe')) |
| `account_holder_name` | text | NULL | -- | -- |
| `iban` | text | NULL | -- | -- |
| `paypal_email` | text | NULL | -- | -- |
| `stripe_account` | text | NULL | -- | -- |
| `created_at` | timestamptz | NOT NULL | `timezone('utc', now())` | -- |
| `updated_at` | timestamptz | NOT NULL | `timezone('utc', now())` | -- |

**Primary Key**: `creator_id` (1:1 relationship with `creators`)
**Foreign Keys**:
- `creator_payout_profiles_creator_id_fkey`: `creator_id` -> `creators(id)` ON DELETE CASCADE

**Note**: Sensitive financial data (IBAN, PayPal email). No encryption at rest beyond Supabase platform-level encryption.

---

### 2.11 onboarding_drafts

**Purpose**: Temporary storage for partial onboarding form data (replaces localStorage for cross-device support).
**RLS**: Enabled | **Rows**: 0

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| `id` | uuid | NOT NULL | `gen_random_uuid()` | **PK** |
| `user_id` | uuid | NOT NULL | -- | UNIQUE, FK -> `auth.users.id` ON DELETE CASCADE |
| `form_data` | jsonb | NOT NULL | `'{}'::jsonb` | -- |
| `step` | integer | NOT NULL | `0` | CHECK (step >= 0 AND step <= 2) |
| `created_at` | timestamptz | NOT NULL | `timezone('utc', now())` | -- |
| `updated_at` | timestamptz | NOT NULL | `timezone('utc', now())` | -- |

**Primary Key**: `id`
**Unique Constraints**: `user_id` (one draft per auth user)
**Foreign Keys**:
- `onboarding_drafts_user_id_fkey`: `user_id` -> `auth.users(id)` ON DELETE CASCADE

---

### 2.12 admin_audit_log

**Purpose**: Immutable audit trail for admin actions (approvals, rejections, config changes, payouts).
**RLS**: Enabled | **Rows**: 18

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| `id` | uuid | NOT NULL | `gen_random_uuid()` | **PK** |
| `created_at` | timestamptz | NOT NULL | `timezone('utc', now())` | -- |
| `admin_user_id` | uuid | NOT NULL | -- | -- |
| `action` | text | NOT NULL | -- | -- |
| `entity_type` | text | NOT NULL | -- | -- |
| `entity_id` | uuid | NULL | -- | -- |
| `metadata` | jsonb | NOT NULL | `'{}'::jsonb` | -- |
| `request_id` | text | NULL | -- | -- |
| `ip` | inet | NULL | -- | -- |
| `user_agent` | text | NULL | -- | -- |

**Primary Key**: `id`
**Foreign Keys**: None (intentionally -- `admin_user_id` has no FK to avoid CASCADE issues with audit data)

**Note**: No UPDATE or DELETE policies exist, making this append-only via RLS (service role can still modify).

---

## 3. Entity Relationship Diagram

```
                    auth.users
                   /    |     \
                  /     |      \
                 /      |       \
                v       v        v
    onboarding_drafts  creator_applications  creator_contract_signatures
                                                        |
                                                        v
    package_definitions <-------- creators --------> mix_definitions
          ^                    /    |    \                ^
          |                   /     |     \               |
          |                  v      v      v              |
          +------- monthly_tracking       creator_payout_profiles
          |              /      \
          |             v        v
          +-------- videos     rushes
          |
          v
    video_rates (standalone)

    admin_audit_log (standalone -- no FK references)
```

### Relationship Summary

| Parent | Child | FK Column | ON DELETE |
|--------|-------|-----------|----------|
| `auth.users` | `creators` | `user_id` | SET NULL |
| `auth.users` | `creator_applications` | `user_id` | CASCADE |
| `auth.users` | `creator_contract_signatures` | `user_id` | CASCADE |
| `auth.users` | `onboarding_drafts` | `user_id` | CASCADE |
| `package_definitions` | `creators` | `package_tier` | (no action) |
| `package_definitions` | `monthly_tracking` | `package_tier` | (no action) |
| `package_definitions` | `creator_applications` | `package_tier` | (no action) |
| `mix_definitions` | `creators` | `default_mix` | (no action) |
| `mix_definitions` | `monthly_tracking` | `mix_name` | (no action) |
| `mix_definitions` | `creator_applications` | `mix_name` | (no action) |
| `creators` | `monthly_tracking` | `creator_id` | CASCADE |
| `creators` | `videos` | `creator_id` | CASCADE |
| `creators` | `rushes` | `creator_id` | CASCADE |
| `creators` | `creator_contract_signatures` | `creator_id` | CASCADE |
| `creators` | `creator_payout_profiles` | `creator_id` | CASCADE |
| `monthly_tracking` | `videos` | `monthly_tracking_id` | CASCADE |
| `monthly_tracking` | `rushes` | `monthly_tracking_id` | CASCADE |

---

## 4. RLS Policies

All 12 tables have RLS enabled.

### 4.1 Public Schema Policies

#### package_definitions (2 policies)

| Policy | Operation | Roles | USING | WITH CHECK |
|--------|-----------|-------|-------|------------|
| **Authenticated read package definitions** | SELECT | authenticated | `true` | -- |
| **Admins update package definitions** | UPDATE | authenticated | `jwt->app_metadata->role = 'admin'` | `jwt->app_metadata->role = 'admin'` |

#### mix_definitions (2 policies)

| Policy | Operation | Roles | USING | WITH CHECK |
|--------|-----------|-------|-------|------------|
| **Authenticated read mix definitions** | SELECT | authenticated | `true` | -- |
| **Admins update mix definitions** | UPDATE | authenticated | `jwt->app_metadata->role = 'admin'` | `jwt->app_metadata->role = 'admin'` |

#### video_rates (2 policies)

| Policy | Operation | Roles | USING | WITH CHECK |
|--------|-----------|-------|-------|------------|
| **Authenticated read video rates** | SELECT | authenticated | `true` | -- |
| **Admins update video rates** | UPDATE | authenticated | `jwt->app_metadata->role = 'admin'` | `jwt->app_metadata->role = 'admin'` |

#### creators (1 policy)

| Policy | Operation | Roles | USING | WITH CHECK |
|--------|-----------|-------|-------|------------|
| **Authenticated read creators** | SELECT | authenticated | `jwt->app_metadata->role = 'admin'` OR `user_id = auth.uid()` OR `lower(email) = lower(jwt->email)` | -- |

**Missing**: No INSERT, UPDATE, or DELETE policies. All writes must go through service role.

#### monthly_tracking (1 policy)

| Policy | Operation | Roles | USING | WITH CHECK |
|--------|-----------|-------|-------|------------|
| **Authenticated read monthly tracking** | SELECT | authenticated | `jwt->app_metadata->role = 'admin'` OR `EXISTS(creator linked via user_id or email)` | -- |

**Missing**: No INSERT, UPDATE, or DELETE policies. All writes must go through service role.

#### videos (1 policy)

| Policy | Operation | Roles | USING | WITH CHECK |
|--------|-----------|-------|-------|------------|
| **Authenticated read videos** | SELECT | authenticated | `jwt->app_metadata->role = 'admin'` OR `EXISTS(creator linked via user_id or email)` | -- |

**Missing**: No INSERT, UPDATE, or DELETE policies. All writes must go through service role.

#### rushes (1 policy)

| Policy | Operation | Roles | USING | WITH CHECK |
|--------|-----------|-------|-------|------------|
| **Authenticated read rushes** | SELECT | authenticated | `jwt->app_metadata->role = 'admin'` OR `EXISTS(creator linked via user_id or email)` | -- |

**Missing**: No INSERT, UPDATE, or DELETE policies. All writes must go through service role.

#### creator_applications (3 policies)

| Policy | Operation | Roles | USING | WITH CHECK |
|--------|-----------|-------|-------|------------|
| **Creator applications read own** | SELECT | public | `auth.uid() = user_id` | -- |
| **Creator applications insert own** | INSERT | public | -- | `auth.uid() = user_id` |
| **Creator applications update own** | UPDATE | public | `auth.uid() = user_id` | `auth.uid() = user_id` |

**Note**: Policies use role `public` (not `authenticated`), meaning even anonymous users could theoretically interact if they had a valid `auth.uid()`.

#### creator_contract_signatures (2 policies)

| Policy | Operation | Roles | USING | WITH CHECK |
|--------|-----------|-------|-------|------------|
| **Authenticated read contract signatures** | SELECT | authenticated | `jwt->app_metadata->role = 'admin'` OR `user_id = auth.uid()` | -- |
| **Authenticated insert contract signatures** | INSERT | authenticated | -- | `user_id = auth.uid()` |

**Missing**: No UPDATE or DELETE policies. Signatures are immutable via RLS.

#### creator_payout_profiles (4 policies)

| Policy | Operation | Roles | USING | WITH CHECK |
|--------|-----------|-------|-------|------------|
| **Payout profiles read own** | SELECT | authenticated | `EXISTS(creator linked via user_id or email)` | -- |
| **Payout profiles insert own** | INSERT | authenticated | -- | `EXISTS(creator linked via user_id or email)` |
| **Payout profiles update own** | UPDATE | authenticated | `EXISTS(creator linked via user_id or email)` | `EXISTS(creator linked via user_id or email)` |
| **Admins read all payout profiles** | SELECT | authenticated | `jwt->app_metadata->role = 'admin'` | -- |

**Note**: `payout_profiles` RLS functions do NOT use `(select auth.jwt())` initplan optimization -- they call `auth.jwt()` and `auth.uid()` directly. This causes per-row re-evaluation.

#### onboarding_drafts (4 policies)

| Policy | Operation | Roles | USING | WITH CHECK |
|--------|-----------|-------|-------|------------|
| **Onboarding drafts read own** | SELECT | public | `auth.uid() = user_id` | -- |
| **Onboarding drafts insert own** | INSERT | public | -- | `auth.uid() = user_id` |
| **Onboarding drafts update own** | UPDATE | public | `auth.uid() = user_id` | `auth.uid() = user_id` |
| **Onboarding drafts delete own** | DELETE | public | `auth.uid() = user_id` | -- |

**Note**: Like `creator_applications`, uses role `public`.

#### admin_audit_log (2 policies)

| Policy | Operation | Roles | USING | WITH CHECK |
|--------|-----------|-------|-------|------------|
| **Admins read audit log** | SELECT | authenticated | `jwt->app_metadata->role = 'admin'` | -- |
| **Service insert audit log** | INSERT | authenticated | -- | `true` |

**SECURITY CONCERN**: The INSERT policy uses `WITH CHECK (true)`, meaning ANY authenticated user can insert into the audit log. This should be restricted to admin role or service role only.

---

### 4.2 Storage Policies (on `storage.objects`)

#### Admin Policies (1)

| Policy | Operation | Condition |
|--------|-----------|-----------|
| **Admins can read all storage objects** | SELECT | `jwt->app_metadata->role = 'admin'` |

#### Videos Bucket (4 policies)

| Policy | Operation | Condition |
|--------|-----------|-----------|
| **Creators can upload own videos** | INSERT | `bucket_id = 'videos'` AND folder = `auth.uid()` |
| **Creators can read own videos** | SELECT | `bucket_id = 'videos'` AND folder = `auth.uid()` |
| **Creators can update own videos** | UPDATE | `bucket_id = 'videos'` AND folder = `auth.uid()` |
| **Creators can delete own videos** | DELETE | `bucket_id = 'videos'` AND folder = `auth.uid()` |

#### Rushes Bucket (4 policies)

| Policy | Operation | Condition |
|--------|-----------|-----------|
| **Creators can upload own rushes** | INSERT | `bucket_id = 'rushes'` AND folder = `auth.uid()` |
| **Creators can read own rushes** | SELECT | `bucket_id = 'rushes'` AND folder = `auth.uid()` |
| **Creators can update own rushes** | UPDATE | `bucket_id = 'rushes'` AND folder = `auth.uid()` |
| **Creators can delete own rushes** | DELETE | `bucket_id = 'rushes'` AND folder = `auth.uid()` |

**Folder convention**: Files stored at `{bucket}/{auth.uid()}/filename.ext`

---

## 5. Indexes

### Summary: 41 total indexes across all tables

#### admin_audit_log (4 indexes)

| Index | Columns | Type | Definition |
|-------|---------|------|------------|
| `admin_audit_log_pkey` | `id` | UNIQUE (PK) | btree |
| `idx_admin_audit_log_created_at` | `created_at DESC` | Regular | btree |
| `idx_admin_audit_log_action` | `action` | Regular | btree |
| `idx_admin_audit_log_entity` | `entity_type, entity_id` | Regular (composite) | btree |

#### creator_applications (6 indexes)

| Index | Columns | Type | Definition |
|-------|---------|------|------------|
| `creator_applications_pkey` | `id` | UNIQUE (PK) | btree |
| `creator_applications_user_id_key` | `user_id` | UNIQUE | btree |
| `idx_creator_applications_status` | `status` | Regular | btree |
| `idx_creator_applications_submitted_at` | `submitted_at` | Regular | btree |
| `idx_creator_applications_package_tier` | `package_tier` | Regular | btree (FK) |
| `idx_creator_applications_mix_name` | `mix_name` | Regular | btree (FK) |

#### creator_contract_signatures (4 indexes)

| Index | Columns | Type | Definition |
|-------|---------|------|------------|
| `creator_contract_signatures_pkey` | `id` | UNIQUE (PK) | btree |
| `creator_contract_signatures_user_checksum_unique` | `user_id, contract_checksum` | UNIQUE (composite) | btree |
| `creator_contract_signatures_creator_id_idx` | `creator_id` | Regular | btree (FK) |
| `creator_contract_signatures_user_id_idx` | `user_id` | Regular | btree (FK) |

#### creator_payout_profiles (2 indexes)

| Index | Columns | Type | Definition |
|-------|---------|------|------------|
| `creator_payout_profiles_pkey` | `creator_id` | UNIQUE (PK) | btree |
| `idx_creator_payout_profiles_method` | `method` | Regular | btree |

#### creators (7 indexes)

| Index | Columns | Type | Definition |
|-------|---------|------|------------|
| `creators_pkey` | `id` | UNIQUE (PK) | btree |
| `creators_handle_key` | `handle` | UNIQUE | btree |
| `creators_email_key` | `email` | UNIQUE | btree |
| `creators_user_id_key` | `user_id` | UNIQUE | btree |
| `idx_creators_user_id` | `user_id` | Regular | btree (FK) |
| `idx_creators_package_tier` | `package_tier` | Regular | btree (FK) |
| `idx_creators_default_mix` | `default_mix` | Regular | btree (FK) |

**Note**: `creators_user_id_key` (UNIQUE) and `idx_creators_user_id` (regular) are redundant -- the unique index already supports lookups.

#### mix_definitions (1 index)

| Index | Columns | Type | Definition |
|-------|---------|------|------------|
| `mix_definitions_pkey` | `name` | UNIQUE (PK) | btree |

#### monthly_tracking (6 indexes)

| Index | Columns | Type | Definition |
|-------|---------|------|------------|
| `monthly_tracking_pkey` | `id` | UNIQUE (PK) | btree |
| `monthly_tracking_month_creator_id_key` | `month, creator_id` | UNIQUE (composite) | btree |
| `idx_monthly_tracking_month` | `month` | Regular | btree |
| `idx_monthly_tracking_creator_id` | `creator_id` | Regular | btree (FK) |
| `idx_monthly_tracking_package_tier` | `package_tier` | Regular | btree (FK) |
| `idx_monthly_tracking_mix_name` | `mix_name` | Regular | btree (FK) |

#### onboarding_drafts (2 indexes)

| Index | Columns | Type | Definition |
|-------|---------|------|------------|
| `onboarding_drafts_pkey` | `id` | UNIQUE (PK) | btree |
| `onboarding_drafts_user_id_key` | `user_id` | UNIQUE | btree |

#### package_definitions (1 index)

| Index | Columns | Type | Definition |
|-------|---------|------|------------|
| `package_definitions_pkey` | `tier` | UNIQUE (PK) | btree |

#### rushes (3 indexes)

| Index | Columns | Type | Definition |
|-------|---------|------|------------|
| `rushes_pkey` | `id` | UNIQUE (PK) | btree |
| `idx_rushes_tracking_id` | `monthly_tracking_id` | Regular | btree (FK) |
| `idx_rushes_creator_id` | `creator_id` | Regular | btree (FK) |

#### video_rates (1 index)

| Index | Columns | Type | Definition |
|-------|---------|------|------------|
| `video_rates_pkey` | `video_type` | UNIQUE (PK) | btree |

#### videos (4 indexes)

| Index | Columns | Type | Definition |
|-------|---------|------|------------|
| `videos_pkey` | `id` | UNIQUE (PK) | btree |
| `idx_videos_tracking_id` | `monthly_tracking_id` | Regular | btree (FK) |
| `idx_videos_creator_id` | `creator_id` | Regular | btree (FK) |
| `idx_videos_status` | `status` | Regular | btree |

---

## 6. Triggers

All triggers fire BEFORE UPDATE and call `touch_updated_at()` to set `updated_at = timezone('utc', now())`.

| Table | Trigger Name | Timing | Event | Function |
|-------|-------------|--------|-------|----------|
| `package_definitions` | `trg_package_definitions_updated_at` | BEFORE | UPDATE | `touch_updated_at()` |
| `mix_definitions` | `trg_mix_definitions_updated_at` | BEFORE | UPDATE | `touch_updated_at()` |
| `video_rates` | `trg_video_rates_updated_at` | BEFORE | UPDATE | `touch_updated_at()` |
| `creators` | `trg_creators_updated_at` | BEFORE | UPDATE | `touch_updated_at()` |
| `monthly_tracking` | `trg_monthly_tracking_updated_at` | BEFORE | UPDATE | `touch_updated_at()` |
| `creator_applications` | `trg_creator_applications_updated_at` | BEFORE | UPDATE | `touch_updated_at()` |
| `creator_payout_profiles` | `trg_creator_payout_profiles_updated_at` | BEFORE | UPDATE | `touch_updated_at()` |
| `onboarding_drafts` | `trg_onboarding_drafts_updated_at` | BEFORE | UPDATE | `touch_updated_at()` |

**Tables WITHOUT updated_at trigger**: `videos`, `rushes`, `creator_contract_signatures`, `admin_audit_log`
- `videos` and `rushes` have no `updated_at` column (correct -- they are append-only records).
- `creator_contract_signatures` has `created_at` only (correct -- immutable).
- `admin_audit_log` has `created_at` only (correct -- append-only audit trail).

---

## 7. Functions

### public.touch_updated_at()

| Property | Value |
|----------|-------|
| **Schema** | public |
| **Return Type** | trigger |
| **Language** | plpgsql |
| **Search Path** | `public` (hardened) |

```sql
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  new.updated_at = timezone('utc', now());
  RETURN new;
END;
$$;
```

This is the only custom function in the `public` schema. The `SET search_path = public` was added in migration `20260205133951` to fix the Supabase linter warning about mutable search paths.

---

## 8. Storage Buckets

| Bucket | Public | Size Limit | Allowed MIME Types | Folder Convention |
|--------|--------|------------|-------------------|-------------------|
| `videos` | No (private) | 600 MB (629,145,600 bytes) | `video/mp4`, `video/quicktime` | `{auth.uid()}/filename.ext` |
| `rushes` | No (private) | 2 GB (2,000,000,000 bytes) | `video/mp4`, `video/quicktime` | `{auth.uid()}/filename.ext` |

**Access Model**:
- Creators can CRUD their own files (scoped by `auth.uid()` folder)
- Admins can read all files across both buckets
- No anonymous access
- No admin upload/delete policies (must use service role)

---

## 9. Migrations History

16 migrations applied, ordered chronologically:

| # | Timestamp | Name | Description |
|---|-----------|------|-------------|
| 1 | 2026-02-04 12:20 | `create_ugc_platform_schema` | Creates core tables: `package_definitions`, `mix_definitions`, `video_rates`, `creators`, `monthly_tracking`, `videos`, `rushes`. Creates `touch_updated_at()` function. Enables RLS on all tables. Creates initial indexes. |
| 2 | 2026-02-04 12:30 | `seed_ugc_reference_and_demo_data` | Seeds reference data (4 packages, 4 mixes, 5 video rates) and demo creators/tracking/videos/rushes for MVP development. |
| 3 | 2026-02-04 12:45 | `create_creator_applications` | Creates `creator_applications` table with RLS policies for own-user CRUD. Adds status and submitted_at indexes. |
| 4 | 2026-02-05 13:17 | `add_core_rls_policies` | Adds initial RLS read policies: authenticated read for lookup tables, admin+creator-scoped reads for data tables. Uses email matching for creator identification. |
| 5 | 2026-02-05 13:39 | `fix_touch_updated_at_search_path` | Fixes `touch_updated_at()` by adding `SET search_path = public` to address Supabase linter warning. |
| 6 | 2026-02-05 13:42 | `add_creators_user_id_mapping` | Adds `user_id` column to `creators` table. Updates RLS policies to match on `user_id` in addition to email. |
| 7 | 2026-02-05 15:12 | `create_storage_buckets_and_policies` | Creates `videos` (600MB) and `rushes` (2GB) storage buckets. Adds 9 storage RLS policies (admin read + creator CRUD per bucket). |
| 8 | 2026-02-05 17:34 | `add_indexes_and_merge_read_policies` | Adds FK indexes for performance. Merges separate admin/creator SELECT policies into single unified policies per table to avoid redundant permissive policy evaluation. |
| 9 | 2026-02-05 17:40 | `optimize_rls_initplan` | Wraps `auth.uid()` calls with `(select auth.uid())` to enable InitPlan optimization (avoids per-row re-evaluation). |
| 10 | 2026-02-05 19:00 | `optimize_rls_initplan_auth_jwt` | Wraps `auth.jwt()` calls with `(select auth.jwt())` to complete InitPlan optimization across all RLS policies. |
| 11 | 2026-02-05 20:00 | `create_admin_audit_log` | Creates `admin_audit_log` table with indexes on created_at, action, and entity. Adds admin-read and service-insert policies. |
| 12 | 2026-02-06 17:34 | `create_contract_signatures` | Creates `creator_contract_signatures` table with unique constraint on (user_id, contract_checksum). Adds RLS for admin read + creator self-insert. |
| 13 | 2026-02-06 20:05* | `create_creator_payout_profiles` | Creates `creator_payout_profiles` table (1:1 with creators). Adds RLS for creator CRUD (via creator join) + admin read. |
| 14 | 2026-02-11 10:00* | `create_onboarding_drafts` | Creates `onboarding_drafts` table for partial form persistence. Full CRUD RLS scoped to own user_id. |
| 15 | 2026-02-12 10:00* | `remove_demo_seed_data` | Deletes all demo creators, tracking records, videos, and rushes. Marks all video rates as confirmed (is_placeholder = false). |
| 16 | 2026-02-15 18:12 | `add_admin_write_policies_config_tables` | Adds admin UPDATE policies for `package_definitions`, `mix_definitions`, and `video_rates`. **Only exists in remote DB -- no local migration file found.** |

\* Migrations 13-15 have different timestamps locally vs. what the remote DB reports (remote has `20260211232437`, `20260211233150`, `20260212143830`). The local files use `20260206200500`, `20260211100000`, `20260212100000`.

---

## 10. Reference Data

### Package Definitions (Current State)

| Tier | Quota Videos | Monthly Credits (EUR) |
|------|-------------|----------------------|
| 10 | 10 | 0.00 |
| 20 | 20 | 25.00 |
| 30 | 30 | 38.00 |
| 40 | 40 | 50.00 |

### Mix Definitions (Current State)

| Name | OOTD | TRAINING | BEFORE_AFTER | SPORTS_80S | CINEMATIC | Positioning |
|------|------|----------|-------------|------------|-----------|-------------|
| VOLUME | 40% | 35% | 20% | 0% | 5% | Max volume performance. Direction artistique minimale. |
| EQUILIBRE | 30% | 30% | 25% | 10% | 5% | Mix equilibre performance + image de marque. |
| PREMIUM_80S | 20% | 25% | 20% | 20% | 15% | Direction artistique forte, cout creatif plus eleve. |
| TRANSFO_HEAVY | 20% | 25% | 40% | 10% | 5% | Focus transformations Before/After. |

### Video Rates (Current State)

| Video Type | Rate/Video (EUR) | Placeholder |
|-----------|-----------------|-------------|
| OOTD | 100.00 | No |
| TRAINING | 95.00 | No |
| BEFORE_AFTER | 120.00 | No |
| SPORTS_80S | 140.00 | No |
| CINEMATIC | 180.00 | No |

---

## 11. Security Observations

### Critical Issues

1. **Audit log INSERT policy is permissive to all authenticated users**
   - `admin_audit_log` has `WITH CHECK (true)` on INSERT, allowing any authenticated user to insert fake audit entries. Should be restricted to `admin` role or removed (relying on service role bypass).

2. **RLS InitPlan optimization inconsistency**
   - `creator_payout_profiles` policies call `auth.jwt()` and `auth.uid()` directly without the `(select ...)` wrapper used in other tables. This causes per-row function re-evaluation and may impact performance at scale.

### High Issues

3. **No write policies on core data tables**
   - `creators`, `monthly_tracking`, `videos`, `rushes` have SELECT-only RLS policies. All writes go through service role, which bypasses RLS entirely. This is a deliberate architectural choice but means the application layer is solely responsible for authorization on writes.

4. **`videos.reviewed_by` has no FK constraint**
   - The `reviewed_by` column should reference `auth.users(id)` but has no foreign key, allowing orphaned UUIDs.

5. **No enum types -- CHECK constraints only**
   - All status/type fields use CHECK constraints with hardcoded arrays. Adding new values requires ALTER TABLE + application code changes. Consider migrating to PostgreSQL enums for type safety.

6. **`creator_applications` policies use role `public`**
   - The `creator_applications` and `onboarding_drafts` policies are granted to the `public` role instead of `authenticated`. While Supabase's anon key maps to `public`, this is less restrictive than intended. Consider changing to `authenticated` if anonymous access is not needed.

### Medium Issues

7. **Redundant index on `creators.user_id`**
   - Both `creators_user_id_key` (UNIQUE) and `idx_creators_user_id` (regular btree) exist on the same column. The UNIQUE index already supports lookups -- the regular index is redundant.

8. **No index on `creators.email`** for RLS policy performance
   - Several RLS policies use `lower(c.email) = lower(...)` for creator matching. While `creators_email_key` provides a UNIQUE index on `email`, it is case-sensitive. A functional index on `lower(email)` would improve RLS query performance.

9. **Payout profile financial data not encrypted at column level**
   - `creator_payout_profiles.iban` stores IBAN numbers in plaintext. Consider using `pgcrypto` for column-level encryption of sensitive financial data.

10. **Missing migration file locally**
    - Migration `20260215181217_add_admin_write_policies_config_tables` exists only in the remote database. The local `supabase/migrations/` directory does not contain this file, creating a drift between the codebase and the deployed schema.

### Low Issues

11. **`contract_signed_at` uses `now()` vs `timezone('utc', now())`**
    - `creator_contract_signatures.signed_at` and `created_at` default to `now()` while all other tables use `timezone('utc', now())`. In practice both return UTC in Supabase, but the inconsistency is worth noting.

12. **No `updated_at` column on `videos` table**
    - If video records are ever updated (e.g., status changes from `pending_review` to `approved`), there is no timestamp tracking when that update occurred. Only `reviewed_at` captures review events.

13. **`monthly_tracking.month` stored as text**
    - The month field uses text with a regex CHECK constraint instead of a date type. This works but prevents native date operations and range queries without casting.
