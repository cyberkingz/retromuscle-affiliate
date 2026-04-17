# Ralph Loop Task — Shopify Per-Creator Promo Codes

## Mission

Replace the hardcoded `CREATOR20` promo code with **per-creator dynamic Shopify discount codes** and track kit orders via webhooks.

- Each approved creator gets `RETRO-HANDLE` code at contract signing.
- Code = **20% off on entire cart** (all products), single-use (`usageLimit: 1`).
- Inbound `orders/create` webhook updates `creators.kit_order_placed_at`.
- Admin sees Kit status in creators list; creators see their personal code + "kit en route" banner.
- No feature flag — ship direct.
- No backfill needed (no approved creators yet).
- Refacto `contract/sign/route.ts` to repository pattern (option A — propre).

## Branch Isolation

Current branch: `feature/creator-shopify-promo-codes`. **Do NOT merge to main.** All work stays on this branch until user explicitly tests and approves.

## Reference Spec

Full plan at `docs/SHOPIFY_PROMO_CODES_PLAN.md` — treat it as the source of truth for:
- DB schema (section 3)
- Shopify API mutations (section 4)
- Webhook design (section 5)
- Threat model (section 6)
- File-by-file changes (section 7)
- Env vars (section 8)
- UI states (section 9)

**Deviations from plan based on user decisions:**
- Discount: **20% off on cart value, all products** (NOT 100% off, NOT collection-specific). In the `discountCodeBasicCreate` input, use `customerGets.items.all = true` + `customerGets.value.percentage = 0.20`.
- No backfill script (skip section 10 for now — no existing creators to migrate).
- No feature flag (skip env toggle).
- Refacto `contract/sign/route.ts` to use the repository pattern (option A).

## Success Criteria (MUST ALL PASS)

### F — Functional
- F1: Signing contract at `/api/contract/sign` triggers Shopify discount creation and stores `kit_promo_code`, `shopify_discount_id` on creator row.
- F2: Welcome email sent after contract signing includes the dynamic `RETRO-HANDLE` code (no `CREATOR20` anywhere).
- F3: Creator dashboard `PromoCodeCard` renders three states: active (code shown + copy), pending (shimmer), failed (muted error copy).
- F4: Admin creators list shows "Kit" column with 4 states (pending_code / code_ready / ordered / failed) and "Kit non commandé" quick filter.
- F5: Webhook endpoint `POST /api/webhooks/shopify/orders` verifies HMAC, dedupes via `X-Shopify-Webhook-Id`, updates `kit_order_placed_at` + `shopify_kit_order_id`.
- F6: Creator dashboard shows "Ton kit est en route — commandé le [date]" mint banner after webhook fires.
- F7: Revoked creator → Shopify config handles via `usageLimit: 1` (no auto-delete needed).
- F8: Admin "Regénérer le code" button works when code generation failed.

### T — Technical
- T1: `npm run build` exits 0, zero TypeScript errors, zero `any`, zero `@ts-ignore`.
- T2: Migration `supabase/migrations/20260418000000_add_kit_promo_code.sql` applies cleanly (columns + `shopify_webhook_events` dedupe table).
- T3: `middleware.ts` excludes `/api/webhooks/:path*` from auth matcher.
- T4: `src/app/api/contract/sign/route.ts` uses the repository pattern (no direct Supabase client calls for creator updates).
- T5: `CREATOR_PROMO_CODE` constant deleted from `promo-code-card.tsx` AND `send-emails.ts`.
- T6: `InMemoryCreatorRepository` implements all new methods (`updateKitPromoCode`, `markKitOrdered`, `recordShopifyWebhookOnce`, `rollbackShopifyWebhook`).
- T7: Domain layer stays framework-free (zero `@supabase/...` or `next/...` imports under `src/domain/`).

### S — Security
- S1: HMAC verified via `crypto.timingSafeEqual` on raw body (read via `req.text()` BEFORE any JSON parse).
- S2: `X-Shopify-Shop-Domain` validated against `SHOPIFY_SHOP_DOMAIN` env before HMAC.
- S3: Webhook endpoint returns empty body + status code only (no `apiError` JSON leakage).
- S4: `shopify_webhook_events.webhook_id` PRIMARY KEY provides atomic dedupe guarantee.
- S5: Admin API token never logged, never prefixed with `NEXT_PUBLIC_`, only read server-side.
- S6: Webhook route does NOT use `requireApiRole()` — auth IS the HMAC.

### TEST — Coverage
- TEST1: Unit test for HMAC verify helper (valid / tampered / wrong-length / missing-header).
- TEST2: Unit test for code generation (happy / collision / retry exhaustion).
- TEST3: Unit test for webhook dedupe (first insert wins, duplicate → noop).
- TEST4: Integration test for `generate-kit-promo-code` use-case against `InMemoryCreatorRepository`.
- TEST5: Integration test for `mark-kit-order-placed` use-case with fixture payload.

## Workflow Per Iteration

Each iteration = ONE of these phases. Complete the phase fully, then run the quality gates, then move on.

### Phase 1 — Foundation (iterations 1-10)
- Migration SQL with columns + dedupe table
- Update domain types + repository interface
- Update `InMemoryCreatorRepository` + Supabase repo (columns, mappers, new methods)
- Regenerate / manually update `database.types.ts`
- Add env var stubs to `.env.example`

