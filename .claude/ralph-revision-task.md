# REVISION WORKFLOW — Ralph Loop Task Spec
# READ THIS FILE EVERY ITERATION before doing any work.

## Mission
Build the complete guided revision re-upload workflow for the RetroMuscle creator platform.
When a creator's video receives `revision_requested` status, they are directed to a dedicated
page `/uploads/[videoId]/revision` where they see the original video, the admin's correction
instructions, a locked-type re-upload wizard, and a version history timeline.

## Branch
feature/revision-workflow
(create if doesn't exist: `git checkout -b feature/revision-workflow` from current branch)

## Base directory
/Users/toni/Downloads/retromuscle-webapp

## Architecture rules (NEVER violate)
- DDD layered: domain → application → features → app. No framework imports in domain.
- Use cases call `getRepository()` at the TOP of the function body — not as a parameter.
- Zero `any`, zero `@ts-ignore`. TypeScript strict throughout.
- Auth guards on every API route (`requireApiRole`). Never trust client-sent creatorId.
- Storage ownership check: `fileUrl.startsWith(userId + "/")`.
- Storage cleanup on DB failure (best-effort `remove`).

## Quality gate — MANDATORY after EVERY phase
Run these in order after each phase completes. Do NOT skip.
1. `/bmad:bmm:workflows:code-review`  → invoke via Skill tool
2. `/simplify`                         → invoke via Skill tool
3. `/review`                           → invoke via Skill tool
4. `/security-review`                  → invoke via Skill tool
Fix ALL findings before moving to the next phase.

---

## Success Criteria

### Functional (F) — ALL must be TRUE
- F1:  Creator sees "Corriger et re-uploader" Link on revision_requested cards in uploads page
- F2:  Link navigates to `/uploads/[videoId]/revision`
- F3:  RSC page redirects to `/uploads` if video status ≠ `revision_requested`
- F4:  RSC page redirects to `/uploads` if video.creatorId ≠ current creator (ownership)
- F5:  Original video renders (signed URL preview or navy fallback thumbnail)
- F6:  Admin note displays as plain text from `video.rejectionReason`
- F7:  Upload card shows locked video type (cannot be changed)
- F8:  Upload flow calls `POST /api/creator/uploads/video/revision` with `originalVideoId`
- F9:  New video created as `pending_review` in DB
- F10: Original video gets `superseded_by = new_video.id` in DB
- F11: Already-superseded video blocks second revision attempt (409/400)
- F12: Version history timeline visible when > 1 video for same (trackingId, videoType)
- F13: Dashboard revision card links directly to `/uploads/[videoId]/revision`

### Technical (T) — ALL must be TRUE
- T1:  `tsc --noEmit` passes with ZERO errors
- T2:  `VideoAsset` has `supersededBy?: string` field
- T3:  `videos` table has `superseded_by uuid` column (migration written)
- T4:  `markVideoSuperseded` exists in repository interface + Supabase impl + InMemory stub
- T5:  `createVideoAsset` accepts optional `supersededBy` param (not required, backward compat)
- T6:  `getRevisionPageData` use case validates ownership + status before returning data
- T7:  `recordRevisionUpload` use case validates: ownership, status=revision_requested, not yet superseded
- T8:  `POST /api/creator/uploads/video/revision` has: requireApiRole affiliate, fileUrl ownership check, storage probe, DB cleanup on failure
- T9:  Shared upload helpers extracted to `upload-helpers.ts` (no duplication between wizard and revision card)
- T10: `markVideoSuperseded` failure is non-fatal — logged but doesn't throw/break the upload

### Security (S) — ALL must be TRUE
- S1:  API route verifies `fileUrl.startsWith(auth.session.userId + "/")` before storage probe
- S2:  Use case verifies `originalVideo.creatorId === creator.id` (not just userId from cookie)
- S3:  Use case verifies `originalVideo.status === "revision_requested"` (status guard)
- S4:  Use case verifies `!originalVideo.supersededBy` (idempotency guard)
- S5:  RSC page uses server-side ownership check (not client-provided params)
- S6:  Signed URL generated server-side with 3600s TTL — never exposed as a permanent URL

---

## Phases (work in order)

### Phase 1 — DB Migration
File: `supabase/migrations/20260421000000_add_superseded_by_to_videos.sql`
Write the SQL. Do NOT apply yet (applied last in FINAL phase).
```sql
ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS superseded_by uuid
    REFERENCES public.videos(id) ON DELETE SET NULL;
ALTER TABLE public.videos
  ADD CONSTRAINT IF NOT EXISTS videos_superseded_by_not_self
  CHECK (superseded_by IS NULL OR superseded_by <> id);
CREATE INDEX IF NOT EXISTS idx_videos_superseded_by
  ON public.videos (superseded_by) WHERE superseded_by IS NOT NULL;
```

### Phase 2 — Types
2a. `src/infrastructure/supabase/database.types.ts`
    Add `superseded_by: string | null` to Videos Row, Insert, Update blocks.
2b. `src/domain/types.ts`
    Add `supersededBy?: string` to VideoAsset interface (after rejectionReason).

### Phase 3 — Repository
3a. `src/application/repositories/creator-repository.ts`
    - Add `supersededBy?: string | null` to createVideoAsset input
    - Add method: `markVideoSuperseded(input: { videoId: string; supersededById: string }): Promise<VideoAsset>`
3b. `src/infrastructure/supabase/supabase-creator-repository.ts`
    - Add `superseded_by` to VIDEO_COLS constant
    - Map `row.superseded_by ?? undefined` in mapVideo
    - Add `superseded_by` to createVideoAsset INSERT (only when input.supersededBy is set)
    - Implement markVideoSuperseded with UPDATE + select
3c. `src/infrastructure/in-memory/in-memory-creator-repository.ts`
    - Add markVideoSuperseded stub (throws NotImplemented)
RUN QUALITY GATES after Phase 3.

### Phase 4 — Use Cases
4a. CREATE `src/application/use-cases/get-revision-page-data.ts`
    - Exports: `RevisionPageData` interface + `getRevisionPageData({ userId, videoId })`
    - Guards: video exists, ownership, status=revision_requested
    - Returns: originalVideo, adminNote, versionHistory, monthlyTrackingId, ratesByType, specs
4b. CREATE `src/application/use-cases/record-revision-upload.ts`
    - Exports: `recordRevisionUpload({ userId, originalVideoId, fileUrl, durationSeconds, resolution, fileSizeMb })`
    - Guards: input validation, video exists, ownership, status guard, not-yet-superseded guard
    - Creates new video as pending_review, marks original superseded (non-fatal)
RUN QUALITY GATES after Phase 4.

### Phase 5 — Shared Upload Helpers
5a. CREATE `src/features/creator-uploads/lib/upload-helpers.ts`
    Extract from upload-wizard.tsx: sanitizeFilename, readVideoMetadata, isPreferredVideoFile, formatFileSize
5b. UPDATE `src/features/creator-uploads/components/upload-wizard.tsx`
    Import the extracted helpers. Zero behavior change.
RUN QUALITY GATES (/simplify + /review) after Phase 5.

### Phase 6 — API Route
CREATE `src/app/api/creator/uploads/video/revision/route.ts`
Pattern: clone of video/route.ts with:
- Body: { originalVideoId, fileUrl, durationSeconds, fileSizeMb, resolution }
- No videoType or monthlyTrackingId in body (read from original video server-side)
- Auth guard: requireApiRole affiliate
- Storage probe before DB
- Calls recordRevisionUpload
- Cleanup storage on failure
- setAuthCookies on response
RUN QUALITY GATES after Phase 6.

### Phase 7 — UI Components
All in `src/features/creator-uploads/components/`
7a. revision-page-header.tsx  — breadcrumb + title + 3-step progress (step 1 active by default)
7b. original-video-card.tsx   — <video> player + metadata strip, fallback thumbnail
7c. admin-instructions-card.tsx — amber card, plain text note, whitespace-pre-wrap
7d. revision-upload-card.tsx  — locked type pill, drop zone, upload progress, calls /revision route
7e. video-history-timeline.tsx — vertical timeline, dot per version, current video highlighted
RUN QUALITY GATES after Phase 7.

### Phase 8 — RSC Page + Feature Component
8a. CREATE `src/app/uploads/[videoId]/revision/page.tsx`
    - protectPage + auth + findCreatorIdForUser + getRevisionPageData
    - try/catch → redirect("/uploads") on any error
    - Supabase storage signed URL (3600s TTL) server-side
    - PageShell currentPath="/uploads"
8b. CREATE `src/features/creator-uploads/revision-page.tsx`
    - 2-col desktop (1fr 360px) / single-col mobile
    - Left: RevisionPageHeader + OriginalVideoCard + AdminInstructionsCard + VideoHistoryTimeline (if > 1 version)
    - Right: RevisionUploadCard
    - step state (1|2|3) lifted here, passed to header for progress bar
RUN QUALITY GATES after Phase 8.

### Phase 9 — Wire CTAs
9a. UPDATE `src/features/creator-uploads/creator-uploads-page.tsx`
    On revision_requested cards: replace any existing CTA with Link to `/uploads/${video.id}/revision`
9b. UPDATE `src/features/creator-dashboard/creator-dashboard-page.tsx`
    Revision card link: `/uploads/${revisionVideos[0]?.id}/revision` instead of `/uploads`
RUN QUALITY GATES after Phase 9.

### FINAL — Apply Migration + Typecheck
1. Apply migration via Supabase MCP: `mcp__supabase__apply_migration`
2. Run: `cd /Users/toni/Downloads/retromuscle-webapp && npx tsc --noEmit`
3. Fix ALL TypeScript errors before declaring complete.

---

## Escape hatch
If blocked for more than 3 consecutive attempts on the same step:
1. Write the blocker clearly in a comment at the top of the file being worked on
2. Mark the todo as in_progress with "[BLOCKED]" prefix
3. Move to the next independent phase
4. Return to blocked phase after completing others

## Completion promise
Output EXACTLY this when ALL F/T/S criteria above are verified TRUE and migration is applied:
<promise>REVISION-WORKFLOW-COMPLETE</promise>
