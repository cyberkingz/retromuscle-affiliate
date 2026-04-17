# Shopify Per-Creator Promo Codes — Integration Plan

**Branch:** `feature/creator-shopify-promo-codes`
**Status:** Planning — no code changes yet
**Date:** 2026-04-17

---

## 1. Goal

Replace the hardcoded shared `CREATOR20` promo code with **per-creator dynamic Shopify discount codes**, and track **which creators place their kit order** via Shopify webhooks so admins see order status in the dashboard.

Outcomes:
- Each creator gets a unique code (`RETRO-HANDLE`) at contract signing.
- Code is generated server-side via Shopify Admin API (`discountCodeBasicCreate`).
- Creator dashboard shows the personal code (replaces hardcoded display).
- Welcome email injects dynamic code.
- Admin dashboard shows a "Kit" column: `En préparation` / `Code prêt` / `Commandé (date)` / `Échec`.
- Inbound Shopify webhook (`orders/create`) updates creator status when their code is used.

---

## 2. Current Architecture — Key Files

### Promo code (hardcoded)
- `src/features/creator-dashboard/components/promo-code-card.tsx` — exports `CREATOR_PROMO_CODE = "CREATOR20"` and `CREATOR_STORE_URL`
- `src/features/creator-dashboard/components/welcome-promo-modal.tsx` — imports the constant
- `src/infrastructure/email/send-emails.ts:141` — duplicate export `CREATOR_PROMO_CODE = "CREATOR20"`

### Creator lifecycle
```
POST /api/applications/draft           → upserts creator_applications (draft → pending_review)
POST /api/admin/applications/review    → on "approved": upsertCreatorFromApplication + email
POST /api/contract/sign                → sets creators.contract_signed_at  ←  KIT TRIGGER
```

**"Fully onboarded" signal:** `creators.contract_signed_at IS NOT NULL` AND matching row in `creator_contract_signatures` (checked in `src/features/auth/shared/resolve-auth-routing.ts:44-57`).

### Infrastructure
- Repository pattern — `src/infrastructure/supabase/supabase-creator-repository.ts` + `InMemoryCreatorRepository` fallback
- Email via transactional service in `src/infrastructure/email/send-emails.ts`
- **No webhook infrastructure** — `src/app/api/` has zero webhook routes. Greenfield.
- **No existing HMAC helper** — must be built.

### Existing approved creators
- Currently all share `CREATOR20`. Count TBD but trivial (early stage).
- Migration strategy: silent backfill via admin-triggered script; no mass email, optional manual "ton nouveau code personnel" follow-up.

---

## 3. Database Migration

New migration: `supabase/migrations/20260418000000_add_kit_promo_code.sql`

```sql
-- Per-creator Shopify discount code + order tracking
alter table public.creators
  add column if not exists kit_promo_code text unique,
  add column if not exists shopify_discount_id text,
  add column if not exists kit_order_placed_at timestamptz,
  add column if not exists shopify_kit_order_id text;

-- kit_promo_code: NULL until generated at contract signing.
-- shopify_discount_id: gid://shopify/DiscountCodeNode/... for delete/revoke.
-- kit_order_placed_at: populated by orders/create webhook.
-- shopify_kit_order_id: gid://shopify/Order/... for idempotency.

create index if not exists idx_creators_kit_promo_code
  on public.creators (kit_promo_code)
  where kit_promo_code is not null;

create index if not exists idx_creators_shopify_kit_order_id
  on public.creators (shopify_kit_order_id)
  where shopify_kit_order_id is not null;

-- Webhook dedupe table
create table if not exists public.shopify_webhook_events (
  webhook_id    text primary key,
  topic         text not null,
  received_at   timestamptz not null default now(),
  processed_at  timestamptz,
  creator_id    uuid references public.creators(id) on delete set null
);

create index if not exists idx_shopify_webhook_events_topic
  on public.shopify_webhook_events (topic, received_at desc);

-- RLS: admins read/write shopify_webhook_events; webhook handler uses service role.
alter table public.shopify_webhook_events enable row level security;
create policy "admins read webhook events"
  on public.shopify_webhook_events for select
  using (public.is_admin());
```

No changes to `creator_applications` or `creator_contract_signatures`.

---

## 4. Shopify API Integration

