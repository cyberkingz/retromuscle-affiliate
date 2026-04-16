# Plan de développement RetroMuscle — Consolidation des 2 audits

**Généré le** : 15 avril 2026  
**Source** : Audit global (7 agents) + Audit flows (3 agents)  
**Total findings** : ~380 issues consolidées en 8 sprints

---

## Légende

| Symbole | Signification |
|---------|--------------|
| 🔴 CRITIQUE | Bloquant, risque légal/sécurité/données |
| 🟠 HAUT | Friction forte, risque métier |
| 🟡 MOYEN | Dette technique ou UX dégradée |
| ✅ FAIT | Corrigé lors des audits précédents |

---

## SPRINT 0 — Hotfixes critiques immédiats (Jour 1–2)

> Problèmes à corriger avant tout autre travail. Risque légal, sécurité ou données corrompues.

### 0.1 🔴 Retirer toutes les références Stripe

Stripe n'est pas utilisé. 18 fichiers à modifier, aucun package npm à désinstaller.

**Fichiers à modifier :**

| Fichier | Action |
|---------|--------|
| `src/domain/types.ts:15` | `PayoutMethod = "iban" \| "paypal"` (retirer `"stripe"`) |
| `src/domain/types.ts:88` | Supprimer `stripeAccount?: string \| null` de `CreatorPayoutProfile` |
| `src/infrastructure/supabase/supabase-creator-repository.ts:108` | Supprimer `stripe_account: string \| null` de `CreatorPayoutProfileRow` |
| `src/infrastructure/supabase/supabase-creator-repository.ts:168` | Retirer `"stripe"` du tableau `allowed` |
| `src/infrastructure/supabase/supabase-creator-repository.ts:281` | Supprimer `stripeAccount: row.stripe_account` du mapping |
| `src/infrastructure/supabase/supabase-creator-repository.ts:317` | Retirer `stripe_account` de `PAYOUT_COLS` |
| `src/infrastructure/supabase/supabase-creator-repository.ts:643–654` | Supprimer `stripeAccount` du type input + du payload upsert |
| `src/application/use-cases/get-creator-settings-data.ts:11,15,51` | Retirer `"stripe"` du type et `stripeAccount` de l'output |
| `src/application/use-cases/get-admin-payments-export-data.ts:18,80` | Retirer `stripeAccount` du type et de la projection |
| `src/application/use-cases/mark-monthly-tracking-paid.ts:28–29` | Supprimer le check `method === "stripe"` |
| `src/application/use-cases/get-admin-dashboard-data.ts:154` | Supprimer le check `method === "stripe"` |
| `src/application/use-cases/save-creator-payout-profile.ts:24,43–45,58,74` | Supprimer le case `"stripe"` et `stripeAccount` |
| `src/application/repositories/creator-repository.ts:83` | Retirer `stripeAccount` de l'interface |
| `src/application/repositories/in-memory-creator-repository.ts:157` | Retirer `stripeAccount` |
| `src/features/admin-creators/admin-creator-detail-page.tsx:318–321` | Supprimer le bloc d'affichage Stripe |
| `src/app/api/creator/payout-profile/route.ts:11,29,59,121,151` | Retirer `"stripe"` du type, de la validation et du payload |
| `src/app/api/admin/payments/export/route.ts:52,71` | Retirer `stripe_account` des colonnes CSV |
| `src/application/use-cases/get-landing-page-data.ts:53` | Remplacer "PayPal ou Stripe" par "PayPal" dans la FAQ |
| `src/application/use-cases/get-saas-landing-data.ts:203,220,288` | Idem — retirer "Stripe" du texte marketing |
| `src/features/saas-landing/components/hero-lab/variant-c/landing-hero-variant-c.tsx:76` | Retirer "ou Stripe selon ton setup" |

**Migration DB à créer :**
```sql
-- supabase/migrations/YYYYMMDD_remove_stripe_payout_method.sql
ALTER TABLE public.creator_payout_profiles
  DROP COLUMN IF EXISTS stripe_account;

ALTER TABLE public.creator_payout_profiles
  DROP CONSTRAINT IF EXISTS creator_payout_profiles_method_check;

ALTER TABLE public.creator_payout_profiles
  ADD CONSTRAINT creator_payout_profiles_method_check
  CHECK (method IN ('iban', 'paypal'));
```

**Tests à mettre à jour :**
- `src/application/use-cases/mark-monthly-tracking-paid.test.ts` : supprimer les 3 tests Stripe (lignes 134–145, 226–230)

---

### 0.2 🔴 Protéger `/api/health`

**Fichier :** `src/app/api/health/route.ts`

Retirer la liste des buckets de la réponse et ajouter un guard admin.

```typescript
// Avant
return NextResponse.json({ ok: true, supabaseConfigured, supabaseReachable, storageReachable, buckets });

// Après : ajouter requireApiRole("admin") en tête de route
// ET retirer `buckets` de la réponse
return NextResponse.json({ ok: true, supabaseConfigured, supabaseReachable, storageReachable });
```

---

### 0.3 🔴 FK manquante : `videos.reviewed_by`

**Migration à créer :**
```sql
ALTER TABLE public.videos
  ADD CONSTRAINT fk_videos_reviewed_by
  FOREIGN KEY (reviewed_by) REFERENCES auth.users(id)
  ON DELETE SET NULL;
```

---

### 0.4 🔴 FK manquante : `admin_audit_log.admin_user_id`

