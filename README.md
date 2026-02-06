# RetroMuscle Affiliate / UGC Platform

Implementation basee sur le PRD (`PRD-UGC-Platform.md`) avec architecture modulaire, donnees mockees, et seam d'integration Supabase.

## Stack

- Next.js 14 (App Router)
- TypeScript strict
- Tailwind CSS
- Architecture: `domain` -> `application` -> `features` -> `app`

## Routes MVP

- `/` : landing (conversion programme affilie)
- `/creators` : page programme detaillee (packs + tarifs + mixes)
- `/apply` : inscription createur (email + mot de passe)
- `/login` : connexion createur/admin
- `/onboarding` : onboarding createur multi-step
- `/contract` : signature du contrat (avant activation)
- `/dashboard` : dashboard createur
- `/admin` : dashboard admin
- `/admin/applications` : revue des candidatures
- `/auth/callback` : callback auth (reserve integrations)

### Protection des routes

- `middleware.ts` protege `/admin`, `/dashboard`, `/onboarding`, `/apply`, `/login`
- Utilise le cookie `rm_access_token` + resolution de role pour redirection automatique:
  - admin -> `/admin`
  - createur approuve sans contrat -> `/contract`
  - createur approuve + contrat -> `/dashboard`
  - createur non approuve -> `/onboarding`

## API

- `GET /api/onboarding/options`
- `GET /api/applications/me`
- `POST /api/applications/me`
- `POST /api/contract/sign`
- `GET /api/creator/:id/dashboard?month=YYYY-MM` (Bearer requis)
- `POST /api/creator/uploads/video`
- `GET /api/admin/overview?month=YYYY-MM` (Bearer admin requis)
- `GET /api/admin/applications` (Bearer admin requis)
- `POST /api/admin/applications/review` (Bearer admin requis)
- `POST /api/admin/videos/review` (Bearer admin requis)

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
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (requis: legacy anon JWT `eyJhbGciOi...` pour email+password)
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (optionnel: non utilise pour les flows password)
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- `SUPABASE_ACCESS_TOKEN` (optionnel: CLI / MCP)

Si les variables Supabase sont presentes, le repository bascule automatiquement en mode Supabase.
Sinon l'app reste sur les donnees mockees in-memory.

## Seed admin (one-shot)

Pour (re)creer un compte admin via Supabase Auth (idempotent):

```bash
ADMIN_EMAIL=admin@retromuscle.net ADMIN_PASSWORD="..." npm run seed:admin
```

Si la connexion renvoie `Database error querying schema`, c'est souvent un bug GoTrue lie a des valeurs `NULL`
dans certaines colonnes token de `auth.users` (observes apres `admin.createUser`, ex: `email_change`, `confirmation_token`).
Correctif rapide (SQL editor Supabase):

```sql
update auth.users
set
  confirmation_token = coalesce(confirmation_token, ''),
  recovery_token = coalesce(recovery_token, ''),
  email_change_token_new = coalesce(email_change_token_new, ''),
  email_change = coalesce(email_change, ''),
  email_change_token_current = coalesce(email_change_token_current, ''),
  phone_change_token = coalesce(phone_change_token, ''),
  reauthentication_token = coalesce(reauthentication_token, '')
where
  confirmation_token is null
  or recovery_token is null
  or email_change_token_new is null
  or email_change is null
  or email_change_token_current is null
  or phone_change_token is null
  or reauthentication_token is null;
```

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

1. Rushes upload end-to-end (storage + validation)
2. Paiements (export CSV + statut paye / historisation)
3. Tests + CI (lint/typecheck/build + smoke auth + upload)
4. Hardening prod: headers securite, rate limiting, monitoring/alerting

## Decisions

- Les tarifs `TRAINING` a `CINEMATIC` sont provisoires (`isPlaceholder: true`) tant que validation business non faite.
- Le calcul de quotas applique une repartition stable (largest remainder) pour garantir que la somme = quota total.
