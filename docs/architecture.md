# Architecture Notes (MVP)

## Layering

- `domain/`: pure business rules and entities (no framework dependencies)
- `application/`: use-cases + repository ports
- `data/`: in-memory adapters and fixtures
- `infrastructure/supabase`: Supabase adapter and server client
- `features/`: UI by business feature, props-driven
- `app/`: routing + API endpoints
- `app/apply` + `app/auth/callback`: SaaS onboarding/auth flow

## Core Principles

1. Business logic isolated from UI (`calculateQuotas`, `calculatePayout`, `summarizeTracking`)
2. Data access abstracted behind `CreatorRepository`
3. Pages orchestrate use-cases and pass typed props to presentational components
4. API routes reuse the same use-cases (single source of truth)
5. Supabase integration can replace only the repository adapter
6. Candidate onboarding is isolated behind API routes that verify bearer access tokens

## Supabase Cutover Plan

- `SupabaseCreatorRepository` already implements the `CreatorRepository` contract
- `getRepository()` auto-selects Supabase when env vars are present
- Keep use-cases unchanged (adapter swap only)
- Wire auth (creator/admin roles) and RLS policies
- Map storage uploads to signed URLs
