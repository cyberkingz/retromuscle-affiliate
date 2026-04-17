# Ralph Loop Task: Split Followers Per Platform

## Mission
Replace the single generic `followers: number` field with per-platform follower counts: `followersTiktok` and `followersInstagram`. This touches domain types, DB schema, API, form state, onboarding UI, admin views, and all data flows.

## Current State
- `Creator.followers: number` — single global count
- `CreatorApplication.followers: number` — single global count
- Onboarding form has one "Followers" input field
- DB columns: `creators.followers`, `creator_applications.followers`
- Admin views show a single followers count

## Target State
- `Creator.followersTiktok: number` + `Creator.followersInstagram: number` (no generic `followers`)
- `CreatorApplication.followersTiktok: number` + `CreatorApplication.followersInstagram: number`
- Onboarding form: followers input UNDER each platform field (TikTok followers below TikTok URL, Instagram followers below Instagram URL)
- DB: `followers_tiktok` + `followers_instagram` columns (replacing `followers`)
- Admin views show per-platform counts
- API payloads use `followers_tiktok` + `followers_instagram`

## Layers to Modify (in order)

### 1. Domain Layer
- `src/domain/types.ts` — Replace `followers: number` with `followersTiktok: number` + `followersInstagram: number` in both `Creator` and `CreatorApplication`

### 2. Infrastructure Layer
- `src/infrastructure/supabase/supabase-creator-repository.ts` — Update row types, column selects, mappers for both creators and applications
- `src/application/repositories/creator-repository.ts` — Update interface if needed
- `src/application/repositories/in-memory-creator-repository.ts` — Update mock

### 3. API Layer
- `src/app/api/applications/_lib.ts` — Update payload parsing (followers_tiktok, followers_instagram)
- `src/app/api/applications/me/route.ts` — Update upsert/select

### 4. Feature Layer — Onboarding
- `src/features/apply/types.ts` — Update `ApplicationFormState` and `ApplicationRecord`
- `src/features/apply/state.ts` — Update `INITIAL_FORM` and `mapRecordToForm`
- `src/features/apply/hooks/use-onboarding-flow.ts` — Update validation, draft, submit
- `src/features/apply/components/step-profile-form.tsx` — Move followers inputs under each platform, one per network

### 5. Feature Layer — Admin/Dashboard
- `src/features/admin-applications/admin-applications-page.tsx` — Show per-platform followers
- `src/features/admin-creators/admin-creator-detail-page.tsx` — Show per-platform followers
- `src/features/admin-dashboard/components/creators-master-table.tsx` — Update if it shows followers
- `src/features/creator-dashboard/components/creator-header.tsx` — Update if it shows followers

### 6. Use Cases
- `src/application/use-cases/review-creator-application.ts` — If it references followers
- `src/application/use-cases/get-admin-dashboard-data.ts` — If it maps followers
- `src/application/use-cases/get-admin-creator-detail-data.ts` — If it maps followers
- `src/application/use-cases/get-creator-dashboard-data.ts` — If it maps followers

### 7. Mock Data
- `src/data/mock-db.ts` — Update mock creators/applications

## Success Criteria
1. Domain: `Creator` has `followersTiktok: number` + `followersInstagram: number`, NO generic `followers`
2. Domain: `CreatorApplication` has `followersTiktok: number` + `followersInstagram: number`, NO generic `followers`
3. Onboarding form: TikTok followers input appears directly under TikTok URL, Instagram followers input under Instagram URL
4. API: `/api/applications/me` accepts and returns `followers_tiktok` + `followers_instagram`
5. Repository: Supabase queries select `followers_tiktok` + `followers_instagram`
6. Admin views: Show per-platform follower counts (not a single number)
7. ZERO references to the old single `followers` field in types (except as a computed sum if needed for display)
8. TypeScript compiles with zero errors
9. All tests pass
10. Helper text under each followers input clarifies it (e.g. "Nombre d'abonnes sur TikTok")
