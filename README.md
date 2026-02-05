# RetroMuscle UGC Platform (MVP Skeleton)

Implementation basee sur le PRD (`PRD-UGC-Platform.md`) avec architecture modulaire, donnees mockees, et seam d'integration Supabase.

## Stack

- Next.js 14 (App Router)
- TypeScript strict
- Tailwind CSS
- Architecture: `domain` -> `application` -> `features` -> `app`

## Routes MVP

- `/` : landing SaaS (vision + conversion)
- `/apply` : signup createur (email + mot de passe)
- `/login` : connexion createur/admin
- `/onboarding` : onboarding createur multi-step
- `/auth/callback` : callback auth (reserve integrations)
- `/creators` : page programme detaillee
- `/dashboard` : dashboard createur (premier createur disponible)
- `/admin` : dashboard manager

### Protection des routes

- `middleware.ts` protege `/admin`, `/dashboard`, `/onboarding`, `/apply`, `/login`
- Utilise le cookie `rm_access_token` + resolution de role pour redirection automatique:
  - admin -> `/admin`
  - createur approuve -> `/dashboard`
  - createur non approuve -> `/onboarding`

## API

- `GET /api/onboarding/options`
- `GET /api/creator/:id/dashboard?month=YYYY-MM` (Bearer requis)
- `GET /api/admin/overview?month=YYYY-MM` (Bearer admin requis)
- `GET /api/applications/me`
- `POST /api/applications/me`

## Structure

- `src/domain`: modeles metier + logique quotas/remuneration
- `src/application`: use-cases + repository interface
- `src/data`: dataset mock
- `src/features`: composants UI par feature (props-driven)
- `src/app`: routing + API routes
- `docs/architecture.md`: decisions d'architecture et plan de cutover Supabase

## Demarrage

```bash
npm install
npm run dev
```

## Variables d'environnement

Copier `.env.example` vers `.env.local` et renseigner:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (ou `SUPABASE_SECRET_KEY`)

Si les variables Supabase sont presentes, le repository bascule automatiquement en mode Supabase.
Sinon l'app reste sur les donnees mockees in-memory.

## Migrations Supabase

Les migrations SQL sont dans `supabase/migrations`:

- `20260204122000_create_ugc_platform_schema.sql`
- `20260204123000_seed_ugc_reference_and_demo_data.sql`
- `20260204124500_create_creator_applications.sql`

Appliquer via Supabase CLI:

```bash
supabase db push
```

## Handoff Supabase (reste a faire)

1. Connecter upload zone a Supabase Storage (signed URLs)
2. Ajouter RLS + Auth role createur/admin par workspace
3. Brancher paiements (Stripe Connect ou export CSV)

## Decisions

- Les tarifs `TRAINING` a `CINEMATIC` sont provisoires (`isPlaceholder: true`) tant que validation business non faite.
- Le calcul de quotas applique une repartition stable (largest remainder) pour garantir que la somme = quota total.
# retromuscle-affiliate
