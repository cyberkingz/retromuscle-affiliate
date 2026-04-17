import type { Creator, CreatorKitStatus } from "@/domain/types";

/**
 * Pending window: if a contract is freshly signed (<5 min) and the code has
 * not been written yet, we treat it as `pending_code` rather than `failed`.
 * This covers the brief gap between contract signature and the Shopify round-trip.
 */
const PENDING_WINDOW_MS = 5 * 60 * 1000;

export interface KitStatusSnapshot {
  contractSignedAt?: string | null;
  kitPromoCode?: string | null;
  kitOrderPlacedAt?: string | null;
}

/**
 * Pure derivation of a creator's kit status from persisted fields.
 *
 * Priority order:
 *   1. `ordered`           — `kit_order_placed_at` is set
 *   2. `code_ready`        — `kit_promo_code` is set but no order yet
 *   3. `pending_code`      — contract signed <PENDING_WINDOW_MS ago but no code
 *   4. `failed`            — contract signed longer ago, still no code
 *   5. `not_applicable`    — no contract signature
 */
export function deriveKitStatus(
  input: KitStatusSnapshot,
  now: Date = new Date()
): CreatorKitStatus {
  if (input.kitOrderPlacedAt) {
    return "ordered";
  }
  if (input.kitPromoCode) {
    return "code_ready";
  }
  if (!input.contractSignedAt) {
    return "not_applicable";
  }

  const signedMs = new Date(input.contractSignedAt).getTime();
  if (Number.isFinite(signedMs) && now.getTime() - signedMs < PENDING_WINDOW_MS) {
    return "pending_code";
  }
  return "failed";
}

export function deriveKitStatusForCreator(creator: Creator, now?: Date): CreatorKitStatus {
  return deriveKitStatus(
    {
      contractSignedAt: creator.contractSignedAt,
      kitPromoCode: creator.kitPromoCode,
      kitOrderPlacedAt: creator.kitOrderPlacedAt
    },
    now
  );
}