### 4.1 Create discount code (at contract signing)

```graphql
mutation CreateCreatorKitCode($basicCodeDiscount: DiscountCodeBasicInput!) {
  discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
    codeDiscountNode { id codeDiscount { ... on DiscountCodeBasic { codes(first: 1) { nodes { code } } } } }
    userErrors { field code message }
  }
}
```

Variables:
```json
{
  "basicCodeDiscount": {
    "title": "RetroMuscle kit — @handle",
    "code": "RETRO-HANDLE",
    "startsAt": "2026-04-17T00:00:00Z",
    "endsAt": null,
    "usageLimit": 1,
    "appliesOncePerCustomer": true,
    "customerSelection": { "all": true },
    "customerGets": {
      "value": { "percentage": 1.0 },
      "items": {
        "products": { "productsToAdd": ["gid://shopify/Product/<KIT_PRODUCT_ID>"] }
      }
    }
  }
}
```

Store the returned `codeDiscountNode.id` in `creators.shopify_discount_id`.

### 4.2 Delete code (creator revoked)

```graphql
mutation DeleteCreatorCode($id: ID!) {
  discountCodeDelete(id: $id) { deletedCodeDiscountId userErrors { field code message } }
}
```

### 4.3 Code format

- `RETRO-{HANDLE_UPPER}` — handle uppercased, stripped of non-alphanumerics
- Max ~20 chars recommended for usability (Shopify allows up to 255)
- Allowed chars: `[A-Z0-9-]` (no spaces)
- Collision handling: local DB check first, append `-XXXX` (4 random hex) on collision, max 3 retries
- Shopify stores codes case-insensitive but preserves display

### 4.4 Rate limits

- Shopify GraphQL: 1,000 points / 50 pts/sec restore (standard plan)
- `discountCodeBasicCreate` ≈ 10 points → 100/sec theoretical = zero concern at our scale

### 4.5 Required scopes

- `write_discounts` — create/delete codes
- `read_orders` — webhook payload + Admin API order lookups
- (Optional later) `read_customers` — if binding codes to customer gids

---

## 5. Webhook Endpoint Design

### 5.1 Route

`POST /api/webhooks/shopify/orders` — `runtime: 'nodejs'`, `dynamic: 'force-dynamic'`

### 5.2 Flow

```
1. Read raw body with req.text()  ← MUST be raw bytes, not req.json()
2. Verify X-Shopify-Shop-Domain === SHOPIFY_SHOP_DOMAIN env
3. Compute base64(HMAC-SHA256(rawBody, SHOPIFY_WEBHOOK_SECRET))
4. Constant-time compare vs X-Shopify-Hmac-Sha256 header
   → 401 on any mismatch
5. Insert row into shopify_webhook_events (PK = X-Shopify-Webhook-Id)
   → conflict = 200 (already processed, don't re-run)
6. Parse JSON, extract payload.discount_codes[].code
7. Lookup creator: creators WHERE kit_promo_code ILIKE $code
   → not found = 200 (order from non-creator customer)
8. If kit_order_placed_at IS NULL: UPDATE set kit_order_placed_at + shopify_kit_order_id
   → 200
9. On internal error after dedupe insert: rollback dedupe row + return 500 (Shopify will retry)
```

### 5.3 HMAC verification pseudocode

```ts
import crypto from "node:crypto";
const digest = crypto.createHmac("sha256", process.env.SHOPIFY_WEBHOOK_SECRET!)
                     .update(rawBody, "utf8").digest();
const provided = Buffer.from(req.headers.get("x-shopify-hmac-sha256") ?? "", "base64");
if (provided.length !== digest.length) return new Response(null, { status: 401 });
if (!crypto.timingSafeEqual(provided, digest)) return new Response(null, { status: 401 });
```

### 5.4 Webhook subscription (registered once per env)

```graphql
mutation { webhookSubscriptionCreate(
  topic: ORDERS_CREATE,
  webhookSubscription: { callbackUrl: "https://retromuscle.net/api/webhooks/shopify/orders", format: JSON }
) { webhookSubscription { id } userErrors { field message } } }
```

### 5.5 Shopify retry behavior

- 2xx within **5 seconds** = success
- Non-2xx or timeout → 19 retries over 48h with exponential backoff
- Same delivery = same `X-Shopify-Webhook-Id` → dedupe table catches retries after successful process

