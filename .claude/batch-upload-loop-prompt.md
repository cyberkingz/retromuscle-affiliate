# Batch Upload — Ralph Loop Instructions

## Mission
Implémenter les 12 phases du batch upload sur la branche `feature/batch-upload`.
Critères de succès : implémentation GAFAM-grade, TypeScript strict, zéro régression prod, tous les review skills passants.

## Règles globales
- Toutes les modifications sont ADDITIVES — le flow single-video existant ne change jamais
- Deploy order : code déployable AVANT que la migration tourne (pattern du projet)
- Après CHAQUE phase : `npx tsc --noEmit` + vérifier que les tests Vitest passent
- Après CHAQUE phase, appeler dans l'ordre : /bmad:bmm:workflows:code-review → /simplify → /review → /security-review → /react-best-practices

## Stack
Next.js 15 App Router, TypeScript strict, Supabase (PostgreSQL + Storage), DDD (domain → application → features → app), repository pattern avec DI.

## PHASE 1 — Migration SQL
**Fichier** : `supabase/migrations/20260427000000_add_batch_submissions.sql`

```sql
-- Deploy order: code d'abord, migration ensuite
-- Nouvelle table batch_submissions
create table public.batch_submissions (
  id                  uuid primary key default gen_random_uuid(),
  monthly_tracking_id uuid not null references public.monthly_tracking(id) on delete cascade,
  creator_id          uuid not null references public.creators(id) on delete cascade,
  video_type          text not null check (video_type in ('OOTD','TRAINING','BEFORE_AFTER','SPORTS_80S','CINEMATIC')),
  status              text not null default 'pending_review'
                      check (status in ('uploaded','pending_review','approved','rejected','revision_requested')),
  min_clips_required  integer not null default 4,
  rejection_reason    text,
  reviewed_at         timestamptz,
  reviewed_by         uuid,
  created_at          timestamptz not null default timezone('utc', now())
);
create index idx_batch_submissions_pending on public.batch_submissions(created_at desc) where status = 'pending_review';
create index idx_batch_submissions_creator on public.batch_submissions(creator_id);
create index idx_batch_submissions_tracking on public.batch_submissions(monthly_tracking_id);

-- Ajout FK nullable sur videos (rétrocompatible)
alter table public.videos
  add column batch_submission_id uuid references public.batch_submissions(id) on delete cascade;
create index idx_videos_batch_submission on public.videos(batch_submission_id) where batch_submission_id is not null;

-- RLS
alter table public.batch_submissions enable row level security;
create policy "creators_select_own_batches" on public.batch_submissions
  for select using (
    creator_id in (select id from public.creators where user_id = auth.uid())
  );
create policy "admins_all_batches" on public.batch_submissions
  for all using (
    (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin'
  );

-- RPC : incrementer delivered[video_type] += 1 (pas de recount — les clips ont status "uploaded" et ne doivent pas etre comptes)
create or replace function public.review_batch_and_update_tracking(
  p_batch_id         uuid,
  p_status           text,
  p_rejection_reason text default null,
  p_reviewed_by      uuid default null
)
returns json
language plpgsql
security definer
as $$
declare
  v_batch    public.batch_submissions%rowtype;
  v_tracking public.monthly_tracking%rowtype;
begin
  if p_status not in ('approved', 'rejected', 'revision_requested') then
    raise exception 'Invalid status: %', p_status;
  end if;

  update public.batch_submissions
  set
    status           = p_status,
    rejection_reason = case when p_status <> 'approved' then p_rejection_reason else null end,
    reviewed_at      = now(),
    reviewed_by      = p_reviewed_by
  where id = p_batch_id
  returning * into v_batch;

  if not found then
    raise exception 'Batch submission not found: %', p_batch_id;
  end if;

  if p_status = 'approved' then
    update public.monthly_tracking
    set delivered = jsonb_set(
      coalesce(delivered, '{}'::jsonb),
      array[v_batch.video_type],
      to_jsonb(coalesce((delivered ->> v_batch.video_type)::int, 0) + 1)
    )
    where id = v_batch.monthly_tracking_id
    returning * into v_tracking;
  else
    select * into v_tracking from public.monthly_tracking where id = v_batch.monthly_tracking_id;
  end if;

  return json_build_object(
    'batch',    row_to_json(v_batch),
    'tracking', row_to_json(v_tracking)
  );
end;
$$;
```

## PHASE 2 — Domain Types
**src/domain/types.ts** — AJOUTER à la fin (ne pas modifier les types existants) :
```typescript
export type UploadMode = "single" | "batch";

export interface BatchSubmission {
  id: string;
  monthlyTrackingId: string;
  creatorId: string;
  videoType: VideoType;
  status: VideoStatus;
  minClipsRequired: number;
  rejectionReason?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  createdAt: string;
}
```