**Migration à créer :**
```sql
ALTER TABLE public.admin_audit_log
  ALTER COLUMN admin_user_id DROP NOT NULL;

ALTER TABLE public.admin_audit_log
  ADD CONSTRAINT fk_audit_log_admin_user_id
  FOREIGN KEY (admin_user_id) REFERENCES auth.users(id)
  ON DELETE SET NULL;
```

---

### 0.5 🔴 API uploads ne vérifie pas `contract_signed_at`

**Fichiers :**
- `src/app/api/creator/uploads/video/route.ts`
- `src/app/api/creator/uploads/video/signed-url/route.ts`
- `src/app/api/creator/uploads/rush/route.ts`
- `src/app/api/creator/uploads/rush/signed-url/route.ts`

Après `requireApiRole(request, "affiliate")`, vérifier que le créateur a signé le contrat :

```typescript
const creator = await getRepository().getCreatorByUserId(session.userId);
if (!creator?.contractSignedAt) {
  return apiError(request, 403, "CONTRACT_NOT_SIGNED", "Tu dois signer le contrat avant de pouvoir uploader.");
}
```

---

### 0.6 🔴 Le montant payé n'est jamais figé

**Problème :** `calculatePayout()` est appelé dynamiquement depuis les taux actuels. Modifier un tarif change l'historique des paiements passés.

**Migration à créer :**
```sql
ALTER TABLE public.monthly_tracking
  ADD COLUMN paid_amount numeric(10,2);
```

**Use-case à modifier :** `src/application/use-cases/mark-monthly-tracking-paid.ts`  
Calculer et persister `paid_amount` au moment de `markMonthlyTrackingPaid()` :

```typescript
const amount = calculatePayout(tracking.delivered, rates);
await repository.markMonthlyTrackingPaid(input.trackingId, {
  paidAt: new Date(),
  paidAmount: amount
});
```

**Repository :** ajouter `paidAmount?: number` dans `updateMonthlyTracking`.  
**UI admin :** afficher `paid_amount` (figé) au lieu de recalculer.

---

### 0.7 🔴 Routes 410 Gone sans authentification

**Fichiers :**
- `src/app/api/admin/config/mixes/route.ts`
- `src/app/api/admin/config/packages/route.ts`

Options :
- **Option A (recommandée)** : supprimer complètement les fichiers
- **Option B** : ajouter `requireApiRole(request, "admin")` avant le return 410

---

## SPRINT 1 — Sécurité & RLS (Semaine 1)

### 1.1 🟠 Politiques RLS d'écriture manquantes

Ajouter des politiques `DENY` explicites sur les tables sans politique d'écriture :

**Migration à créer :**
```sql
-- Block direct INSERT/UPDATE/DELETE for authenticated role on core tables
-- (service_role bypasses RLS anyway, this is defense-in-depth)

CREATE POLICY "Block direct inserts" ON public.creators
  FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "Block direct updates" ON public.creators
  FOR UPDATE TO authenticated USING (false);
CREATE POLICY "Block direct deletes" ON public.creators
  FOR DELETE TO authenticated USING (false);

-- Répéter pour monthly_tracking, videos, rushes, admin_audit_log
```

---

### 1.2 🟠 Versioning contrat non vérifié au routing

**Fichier :** `src/features/auth/server/resolve-auth-session.ts:104-108`

Modifier le check `contract_signed_at` pour aussi vérifier que la version signée correspond à `AFFILIATE_CONTRACT_VERSION` :

```typescript
// Actuellement
const hasSignedContract = Boolean(creator.contractSignedAt);

// À faire : ajouter une vérification de version
// Option simple : stocker dans creator la version signée
// Option via JOIN : récupérer la dernière signature et comparer le checksum
```

**Migration à créer :**
```sql
ALTER TABLE public.creators
  ADD COLUMN contract_version text;
```

**Use-case à modifier :** `src/app/api/contract/sign/route.ts` — persister `AFFILIATE_CONTRACT_VERSION` dans `creators.contract_version` à la signature.

---

### 1.3 🟠 Politique RLS payout profiles non optimisée

**Migration à créer :**
```sql
-- Fix: "Admins read all payout profiles" sans initplan
DROP POLICY IF EXISTS "Admins read all payout profiles" ON public.creator_payout_profiles;
CREATE POLICY "Admins read all payout profiles"
  ON public.creator_payout_profiles
  FOR SELECT TO authenticated
  USING (
    coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
  );

-- Fix: politique SELECT redondante (FOR ALL la couvre déjà)
DROP POLICY IF EXISTS "Creators can view own payout profile" ON public.creator_payout_profiles;
```

---

### 1.4 🟠 Audit log fire-and-forget sans logging d'erreur

**Fichiers :** toutes les routes admin qui appellent `void writeAdminAuditLog(...)`

Remplacer par :
```typescript
writeAdminAuditLog(...).catch((err) =>
  console.error("[audit-log-failure]", { action, entityId, error: err.message })
);
```

---

### 1.5 🟡 Contraintes DB manquantes