---

## 6. Threat Model

| Threat | Mitigation | Residual |
|---|---|---|
| Forged webhook | HMAC-SHA256 + constant-time + shop-domain check | Low — secret rotation quarterly |
| Replay (dup processing) | `UNIQUE(webhook_id)` insert-then-process | None |
| Replay (old captured) | HMAC id dedupe; consider >48h staleness reject | Low — Shopify legitimately retries |
| DoS on public endpoint | HMAC verify BEFORE JSON parse | Platform limits; acceptable |
| Code enumeration | Single-use per code; no PII leaked via code | None |
| Self-promotion via payload | Resolve creator by Shopify-provided code lookup, never trust `creator_id` in body | None |
| Token exfil via logs | Never log full payload or tokens | Discipline |
| SQL injection | Supabase parameterized client | None |

**Codebase specific gotchas:**
- `middleware.ts` must exclude `/api/webhooks/*` from matcher (no `rm_access_token` cookie on Shopify requests)
- Webhook route uses **service role client** (no user session); do NOT use `requireApiRole()`
- Return empty body + status (no `apiError` JSON) to avoid info leak to attackers probing the endpoint
- Reuse `audit_log` pattern: `{actor: 'shopify_webhook', webhook_id, creator_id, event: 'kit_order_marked'}` — no payload dump

---

## 7. Code Changes (File-by-File)

### Domain
- `src/domain/types.ts` — add to `Creator`: `kitPromoCode?: string`, `shopifyDiscountId?: string`, `kitOrderPlacedAt?: string`, `shopifyKitOrderId?: string`

### Application
- `src/application/repositories/creator-repository.ts` — add interface methods:
  - `updateKitPromoCode({ creatorId, code, shopifyDiscountId })`
  - `markKitOrdered({ creatorId, shopifyKitOrderId, kitOrderPlacedAt })`
  - `recordShopifyWebhookOnce({ webhookId, topic })` → `{ inserted: boolean }`
  - `rollbackShopifyWebhook({ webhookId })`
- `src/application/use-cases/generate-kit-promo-code.ts` **(new)** — orchestrates: generate code string → call Shopify `discountCodeBasicCreate` → `updateKitPromoCode` → send kit-welcome email
- `src/application/use-cases/mark-kit-order-placed.ts` **(new)** — called by webhook handler

### Infrastructure
- `src/infrastructure/shopify/shopify-admin-client.ts` **(new)** — thin wrapper around Admin GraphQL with retry + throttle handling
- `src/infrastructure/shopify/create-discount-code.ts` **(new)** — implements `discountCodeBasicCreate` mutation
- `src/infrastructure/shopify/delete-discount-code.ts` **(new)** — for revoke path
- `src/infrastructure/shopify/verify-webhook-hmac.ts` **(new)** — HMAC verification helper
- `src/infrastructure/supabase/supabase-creator-repository.ts`:
  - `CREATOR_COLS` — add 4 new columns
  - `mapCreator()` — map new fields
  - Add `updateKitPromoCode`, `markKitOrdered`, `recordShopifyWebhookOnce`, `rollbackShopifyWebhook` methods
- `src/infrastructure/supabase/in-memory-creator-repository.ts` — stub implementations for test parity
- `src/infrastructure/email/send-emails.ts`:
  - Delete `export const CREATOR_PROMO_CODE = "CREATOR20"` (line 141)
  - Add `sendKitWelcomeEmail({ to, fullName, promoCode, storeUrl })`

### API routes
- `src/app/api/contract/sign/route.ts` — after `UPDATE creators SET contract_signed_at` succeeds, fire-and-forget call to `generateKitPromoCode` use-case (do NOT block contract signing; queue retry on failure)
- `src/app/api/webhooks/shopify/orders/route.ts` **(new)** — raw body HMAC → dedupe → `markKitOrdered`
- `src/app/api/admin/creators/[id]/regenerate-kit-code/route.ts` **(new)** — admin retry endpoint (wraps `generateKitPromoCode`, admin-guarded)
- `middleware.ts` — add `/api/webhooks/:path*` to public matcher exclusions