**src/domain/constants/batch-rules.ts** (nouveau fichier) :
```typescript
import type { VideoType } from "@/domain/types";

export const BATCH_MIN_CLIPS: Partial<Record<VideoType, number>> = {
  OOTD: 4,
  TRAINING: 4,
  BEFORE_AFTER: 2,
  SPORTS_80S: 4,
  CINEMATIC: 4,
};

export const BATCH_SUPPORTED_TYPES: VideoType[] = Object.keys(BATCH_MIN_CLIPS) as VideoType[];
```

## PHASE 3 — Repository
**Lire attentivement** src/infrastructure/supabase/supabase-creator-repository.ts (~1200 lignes) et l'interface CreatorRepository avant de modifier.

Ajouter à l'interface (trouver le fichier de l'interface) :
```typescript
createBatchSubmission(input: { monthlyTrackingId: string; creatorId: string; videoType: VideoType; minClipsRequired: number }): Promise<BatchSubmission>;
getBatchSubmissionById(batchId: string): Promise<BatchSubmission | null>;
addClipToBatch(input: { batchSubmissionId: string; monthlyTrackingId: string; creatorId: string; videoType: VideoType; fileUrl: string; fileSizeMb: number }): Promise<VideoAsset>;
listBatchSubmissionsByStatus(status: VideoStatus): Promise<BatchSubmission[]>;
listBatchSubmissionsByTracking(monthlyTrackingId: string): Promise<BatchSubmission[]>;
reviewBatchAndUpdateTracking(input: { batchId: string; status: "approved" | "rejected" | "revision_requested"; rejectionReason?: string; reviewedBy?: string }): Promise<{ batch: BatchSubmission; tracking: MonthlyTracking }>;
```

Implémenter dans SupabaseCreatorRepository. Aussi :
- Étendre VIDEO_COLS pour inclure `batch_submission_id`
- Étendre mapVideo pour mapper `batch_submission_id` → `batchSubmissionId?: string`

La méthode addClipToBatch insère avec `status: "uploaded"` (jamais "pending_review" — les clips individuels ne doivent pas apparaître dans la queue admin).

## PHASE 4 — Use case record-batch-submission
**Nouveau fichier** : `src/application/use-cases/record-batch-submission.ts`

```typescript
import { getRepository } from "@/application/dependencies";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server-client";
import { resolveUploadTrackingForUser } from "./resolve-upload-tracking";
import { BATCH_MIN_CLIPS } from "@/domain/constants/batch-rules";
import type { BatchSubmission, VideoType } from "@/domain/types";
import { VIDEO_TYPES } from "@/domain/types";

export async function recordBatchSubmission(input: {
  userId: string;
  monthlyTrackingId: string;
  videoType: VideoType;
  clipKeys: string[];
  clipSizesMb: number[];
}): Promise<BatchSubmission> {
  // 1. Valider le type
  if (!VIDEO_TYPES.includes(input.videoType)) throw new Error(`Invalid videoType: ${input.videoType}`);

  // 2. Valider le minimum de clips
  const minClips = BATCH_MIN_CLIPS[input.videoType];
  if (!minClips) throw new Error(`Batch not supported for type: ${input.videoType}`);
  if (input.clipKeys.length < minClips) {
    throw new Error(`Minimum ${minClips} clips required for ${input.videoType}`);
  }
  if (input.clipKeys.length !== input.clipSizesMb.length) {
    throw new Error("clipKeys and clipSizesMb must have the same length");
  }

  // 3. Ownership check
  for (const key of input.clipKeys) {
    if (!key.startsWith(`${input.userId}/`)) throw new Error("Invalid clip key ownership");
  }

  // 4. Résoudre le tracking
  const context = await resolveUploadTrackingForUser({
    userId: input.userId,
    monthlyTrackingId: input.monthlyTrackingId,
  });

  // 5. Vérifier que chaque fichier existe en storage
  const supabase = createSupabaseServerClient();
  for (const key of input.clipKeys) {
    const { error } = await supabase.storage.from("videos").createSignedUrl(key, 10);
    if (error) throw new Error(`Clip not found in storage: ${key}`);
  }

  // 6. Créer le batch
  const repository = getRepository();
  const batch = await repository.createBatchSubmission({
    monthlyTrackingId: context.monthlyTrackingId,
    creatorId: context.creatorId,
    videoType: input.videoType,
    minClipsRequired: minClips,
  });

  // 7. Créer les clips
  for (let i = 0; i < input.clipKeys.length; i++) {
    await repository.addClipToBatch({
      batchSubmissionId: batch.id,
      monthlyTrackingId: context.monthlyTrackingId,
      creatorId: context.creatorId,
      videoType: input.videoType,
      fileUrl: input.clipKeys[i],
      fileSizeMb: Math.max(1, Math.ceil(input.clipSizesMb[i])),
    });
  }

  return batch;
}
```