### Phase 2 — Shopify Client (iterations 11-25)
- `src/infrastructure/shopify/shopify-admin-client.ts` — GraphQL wrapper with rate-limit awareness
- `src/infrastructure/shopify/create-discount-code.ts` — `discountCodeBasicCreate` mutation
- `src/infrastructure/shopify/verify-webhook-hmac.ts` — timing-safe HMAC helper
- Unit tests for HMAC + code gen collision handling

### Phase 3 — Use Cases + API (iterations 26-45)
- `src/application/use-cases/generate-kit-promo-code.ts`
- `src/application/use-cases/mark-kit-order-placed.ts`
- Refacto `src/app/api/contract/sign/route.ts` to repository pattern + hook in `generateKitPromoCode` after signing
- New `src/app/api/webhooks/shopify/orders/route.ts`
- New `src/app/api/admin/creators/[id]/regenerate-kit-code/route.ts` (admin-only)
- Update `middleware.ts` matcher

### Phase 4 — Email (iterations 46-55)
- Delete `CREATOR_PROMO_CODE` constant from `send-emails.ts`
- Add `sendKitWelcomeEmail({ to, fullName, promoCode, storeUrl })`
- Wire into `generate-kit-promo-code` use-case

### Phase 5 — UI Creator (iterations 56-75)
- `promo-code-card.tsx` — accept `promoCode`, `codeError` props; three visual states
- Delete `CREATOR_PROMO_CODE` export from `promo-code-card.tsx`
- `welcome-promo-modal.tsx` — accept `promoCode` prop; skip open when null
- `kit-status-banner.tsx` (new) — mint banner when `kitOrderedAt` set
- Update dashboard page to pass new props

### Phase 6 — UI Admin (iterations 76-95)
- `kit-status-cell.tsx` (new) — 4-state table cell
- Add "Kit" column to admin creators table
- Add "Kit non commandé" filter pill
- `creator-promo-code-row.tsx` (new) — detail panel row with copy + retry
- Update `get-admin-creator-detail-data.ts` use-case

### Phase 7 — Tests + Build Verification (iterations 96-120)
- Ensure all TEST1-TEST5 pass
- `npm run build` clean
- `npm run lint` clean (if present)
- Manual verify: sign contract flow → code generated locally with mocked Shopify client

### Phase 8 — Polish + Quality Gates (iterations 121-150)
- Review skill feedback from quality gates (below)
- Fix any high-confidence bugs, security issues, simplifications
- Final build + type check

## Quality Gates (RUN AFTER EACH PHASE COMPLETES)

After each phase marks its files changed and BEFORE moving to the next phase, execute in order. Fix CRITICAL/HIGH findings from each gate before running the next one. All are real slash commands.

**Core gates (every phase 1-8):**

1. **`/bmad:bmm:workflows:code-review`** — adversarial senior review, finds 3-10 bugs with 0-100 confidence scoring, keeps only ≥80 confidence findings. Fix CRITICAL/HIGH.
2. **`/review`** — gstack pre-landing review: SQL safety, LLM trust boundaries, conditional side effects. Fix findings.
3. **`/simplify`** — 3 parallel agents (reuse / quality / efficiency) scan git diff. Apply reasonable simplifications, skip false positives.
4. **`/security-review`** — security audit on diff. Fix CRITICAL/HIGH.

**Conditional gate (UI phases 5 and 6 only):**

5. **`/design-review`** — designer's eye QA: visual inconsistency, spacing, hierarchy, AI slop patterns. Fixes issues iteratively with atomic commits + before/after verification.

After all applicable gates pass with no CRITICAL/HIGH findings: commit the phase with message `feat(shopify): phase N — <summary>` and proceed to next phase.

## Env Vars Required

Add to `.env.example` (server-only, NEVER `NEXT_PUBLIC_`):

```
SHOPIFY_SHOP_DOMAIN=
SHOPIFY_ADMIN_API_TOKEN=
SHOPIFY_WEBHOOK_SECRET=
```

Note: no `SHOPIFY_KIT_PRODUCT_GID` needed (20% on full cart, not one product).

## Constraints

1. DO NOT merge to main. All work on `feature/creator-shopify-promo-codes`.
2. DO NOT run real Shopify API calls during tests — use mocked client.
3. DO NOT hit actual Shopify webhook registration — document that step for manual post-deploy setup.
4. DO NOT commit secrets — env vars in `.env.example` as placeholders only.
5. PRESERVE existing auth/middleware behavior for non-webhook routes.
6. PRESERVE DDD layered architecture (domain → application → features → app).
7. Zero `any`, zero `@ts-ignore`. Strict TypeScript.
8. Domain layer stays framework-free.
9. French copy matching the warm tone of the recent review templates (tu, emojis where appropriate).

## Escape Hatch

If blocked or uncertain after 3 failed attempts on the same sub-task:
1. Write a dated note in `docs/SHOPIFY_IMPLEMENTATION_NOTES.md` — what blocked, what was tried, recommendation.
2. Skip that sub-task, mark it TODO with a `// RALPH-TODO:` comment inline.
3. Continue with the next sub-task.
4. At completion, include the TODO list in the final report.

If iteration 150 reached without all success criteria met:
- Output `<promise>RALPH-EXHAUSTED</promise>` (will not match completion promise).
- User will review remaining work.

## Completion Signal

When ALL success criteria F1-F8, T1-T7, S1-S6, TEST1-TEST5 are verified AND all 4 quality gates pass for Phase 8, output exactly:

<promise>SHOPIFY-INTEGRATION-COMPLETE</promise>