### Features / Components
- `src/features/creator-dashboard/components/promo-code-card.tsx`:
  - Remove `export const CREATOR_PROMO_CODE = "CREATOR20"`
  - Accept `promoCode: string | null` + `codeError: boolean` props
  - Three states: active (magenta display + copy), pending (`bg-primary/10` shimmer + "Ton code personnel arrive sous peu..."), failed (destructive tone, no action)
- `src/features/creator-dashboard/components/welcome-promo-modal.tsx`:
  - Accept `promoCode: string | null` prop
  - Skip `useEffect` open when `promoCode === null`
  - Add line "Code personnel — valable uniquement pour toi"
- `src/features/creator-dashboard/components/kit-status-banner.tsx` **(new)** — mint-toned banner below promo card when `kitOrderedAt` is set: "Ton kit est en route — commandé le [date]"
- `src/features/admin-creators/components/kit-status-cell.tsx` **(new)** — table cell for admin list: 4 states (pending_code / code_ready / ordered / failed)
- `src/features/admin-creators/components/creator-promo-code-row.tsx` **(new)** — detail panel row with copy + "Regénérer le code" button
- Admin creators page/table — add "Kit" column after "Statut", add "Kit non commandé" quick filter pill
- `src/application/use-cases/get-admin-creator-detail-data.ts` — expose `kitPromoCode`, `kitOrderPlacedAt`, `shopifyKitOrderId` fields

---

## 8. Environment Variables

Add to `.env.example` (and Vercel Production / Preview / Dev):

```
# Shopify integration
SHOPIFY_SHOP_DOMAIN=retromuscle.myshopify.com
SHOPIFY_ADMIN_API_TOKEN=shpat_xxxxx         # scopes: write_discounts, read_orders
SHOPIFY_WEBHOOK_SECRET=xxxxx                # from webhookSubscriptionCreate or store admin
SHOPIFY_KIT_PRODUCT_GID=gid://shopify/Product/1234567890   # the bundle eligible for the kit discount
```

**Rules:**
- Server-only, never `NEXT_PUBLIC_`
- Support dual-secret during rotation (verify HMAC against either `SHOPIFY_WEBHOOK_SECRET` or `SHOPIFY_WEBHOOK_SECRET_NEXT` if set)
- Document quarterly rotation; deploy code BEFORE updating Shopify side

---

## 9. UI / UX Details (Creator + Admin)

### Creator dashboard — `PromoCodeCard` states

| State | Trigger | Visual |
|---|---|---|
| Active | `promoCode != null` | Magenta 36px display, copy button, store link (current) |
| Pending | `promoCode == null && contract_signed_at != null` | `bg-primary/10` shimmer block, "Ton code personnel arrive sous peu..." |
| Failed | `promoCode == null && codeError` | `bg-destructive/10` row, "Ton code est en cours de configuration. Aucune action requise de ta part." |

### Creator dashboard — Kit status banner
`bg-mint/20 text-mint` pill banner below card once `kitOrderedAt` set:
> 📦 Ton kit est en route — commandé le 14 avr.

### Welcome modal
Additional line under expiry note:
> Code personnel — valable uniquement pour toi

### Admin — "Kit" column (in creators list)
After "Statut", before actions. Four states:

- **`pending_code`** — spinning Loader2 + "En préparation" (muted)
- **`code_ready`** — Tag icon (magenta) + `RETRO-HANDLE` truncated 16 chars, mono font
- **`ordered`** — Package icon (mint) + "Commandé" + date subline
- **`failed`** — AlertTriangle (destructive) + "Échec code"

Filter pill: "Kit non commandé" alongside existing status pills.

### Admin — creator detail panel (in existing navy hero layout)
New "Shopify" card section with:
- `InfoCell`: "Code personnel" → `RETRO-HANDLE` (copyable)
- `InfoCell`: "Discount Shopify" → `gid://.../12345` (copy for troubleshooting)
- `InfoCell`: "Kit commandé" → date or "—"
- `InfoCell`: "Order ID" → Shopify gid (link out to Shopify admin)
- If `failed` → "Regénérer le code" ghost button
- If revoked → "Code révoqué" strikethrough