## PHASE 5 — Use case review-batch-submission
**Nouveau fichier** : `src/application/use-cases/review-batch-submission.ts`

Miroir de review-video-upload.ts. Guards :
- Batch doit exister
- Impossible de changer le statut d'un batch déjà "approved"
- rejection/revision nécessite un rejectionReason non-vide

Appelle `repository.reviewBatchAndUpdateTracking`.

## PHASE 6 — Étendre get-creator-dashboard-data
Fichier : `src/application/use-cases/get-creator-dashboard-data.ts`

- Ajouter `repository.listBatchSubmissionsByTracking(currentTracking.id)` dans le Promise.all phase 2
- Ajouter `batches: BatchSubmission[]` au type de retour
- Inclure les batches dans pendingReviewCount, revisionCount, rejectedCount

## PHASE 7 — Étendre get-admin-dashboard-data
Fichier : `src/application/use-cases/get-admin-dashboard-data.ts`

- Ajouter `repository.listBatchSubmissionsByStatus("pending_review")` en parallèle dans le Promise.all existant
- Merger dans validationQueue avec `batchId?: string` (optionnel, rétrocompatible)
- Ne pas casser le type existant — extension additive uniquement

## PHASE 8 — API route créateur batch
**Nouveau fichier** : `src/app/api/creator/uploads/video/batch/route.ts`

Suivre EXACTEMENT le même pattern que `src/app/api/creator/uploads/video/route.ts` :
- isAllowedOrigin → rateLimit (20/min) → requireApiRole("affiliate")
- Payload : `{ monthlyTrackingId, videoType, clipKeys: string[], clipSizesMb: number[] }`
- Valider : clipKeys max 20, toutes commencent par `{userId}/`, count >= BATCH_MIN_CLIPS
- Appeler recordBatchSubmission
- Fire-and-forget email admin
- Return 201

## PHASE 9 — API route admin review-batch
**Nouveau fichier** : `src/app/api/admin/videos/review-batch-submission/route.ts`

Suivre EXACTEMENT le même pattern que `src/app/api/admin/videos/review/route.ts` :
- isAllowedOrigin → requireApiRole("admin")
- Payload : `{ batchId, status, rejectionReason? }`
- Appeler reviewBatchSubmission use case
- Return 200 `{ batch, tracking }`

## PHASE 10 — Upload Wizard UI
Fichier : `src/features/creator-uploads/components/upload-wizard.tsx`

RÈGLE ABSOLUE : le flow single existant (handleFile, signed-url, POST /video) ne change pas d'une ligne. Uniquement ajouter une branche conditionnelle.

Ajouts :
- State `uploadMode: UploadMode` (default "single")
- State `batchFiles: File[]`, `batchProgress: number[]`, `batchClipErrors: string[]`
- Toggle single/batch sur Step 1, visible uniquement pour BATCH_SUPPORTED_TYPES
- Step 3 batch : input multiple, liste clips, badge N/MIN (amber/vert), progress par clip
- handleBatchFiles : signed-url par clip → XHR séquentiel → POST /batch
- Step 4 success batch : message différent

## PHASE 11 — Admin Validation Queue UI
Chercher le composant validation queue dans `src/features/admin-*/`.

- Type discriminant : `batchId?: string` (défini = batch, undefined = single)
- Row batch : badge clip count, toggle galerie clips, actions → POST /review-batch-submission
- Comportement single : inchangé
- Bulk select fonctionne sur les deux

## PHASE 12 — Creator Dashboard batch display
Dans `src/features/creator-dashboard/` :
- Afficher les batches dans l'historique des uploads
- "Lot · N clips · Statut" avec badge de statut réutilisant les styles existants
- Compteurs (pending/revision/rejeté) incluent les batches (déjà wired en Phase 6)

## Checklist finale
- [ ] `npx tsc --noEmit` passe sans erreur
- [ ] `npx vitest run` passe sans régression
- [ ] Aucune modification des routes/composants existants sauf extensions additives
- [ ] Tous les review skills passants (/bmad:bmm:workflows:code-review, /simplify, /review, /security-review, /react-best-practices)
