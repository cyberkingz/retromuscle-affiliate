# Ralph Loop Task: Simplify Creator Model

## Mission
Refactor the RetroMuscle creator platform from a complex forfait/package/mix/quota model to a simple "open bar" a la carte model where creators upload videos, select the type, and get paid per validated video at fixed rates.

## Current Model (TO REMOVE)
- 4 PackageTiers (10/20/30/40) with monthly quotas
- 4 MixDefinitions (VOLUME/EQUILIBRE/PREMIUM_80S/TRANSFO_HEAVY) distributing video types
- Monthly credits system
- calculateQuotas() function
- MonthlyTracking with quotas/delivered/deadline
- Onboarding step 3 "Package et mix" where creator chooses package + mix

## New Model (TO IMPLEMENT)
- NO packages, NO mixes, NO quotas, NO monthly credits
- Creator signs up (profile + socials only), gets approved
- Creator uploads any video, selects the type (OOTD/Training/Before-After/Sports 80s/Cinematic)
- Each validated video = paid at fixed rate (OOTD: 100, Training: 95, Before/After: 120, Sports 80s: 140, Cinematic: 180)
- Open bar: no cap on videos per month
- Admin reviews + approves/rejects as before

## Success Criteria
1. Domain layer: PackageTier, MixName, MixDefinition, calculateQuotas(), monthlyCredits removed from types
2. Domain layer: Creator type no longer has packageTier or defaultMix fields
3. Domain layer: MonthlyTracking simplified or replaced - no quotas, just tracks validated videos
4. calculatePayout() simplified to just sum(validated videos x rate per type) - no monthlyCredits
5. packages.ts and mixes.ts constants files deleted or emptied
6. Onboarding wizard reduced from 3 steps to 2 (personal info + creator profile) - no Package et mix step
7. step-plan-form.tsx removed or gutted (no package/mix selection)
8. Creator dashboard shows: total videos uploaded, total validated, total earnings - no quota progress
9. Admin views adapted: no package/mix assignment, just review videos
10. All TypeScript compiles with zero errors
11. Application form no longer requires packageTier or mixName
12. Database types/queries updated to not require package_tier or mix_name
13. Contract text updated if it references forfaits/quotas
14. Upload flow: creator selects video type when uploading (already exists, just ensure it works standalone)
15. Payout page shows simple breakdown: X videos of type Y x rate = subtotal, grand total

## Architecture Rules
- Keep DDD layered architecture (domain -> application -> features -> app)
- Keep repository pattern with DI
- Keep strict TypeScript (zero any, zero ts-ignore)
- Keep existing component library (Tailwind + Radix + CVA)
- Domain layer must remain framework-free

## Order of Operations
1. Start with domain layer (types, constants, services) - foundation first
2. Then infrastructure (repository, queries)
3. Then features (onboarding, dashboard, uploads, payouts)
4. Then app pages
5. Finally verify TypeScript compiles clean

## Key Files
- src/domain/types.ts
- src/domain/constants/packages.ts (delete)
- src/domain/constants/mixes.ts (delete)
- src/domain/services/calculate-payout.ts (simplify)
- src/domain/services/calculate-quotas.ts (delete)
- src/features/apply/ (remove step 3)
- src/features/apply/state.ts
- src/features/apply/components/step-plan-form.tsx (delete)
- src/app/dashboard/page.tsx
- src/app/uploads/page.tsx
- src/app/payouts/page.tsx
- src/domain/contracts/affiliate-program-contract.ts
- src/infrastructure/supabase/supabase-creator-repository.ts