### UX copy (French, warm tone, matching template style)
- Pending: "Ton code personnel arrive sous peu..."
- Failed (creator view): "Ton code est en cours de configuration. Aucune action requise de ta part."
- Failed (admin view): "La génération du code Shopify a échoué pour ce créateur. Tu peux relancer manuellement ci-dessous."
- Retry success: "Code généré avec succès — RETRO-MARIELOU"
- Kit ordered: "Ton kit est en route — commandé le [date]"

---

## 10. Migration Strategy for Existing Creators

Script: `scripts/backfill-shopify-kit-codes.ts` (admin-triggered, one-off)

```
1. Query creators WHERE kit_promo_code IS NULL AND contract_signed_at IS NOT NULL
2. For each:
   a. Generate code (collision-checked locally)
   b. Call Shopify discountCodeBasicCreate
   c. UPDATE creators SET kit_promo_code, shopify_discount_id
   d. (optional) Send "ton nouveau code personnel" email — off by default
3. Log results; report counts
4. Hard cutoff: delete CREATOR20 from Shopify discounts after backfill complete
```

**No mass email automatically.** Admin reviews the backfill report, optionally sends a manual "voici ton code personnel" batch afterward.

---

## 11. Testing Plan

### Unit
- HMAC verification helper — valid / invalid / wrong length / missing header
- Code generation — happy / collision / retry exhaustion
- Dedupe table — first insert wins, duplicate returns existing

### Integration
- `generate-kit-promo-code` use-case against `InMemoryCreatorRepository` + mocked Shopify client
- `mark-kit-order-placed` use-case against fixture webhook payload

### End-to-end (Shopify dev store)
- Create dev store via Partner dashboard
- Enable Bogus Gateway for test orders
- Expose local endpoint via `ngrok` / `cloudflared`
- Register webhook via `webhookSubscriptionCreate`
- Flow: sign contract → observe code created → place test order with code → observe webhook → verify `kit_order_placed_at` set
- Retry test: respond 500 once, verify Shopify retries, verify dedupe on success

### Security
- Replay known-good webhook → dedupe returns 200, DB unchanged
- Tampered HMAC → 401
- Wrong shop domain → 401
- Malformed JSON body → 400

---

## 12. Deployment Order

1. **Migration** — apply `20260418000000_add_kit_promo_code.sql` (columns + dedupe table)
2. **Env vars** — add all 4 Shopify vars in Vercel + local
3. **Deploy code behind feature flag** (optional — read `SHOPIFY_INTEGRATION_ENABLED` env)
4. **Register webhook** in Shopify (via GraphQL or store admin) pointing to production endpoint
5. **Smoke test** — sign one test contract, verify code + email
6. **Backfill script** — run against existing approved creators
7. **Retire `CREATOR20`** in Shopify admin
8. **Remove** `CREATOR_PROMO_CODE` constant from `send-emails.ts` + component

---

## 13. Open Questions (Need Decisions Before Implementation)

1. **Shopify kit product** — which product GID is the "kit" that the 100% off applies to? Is it a bundle or a specific SKU?
2. **100% off vs near-100%?** — does creator pay shipping, or is it free kit including shipping? (Affects discount config.)
3. **Revoke UX** — does revoking a creator auto-disable their Shopify code, or is it a manual admin action?
4. **Creator detail Shopify section** — is there a dedicated creator detail page yet, or does this need to be built alongside? (Current detail is the admin-applications panel; post-approval creators view TBD.)
5. **Email for backfilled creators** — send "voici ton nouveau code personnel" email or silent backfill only?
6. **Feature flag** — gate behind env flag or go direct?
7. **Contract signing path decoupling** — current `src/app/api/contract/sign/route.ts` calls Supabase directly, bypassing the repository. Refactor it to use the repo now (cleaner), or add Supabase-direct Shopify call inline (faster shipping, adds debt)?

---

## 14. References

- discountCodeBasicCreate — https://shopify.dev/docs/api/admin-graphql/latest/mutations/discountCodeBasicCreate
- discountCodeDelete — https://shopify.dev/docs/api/admin-graphql/latest/mutations/discountCodeDelete
- WebhookSubscriptionTopic — https://shopify.dev/docs/api/admin-graphql/latest/enums/WebhookSubscriptionTopic
- Webhook HMAC verification — https://shopify.dev/docs/apps/build/webhooks/subscribe/https#step-5-verify-the-webhook
- Admin API rate limits — https://shopify.dev/docs/api/usage/rate-limits