**Migration à créer :**
```sql
-- S-03: entity_type avec valeurs connues
ALTER TABLE public.admin_audit_log
  ADD CONSTRAINT chk_admin_audit_log_entity_type
  CHECK (entity_type IN ('creator','video','monthly_tracking','application','contract','payout_profile','video_rate'));

-- S-06: créateur actif doit avoir user_id
ALTER TABLE public.creators
  ADD CONSTRAINT chk_active_creator_has_user_id
  CHECK (status != 'actif' OR user_id IS NOT NULL);

-- S-07: delivered JSONB avec clés obligatoires
ALTER TABLE public.monthly_tracking
  ADD CONSTRAINT chk_delivered_keys
  CHECK (delivered ?& ARRAY['OOTD','TRAINING','BEFORE_AFTER','SPORTS_80S','CINEMATIC']);

-- T-01: month avec mois valides (01-12)
ALTER TABLE public.monthly_tracking
  DROP CONSTRAINT IF EXISTS monthly_tracking_month_check;
ALTER TABLE public.monthly_tracking
  ADD CONSTRAINT monthly_tracking_month_check
  CHECK (month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$');

-- S-04: file_size_mb en NUMERIC
ALTER TABLE public.videos ALTER COLUMN file_size_mb TYPE numeric(10,2);
ALTER TABLE public.rushes ALTER COLUMN file_size_mb TYPE numeric(10,2);
```

---

### 1.6 🟡 Supprimer/optimiser les index DB

**Migration à créer :**
```sql
-- I-01: index redondant (couvert par le composite)
DROP INDEX IF EXISTS public.idx_monthly_tracking_creator_id;

-- I-03: index inutile (faible sélectivité, jamais filtré)
DROP INDEX IF EXISTS public.idx_creator_payout_profiles_method;

-- I-04: remplacer l'index générique par un index partiel pour la hot query
DROP INDEX IF EXISTS public.idx_videos_status;
CREATE INDEX idx_videos_pending_review
  ON public.videos (created_at DESC)
  WHERE status = 'pending_review';
```

---

## SPRINT 2 — Flow créateur : blocages critiques (Semaine 2)

### 2.1 🔴 Aucune notification d'approbation de candidature

**Impact :** taux de conversion approval → contrat signé potentiellement très bas.

**Solution minimale via Supabase Auth email :**  
Dans `src/application/use-cases/review-creator-application.ts`, après l'approbation :

```typescript
// Utiliser supabase.auth.admin.generateLink pour envoyer un email magique
// OU via Supabase SMTP : créer un template "application_approved"
await supabaseAdmin.auth.admin.generateLink({
  type: "magiclink",
  email: creator.email,
  options: { redirectTo: `${siteUrl}/contract` }
});
// Envoyer via l'email provider configuré dans Supabase
```

**Alternative MVP :** logguer l'action dans `admin_audit_log` avec un flag `email_sent: false` et créer un endpoint cron qui envoie les emails en attente.

---

### 2.2 🔴 Dead-end : créateur `approved` sans row `creators` provisionnée

**Fichier :** `src/features/auth/server/resolve-auth-session.ts:91-119`

Ajouter un état explicite quand `application.status === "approved"` mais `creator` est null (provisioning en cours) :

```typescript
if (applicationStatus === "approved" && !creatorId) {
  // L'admin a approuvé mais le creator n'est pas encore provisionné
  // (race condition ou erreur de provisioning)
  return { target: "/onboarding", pendingProvisioning: true };
}
```

**Côté UI** `src/features/apply/onboarding-flow.tsx` : détecter ce cas et afficher un panneau "Ton profil est en cours de configuration, reviens dans quelques minutes."

---

### 2.3 🟠 Scroll-gate contrat bloquant sur mobile

**Fichier :** `src/features/contract/contract-page.tsx:159-182`

Améliorations :
1. Ajouter une flèche animée vers le bas dans le coin du div scrollable (`position: absolute, bottom: 8px, animate-bounce`) qui disparaît à `reachedEnd = true`
2. Ajouter un bouton fallback "J'ai lu le contrat" visible après 10 secondes (pour les lecteurs d'écran et mobile)
3. Remplacer `max-h-[420px]` par `max-h-[60vh]` sur mobile pour donner plus d'espace

---

### 2.4 🟠 Double navigation après signature du contrat

**Fichier :** `src/features/contract/contract-page.tsx:107-109`

```typescript
// Avant (problématique en Next.js 15)
router.replace("/dashboard");
router.refresh();

// Après : attendre la navigation avant de refresh
await router.replace("/dashboard");
// router.refresh() est inutile si replace navigue vers une nouvelle page RSC
// Le RSC sera re-fetché automatiquement
```

---

### 2.5 🟠 Dashboard : sections fermées + next-step invisible pour nouveau créateur

**Fichier :** `src/features/creator-dashboard/creator-dashboard-page.tsx:101-127`

1. Ouvrir `<details open>` sur la section "Activité récente" par défaut
2. Ajouter un bloc "Prochaine étape" en haut du dashboard si `data.upload.recentVideos.length === 0` :
```tsx
{data.upload.recentVideos.length === 0 && (
  <CallToActionCard
    title="Poste ta première vidéo"
    description="Choisis un type, filme, upload — c'est parti."
    href="/uploads"
    cta="Aller aux uploads"
  />
)}
```

---

### 2.6 🟠 Settings : données stales après save IBAN

**Fichier :** `src/features/creator-settings/creator-settings-page.tsx:110-113`

```typescript
// Après savePayoutProfile() réussi
setStatusMessage("Profil de paiement sauvegardé.");
router.refresh(); // Recharger les props du Server Component
```

---

### 2.7 🟠 Confirmation email sans délai d'expiration visible

**Fichier :** `src/features/apply/signup-page.tsx:91-107`

Ajouter au message de confirmation :
```tsx
<p>Ce lien est valable <strong>24 heures</strong>. Pense à vérifier tes spams.</p>
```

---

### 2.8 🟠 Upload : confirmer le type avant lancement

**Fichier :** `src/features/creator-dashboard/components/upload-card.tsx`

Avant de déclencher `startUpload()`, afficher un Dialog de confirmation :
```tsx
<Dialog>
  <DialogTitle>Confirmer l'upload</DialogTitle>
  <DialogDescription>
    Tu vas uploader <strong>{file.name}</strong> en tant que <strong>{selectedType}</strong>.
    Cette action ne peut pas être annulée.
  </DialogDescription>
  <Button onClick={startUpload}>Confirmer</Button>
</Dialog>
```

---

### 2.9 🟡 Race condition post-signup : `refreshSession` si Supabase lent

**Fichier :** `src/features/apply/hooks/use-signup-flow.ts:80-83`

Ajouter un retry avec backoff exponentiel sur `auth.refreshSession()` :
```typescript
let retries = 3;
while (retries > 0) {
  const session = await auth.refreshSession();
  if (session?.user) break;
  await new Promise(r => setTimeout(r, 500 * (4 - retries)));
  retries--;
}
```

---

### 2.10 🟡 Champ "Pays" texte libre → select

**Fichier :** `src/features/apply/components/step-personal-form.tsx`

Remplacer `<Input placeholder="FR">` par un `<select>` avec les pays courants en tête (France, Belgique, Suisse, Canada, puis reste par ordre alphabétique).

---

## SPRINT 3 — Performance (Semaine 3)

### 3.1 🔴 Batch review vidéos O(n) requêtes séquentielles

**Fichier :** `src/app/api/admin/videos/review-batch/route.ts:110`

Créer une RPC SQL batch :
```sql
-- supabase/migrations/YYYYMMDD_batch_review_rpc.sql
CREATE OR REPLACE FUNCTION public.review_videos_batch(
  p_video_ids uuid[],
  p_status text,
  p_rejection_reason text,
  p_reviewed_by uuid
) RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_video videos%ROWTYPE;
BEGIN
  FOR v_video IN
    SELECT * FROM public.videos WHERE id = ANY(p_video_ids) FOR UPDATE
  LOOP
    UPDATE public.videos
    SET status = p_status, rejection_reason = p_rejection_reason,
        reviewed_at = now(), reviewed_by = p_reviewed_by
    WHERE id = v_video.id;

    -- Recalculer delivered pour ce tracking
    UPDATE public.monthly_tracking mt
    SET delivered = (
      SELECT jsonb_object_agg(video_type, cnt) FROM (
        SELECT video_type, count(*) as cnt
        FROM public.videos
        WHERE monthly_tracking_id = v_video.monthly_tracking_id AND status = 'approved'
        GROUP BY video_type
      ) sub
    )
    WHERE mt.id = v_video.monthly_tracking_id;
  END LOOP;
END;
$$;
```

**Repository :** ajouter `reviewVideosBatch(ids, status, rejectionReason, reviewedBy)`.  
**Use-case / route :** remplacer la boucle for par un seul appel.

---

### 3.2 🔴 Double-fetch trackings (dashboard + export)

**Fichiers :**
- `src/application/use-cases/get-admin-dashboard-data.ts:75-87`
- `src/application/use-cases/get-admin-payments-export-data.ts:38-51`

**Repository :** ajouter `getLatestTrackingMonth(): Promise<string | null>` :
```typescript
const { data } = await client
  .from("monthly_tracking")
  .select("month")
  .order("month", { ascending: false })
  .limit(1)
  .single();
return data?.month ?? null;
```

Remplacer le double-fetch par :
```typescript
const month = input?.month ?? await repository.getLatestTrackingMonth();
if (!month) return emptyDashboard();
const trackings = await repository.listMonthlyTrackings(month);
```

---

### 3.3 🔴 Zero Cache-Control sur les API routes read-only

**Fichiers à modifier :**

| Route | Cache-Control à ajouter |
|-------|------------------------|
| `src/app/api/admin/config/route.ts` | `private, s-maxage=60, stale-while-revalidate=120` |
| `src/app/api/videos/preview/route.ts` | `private, max-age=240` (signed URLs valides 300s) |
| `src/app/api/rushes/preview/route.ts` | `private, max-age=240` |
| `src/app/api/admin/applications/route.ts` | `private, s-maxage=30, stale-while-revalidate=60` |

Ajouter dans chaque handler :
```typescript
const response = NextResponse.json(data);
response.headers.set("Cache-Control", "private, s-maxage=60, stale-while-revalidate=120");
return response;
```

---

### 3.4 🔴 `cache: "no-store"` abusif sur les fetch clients

Retirer `cache: "no-store"` des fetch non-sensibles :
- `/api/onboarding/options` → utiliser `cache: "default"` ou `{ next: { revalidate: 300 } }`
- `/api/admin/config` → `cache: "default"` (les tarifs changent rarement)

Garder `cache: "no-store"` uniquement pour :
- `/api/auth/me` (session)
- `/api/auth/redirect-target` (session)

---

### 3.5 🟠 ISR sur les pages quasi-statiques

**Fichiers :**
```typescript
// src/app/apply/page.tsx
export const revalidate = 3600; // getApplyPageData() ne touche pas la DB

// src/app/join/page.tsx
export const revalidate = 3600;

// src/app/creators/page.tsx
export const revalidate = 300; // même que la landing principale
```

---

### 3.6 🟠 `unstable_cache` sur `listRates()`

**Fichier :** `src/application/dependencies.ts` ou `src/infrastructure/supabase/supabase-creator-repository.ts`

```typescript
import { unstable_cache } from "next/cache";

export const getCachedRates = unstable_cache(
  async () => getRepository().listRates(),
  ["video-rates"],
  { revalidate: 3600, tags: ["rates"] }
);
```

**Route `PUT /api/admin/config/rates`** : ajouter `revalidateTag("rates")` après la mutation (en plus du `revalidatePath` existant).

---

### 3.7 🟠 `next/dynamic` pour les composants lourds

**Fichiers :**
```typescript
// src/features/admin-dashboard/admin-dashboard-page.tsx
const VideoPreviewModal = dynamic(() => import("@/components/ui/video-preview-modal"), { ssr: false });
const ValidationQueue = dynamic(() => import("./components/validation-queue"), { ssr: false });

// src/features/creator-dashboard/creator-dashboard-page.tsx
const UploadCard = dynamic(() => import("./components/upload-card"), { ssr: false });
```

---

### 3.8 🟠 `AuthProvider` : éviter le fetch `/api/auth/me` à chaque navigation

**Fichier :** `src/features/auth/context/auth-context.tsx:147-163`

Stocker l'état d'auth initial dans un cookie léger lisible côté client (ex: `rm-auth-hint={"role":"admin","target":"/admin"}`), mis à jour par les API guards. Le `AuthProvider` lit ce cookie au mount et ne fetche `/api/auth/me` que si le cookie est absent ou si un event Supabase `onAuthStateChange` se déclenche.

---

### 3.9 🟠 `getCreatorDashboardData` utilisé sur 4 pages dont 3 ne l'utilisent qu'en partie

**Créer use-cases dédiés :**
- `getCreatorUploadsData()` : creator + rates + tracking courant + videos du mois (sans paymentHistory, rushes, activity)
- `getCreatorPayoutsData()` : creator + trackings + paymentHistory (sans videos, rushes)

**Pages à modifier :**
- `src/app/uploads/page.tsx` → `getCreatorUploadsData()`
- `src/app/payouts/page.tsx` → `getCreatorPayoutsData()`

---

### 3.10 🟡 `listCreatorsByIds()` batch

**Repository interface :** ajouter `listCreatorsByIds(ids: string[]): Promise<Creator[]>`

**Implementation :**
```typescript
const { data } = await client
  .from("creators")
  .select(CREATOR_COLS)
  .in("id", ids);
```

**Use-cases :** remplacer `listCreators()` + Map lookup par `listCreatorsByIds(trackedCreatorIds)` dans `getAdminDashboardData`.

---

## SPRINT 4 — Flow admin & logique métier (Semaine 4)

### 4.1 🟠 Aucune API pour gérer les statuts créateur

**Nouvelle route :** `src/app/api/admin/creators/[id]/status/route.ts`
```typescript
// PATCH - transition de statut
// Body: { status: "actif" | "pause" | "inactif", reason?: string }
// Guards: requireApiRole("admin"), isAllowedOrigin
```

**Repository :** ajouter `updateCreatorStatus(id: string, status: CreatorStatus): Promise<void>`

**UI :** ajouter un `<select>` de statut + bouton "Appliquer" dans `admin-creator-detail-page.tsx`

---

### 4.2 🟠 Créateur `pause`/`inactif` peut toujours uploader

**Fichier :** `src/application/use-cases/resolve-upload-tracking.ts:21-24`

```typescript
const creator = await repository.getCreatorByUserId(userId);
if (!creator) throw new Error("CREATOR_NOT_FOUND");
if (creator.status !== "actif") {
  throw new Error(`CREATOR_NOT_ACTIVE: statut actuel = ${creator.status}`);
}
```

**Route :** transformer en HTTP 403 avec message approprié.

---

### 4.3 🟠 Review-batch peut downgrader `approved → rejected`

**Fichier :** `src/app/api/admin/videos/review-batch/route.ts`

Avant de lancer le batch, vérifier l'état actuel :
```typescript
// Dans la future RPC SQL batch ou dans le use-case :
// Ne pas traiter les vidéos déjà dans un état terminal contraire
// approved → ne peut être que rejected avec une raison explicite
// Ajouter un flag { forceDowngrade: boolean } dans le payload
```

**UI :** dans `ValidationQueue`, désactiver le batch "Rejeter" pour les vidéos déjà `approved`.

---

### 4.4 🟠 Lien retour manquant sur `/admin/creators/[id]`

**Fichier :** `src/features/admin-creators/admin-creator-detail-page.tsx`

Ajouter en haut de page :
```tsx
<Link href="/admin" className="...">
  ← Retour au dashboard
</Link>
```

---

### 4.5 🟠 Lien post-approbation candidature → mauvais dashboard

**Fichier :** `src/features/admin-applications/admin-applications-page.tsx:428-437`

Remplacer le lien vers `/dashboard` par `/admin/creators/[id]` si le `creator.id` est disponible dans la réponse de l'API de review.

---

### 4.6 🟠 Avertissement avant modification d'un tarif

**Fichier :** `src/features/admin-config/components/rates-table.tsx:56`

Avant de soumettre la mutation, afficher un Dialog :
```tsx
<Dialog>
  <DialogTitle>Modifier le tarif {type} ?</DialogTitle>
  <DialogDescription>
    Ce changement s'applique immédiatement à tous les calculs de paiement.
    Les paiements déjà marqués "payé" ne sont pas affectés.
  </DialogDescription>
</Dialog>
```

---

### 4.7 🟠 Sélecteur de mois sur le dashboard admin

**Fichier :** `src/features/admin-dashboard/admin-dashboard-page.tsx`

Ajouter un `<select>` de mois en haut de page, alimenté par `data.availableMonths` (liste des mois distincts en base).  
La sélection met à jour `?month=YYYY-MM` dans l'URL et recharge la page (Server Component).

---

### 4.8 🟠 `getAdminCreatorDetailData` throw → 500 au lieu de 404

**Fichier :** `src/application/use-cases/get-admin-creator-detail-data.ts:84`

```typescript
// Avant
if (!creator) throw new Error("Creator not found");

// Après
if (!creator) notFound(); // import { notFound } from "next/navigation"
```

---

### 4.9 🟡 Application `rejected` impossible à re-soumettre

**Fichier :** `src/app/api/applications/me/route.ts:56-64`

Décision à prendre avec l'équipe :
- **Option A** : permettre la re-soumission après rejet (retirer `rejected` du check terminal, remettre en `draft`)
- **Option B** : créer une API admin `POST /api/admin/applications/[id]/allow-resubmit` qui reset le statut à `draft`

---

### 4.10 🟡 `fetchOnboardingOptions()` fetché mais non consommé

**Fichier :** `src/features/apply/hooks/use-onboarding-flow.ts:207`

Supprimer l'appel à `fetchOnboardingOptions()` si les données ne sont pas utilisées, ou les utiliser pour afficher des hints dynamiques par step.

---

### 4.11 🟡 Historique des modifications de tarifs

**Nouvelle section** dans `AdminConfigPage` : afficher les N dernières entrées de `admin_audit_log` où `action LIKE 'config.rate.%'`, avec date, admin, ancienne/nouvelle valeur.

---

## SPRINT 5 — Accessibilité & Copy (Semaine 5)

### 5.1 🔴 Accents français manquants (80%+ des chaînes)

Faire un grep exhaustif de toutes les chaînes sans accents dans les fichiers `.tsx` :

```bash
grep -rn '"[^"]*[A-Za-z][aeiouy][A-Za-z]' src/features/ src/app/ src/components/
```

Corrections prioritaires (liste non exhaustive) :

| Avant | Après |
|-------|-------|
| `"Onboarding createur"` | `"Onboarding créateur"` |
| `"Dossier refuse"` | `"Dossier refusé"` |
| `"Abonnes TikTok"` | `"Abonnés TikTok"` |
| `"Methode de paiement"` | `"Méthode de paiement"` |
| `"Etape 1 - Infos personnelles"` | `"Étape 1 - Infos personnelles"` |
| `"Reseaux et audience"` | `"Réseaux et audience"` |
| `"Brouillon restaure"` | `"Brouillon restauré"` |
| `"Tes gains estimes"` | `"Tes gains estimés"` |
| `"Videos validees"` | `"Vidéos validées"` |
| `"Candidatures createurs"` | `"Candidatures créateurs"` |
| `"Precedent"` | `"Précédent"` |
| `"Aller a la connexion"` | `"Aller à la connexion"` |

---

### 5.2 🔴 Contraste insuffisant : `text-foreground/XX` généralisé

**Problème systémique** : `text-foreground/40` à `/70` donne des ratios de 1.9:1 à 3.2:1 (minimum WCAG AA : 4.5:1).

**Solution globale :**

1. Définir une variable sémantique dans `tailwind.config.ts` :
```typescript
// Remplacer text-foreground/65 par text-subtle partout
"subtle": "hsl(var(--muted-foreground))", // ~7:1 sur blanc, ~4.8:1 sur bg
```

2. Grep et remplacer les occurrences sous `/70` :
```bash
grep -rn 'text-foreground/[1-6][0-9]\b' src/
```

3. Règle : **ne jamais descendre sous `text-foreground/75`** pour du texte informatif.

---

### 5.3 🔴 Marquee infinie sans bouton Pause (WCAG 2.2.2 Niveau A)

**Fichier :** `src/features/apply/components/apply-marketing-column.tsx:29`

```tsx
const [paused, setPaused] = useState(false);

<button
  onClick={() => setPaused(p => !p)}
  aria-label={paused ? "Reprendre le défilement" : "Mettre en pause le défilement"}
>
  {paused ? <Play size={14} /> : <Pause size={14} />}
</button>

<div className={cn("animate-marquee-vertical", paused && "animate-none")}>
```

---

### 5.4 🔴 Messages d'erreur formulaire sans `aria-describedby`

**Fichiers :**
- `src/features/apply/components/step-personal-form.tsx`
- `src/features/apply/components/step-profile-form.tsx`
- `src/features/creator-settings/creator-settings-page.tsx`

Pattern à appliquer (modèle : `auth-credentials-panel.tsx`) :
```tsx
const errorId = useId();
<Input
  aria-invalid={!!error}
  aria-describedby={error ? errorId : undefined}
/>
{error && (
  <p id={errorId} role="alert" className="text-sm text-destructive">
    {error}
  </p>
)}
```

---

### 5.5 🟠 Menu mobile sans focus trap

**Fichier :** `src/components/layout/site-header.tsx:185`

```tsx
// Ajouter aria-hidden et inert sur le panneau fermé
<nav
  id="mobile-site-nav"
  aria-hidden={!mobileOpen}
  {...(!mobileOpen ? { inert: "" } : {})}
>
```

Gérer le focus :
```typescript
useEffect(() => {
  if (mobileOpen) {
    firstMenuItemRef.current?.focus();
  } else {
    hamburgerRef.current?.focus();
  }
}, [mobileOpen]);
```

---

### 5.6 🟠 `ValidationQueue` sans `aria-sort` ni navigation clavier

**Fichier :** `src/features/admin-dashboard/components/validation-queue.tsx:386-399`

Reprendre le pattern de `DataTable` (`src/components/ui/data-table.tsx:82-109`) :
- `tabIndex={canSort ? 0 : undefined}` sur chaque `<TableHead>`
- `onKeyDown` pour Enter/Espace
- `aria-sort={direction === "asc" ? "ascending" : direction === "desc" ? "descending" : "none"}`

---

### 5.7 🟠 Selects natifs sans label accessible

**Fichiers :**
- `src/features/creator-uploads/creator-uploads-page.tsx:41`
- `src/features/creator-payouts/creator-payouts-page.tsx:61`
- `src/features/admin-creators/admin-creator-detail-page.tsx:392`

```tsx
<select aria-label="Sélectionner la période">
```

OU transformer le `<p>` précédent en `<label htmlFor="period-select">`.

---

### 5.8 🟠 Upload : progression non annoncée

**Fichier :** `src/features/creator-dashboard/components/upload-card.tsx:484`

```tsx
<div role="status" aria-live="polite" aria-atomic="true">
  {uploadProgress > 0 && uploadProgress < 100 && (
    `Upload en cours... ${uploadProgress}%`
  )}
  {uploadProgress === 100 && statusMessage}
</div>
```

---

### 5.9 🟡 Tables admin sans caption

**Fichiers :** `validation-queue.tsx`, `payments-table.tsx`, `creators-master-table.tsx`, `monthly-tracking-table.tsx`

```tsx
<Table aria-label="File de validation des vidéos">
// ou
<TableCaption>File de validation des vidéos</TableCaption>
```

---

### 5.10 🟡 Supprimer le message "édition self-serve à venir"

**Fichier :** `src/features/creator-settings/creator-settings-page.tsx:151`

Remplacer par un lien de contact direct :
```tsx
<p>Pour modifier ton profil, contacte-nous sur <a href="mailto:support@retromuscle.net">support@retromuscle.net</a>.</p>
```

---

### 5.11 🟡 Heading hierarchy cassée dans le footer

**Fichier :** `src/components/layout/site-footer.tsx:26,44,55`

Remplacer `<h4>` par `<h2>` ou `<h3>` selon la hiérarchie de la page.

---

## SPRINT 6 — TypeScript & Tests (Semaines 6–7)

### 6.1 🟠 Générer les types Supabase (52 `as` casts à éliminer)

```bash
npx supabase gen types typescript --project-id <project-id> > src/infrastructure/supabase/database.types.ts
```

**Modifier `src/infrastructure/supabase/server-client.ts` :**
```typescript
import type { Database } from "./database.types";
createClient<Database>(url, serviceKey, { ... });
```

Supprimer les 7 interfaces manuelles (`CreatorRow`, `MonthlyTrackingRow`, etc.) et laisser les types générés piloter les mappings.

---

### 6.2 🟠 Couverture tests : zones critiques (0% actuellement)

**Ordre de priorité :**

**6.2.1 — Tests `resolve-auth-session.ts`**
- Cas : role admin via `app_metadata.role`
- Cas : affiliate avec creator → target `/dashboard`
- Cas : affiliate approuvé sans creator → target `/onboarding` + flag `pendingProvisioning`
- Cas : affiliate sans contrat signé → target `/contract`
- Cas : affiliate sans version contrat courante → target `/contract`

**6.2.2 — Tests `review-creator-application.ts`**
- Cas happy path : application pending → approbation → creator créé + tracking créé
- Cas double approbation (idempotence)
- Cas application non trouvée (404)
- Cas application déjà reviewée (409)

**6.2.3 — Tests `review-video-upload.ts`**
- Cas approbation → delivered count mis à jour
- Cas rejet → delivered count inchangé
- Cas vidéo déjà reviewée

**6.2.4 — Tests routes API critiques** (3 au minimum)
- `POST /api/admin/applications/review`
- `POST /api/admin/videos/review-batch`
- `POST /api/admin/payments/mark-paid`

**6.2.5 — Activer `InMemoryCreatorRepository` dans les tests de use-cases**
Remplacer les `vi.mock()` par `new InMemoryCreatorRepository()` pour des tests plus robustes.

---

### 6.3 🟡 Élargir la couverture Vitest

**Fichier :** `vitest.config.ts`

```typescript
coverage: {
  include: [
    "src/lib/**",
    "src/domain/**",
    "src/application/use-cases/**",  // ← ajouter
    "src/features/auth/server/**",   // ← ajouter
  ],
  thresholds: {
    lines: 60,    // objectif progressif
    functions: 60
  }
}
```

---

## SPRINT 7 — Dette technique & nettoyage (Semaine 8)

### 7.1 🟡 ESLint v8 → v9 + `next lint` deprecated

1. Désinstaller `eslint@8`, installer `eslint@9`
2. Migrer `.eslintrc.json` vers `eslint.config.mjs` (flat config)
3. Remplacer `"lint": "next lint"` par `"lint": "eslint src/"` dans `package.json`
4. Ajouter `@typescript-eslint/eslint-plugin` avec les règles :
   - `@typescript-eslint/no-floating-promises: error`
   - `@typescript-eslint/no-explicit-any: error`
   - `@typescript-eslint/consistent-type-imports: warn`
5. Ajouter Prettier + `eslint-config-prettier`

---

### 7.2 🟡 Créer `.env.example`

```bash
# RetroMuscle — variables d'environnement requises
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # JAMAIS committer la vraie valeur
ADMIN_EMAILS=admin@example.com

NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Optionnel — Rate limiting en production
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

---

### 7.3 🟡 Scripts npm manquants

**Fichier :** `package.json`

```json
{
  "scripts": {
    "lint:fix": "eslint src/ --fix",
    "format": "prettier --write src/",
    "format:check": "prettier --check src/",
    "supabase:types": "supabase gen types typescript --project-id $SUPABASE_PROJECT_ID > src/infrastructure/supabase/database.types.ts",
    "test:ci": "vitest run --coverage",
    "build:check": "npm run typecheck && npm run lint && npm run build"
  }
}
```

---

### 7.4 🟡 Supprimer les fichiers orphelins

| Fichier | Action |
|---------|--------|
| `src/lib/progress.ts` | Supprimer (importé par personne) |
| `src/domain/services/calculate-quotas.ts` | Supprimer (vide intentionnellement) |
| `src/domain/constants/packages.ts` | Supprimer (vide, zéro référence) |
| `src/domain/constants/mixes.ts` | Supprimer (vide, zéro référence) |
| `src/features/admin-config/components/mixes-table.tsx` | Supprimer |
| `src/features/admin-config/components/packages-table.tsx` | Supprimer |
| `src/features/saas-landing/components/hero-lab/variant-a/` | Supprimer (non importé) |
| `src/features/saas-landing/components/hero-lab/variant-b/` | Supprimer (non importé) |
| `src/features/saas-landing/components/hero-lab/variant-c/` | Supprimer (non importé, contient texte anglais) |

---

### 7.5 🟡 Supprimer les tables DB orphelines

**Migration à créer (après validation équipe) :**
```sql
DROP TABLE IF EXISTS public.package_definitions CASCADE;
DROP TABLE IF EXISTS public.mix_definitions CASCADE;
```

---

### 7.6 🟡 Architecture : corriger le bypass repository dans `applications/me`

**Fichier :** `src/app/api/applications/me/route.ts:16-31`

Remplacer les requêtes Supabase brutes par des appels au repository :
```typescript
// Avant : createSupabaseServerClient().from("creator_applications").select(...)
// Après
const application = await getRepository().getApplicationByUserId(session.userId);
```

---

### 7.7 🟡 `resolveCurrentMonth` dupliquée

**Fichiers :**
- `src/application/use-cases/get-admin-dashboard-data.ts:76`
- `src/application/use-cases/get-admin-payments-export-data.ts:40`

Ces deux use-cases construisent le mois courant manuellement. Remplacer par `resolveCurrentMonth()` depuis `src/application/use-cases/shared.ts:4`.

---

### 7.8 🟡 `optimizePackageImports` pour `@tanstack/react-table`

**Fichier :** `next.config.mjs`

```javascript
experimental: {
  optimizePackageImports: ["lucide-react", "@tanstack/react-table"], // ← ajouter
}
```

---

### 7.9 🟡 `@next/bundle-analyzer`

```bash
npm install -D @next/bundle-analyzer
```

```javascript
// next.config.mjs
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});
```

```json
// package.json
"analyze": "ANALYZE=true next build"
```

---

## Récapitulatif par sprint

| Sprint | Thème | Items | Effort estimé |
|--------|-------|-------|--------------|
| **S0** | Hotfixes critiques | 7 items | 1–2 jours |
| **S1** | Sécurité & RLS | 6 items | 2 jours |
| **S2** | Flow créateur critiques | 10 items | 3 jours |
| **S3** | Performance | 10 items | 3 jours |
| **S4** | Flow admin & logique métier | 11 items | 3 jours |
| **S5** | Accessibilité & Copy | 11 items | 3 jours |
| **S6** | TypeScript & Tests | 3 items | 5 jours |
| **S7** | Dette & nettoyage | 9 items | 2 jours |
| **Total** | | **67 items** | **~22 jours** |

---

## Quick Wins (< 30 min chacun, faire en premier)

Ces items sont trivials mais à fort impact visible :

1. ✅ Créer `.env.example`
2. ✅ Ajouter `router.refresh()` après save IBAN dans settings
3. ✅ Lien "← Retour" sur `/admin/creators/[id]`
4. ✅ `export const revalidate = 3600` sur `/apply` et `/join`
5. ✅ Supprimer les fichiers orphelins (7 fichiers)
6. ✅ `optimizePackageImports: ["@tanstack/react-table"]`
7. ✅ Corriger le lien post-approbation → `/admin/creators/[id]`
8. ✅ Ajouter `aria-label` sur les selects de période
9. ✅ `notFound()` dans `getAdminCreatorDetailData`
10. ✅ Supprimer `void` des audit logs → ajouter `.catch(console.error)`
