import type { CreatorRepository } from "@/application/repositories/creator-repository";
import { getRepository } from "@/application/dependencies";

export type MarkKitOrderPlacedOutcome =
  | "recorded"
  | "duplicate_webhook"
  | "no_creator_code_match"
  | "already_marked";

export interface ShopifyOrderWebhookInput {
  webhookId: string;
  topic: string;
  shopDomain: string | null;
  /** Order gid (gid://shopify/Order/...) or admin_graphql_api_id from REST. */
  orderGid: string;
  /** Optional numeric id when the webhook only provides the REST id. */
  orderNumericId?: string | null;
  /** List of discount codes applied to the order, upper-cased. */
  appliedDiscountCodes: string[];
  /** ISO timestamp of when the order was created. */
  orderCreatedAt: string;
}

export interface MarkKitOrderPlacedResult {
  outcome: MarkKitOrderPlacedOutcome;
  creatorId?: string;
  matchedCode?: string;
}

/**
 * Idempotently record a Shopify `orders/create` webhook against a creator.
 *
 * Flow:
 *   1. Dedupe on `webhookId` (Shopify's `X-Shopify-Webhook-Id`). If we've seen
 *      it before, return `duplicate_webhook`.
 *   2. Find the first applied code that matches a creator's `kit_promo_code`.
 *   3. Update that creator's `kit_order_placed_at` + `shopify_kit_order_id`.
 *      - Skip if the creator was already marked for an order (first-order wins).
 *   4. If ANYTHING in steps 2-3 fails, roll back the webhook record so Shopify
 *      can retry the delivery.
 */
export async function markKitOrderPlaced(
  input: ShopifyOrderWebhookInput,
  options?: { repository?: CreatorRepository }
): Promise<MarkKitOrderPlacedResult> {
  const repository = options?.repository ?? getRepository();

  const inserted = await repository.recordShopifyWebhookOnce({
    webhookId: input.webhookId,
    topic: input.topic,
    shopDomain: input.shopDomain,
    creatorId: null
  });

  if (!inserted) {
    return { outcome: "duplicate_webhook" };
  }

  try {
    let matchedCreatorId: string | null = null;
    let matchedCode: string | null = null;
    let alreadyMarked = false;

    for (const rawCode of input.appliedDiscountCodes) {
      const candidate = rawCode.trim();
      if (!candidate) continue;
      const creator = await repository.getCreatorByKitPromoCode(candidate);
      if (!creator) continue;

      matchedCreatorId = creator.id;
      matchedCode = creator.kitPromoCode ?? candidate;
      if (creator.kitOrderPlacedAt) {
        alreadyMarked = true;
      }
      break;
    }

    if (!matchedCreatorId || !matchedCode) {
      // Code didn't match any creator. Keep the webhook recorded so we don't
      // reprocess on retry (noop outcome).
      return { outcome: "no_creator_code_match" };
    }

    if (alreadyMarked) {
      return {
        outcome: "already_marked",
        creatorId: matchedCreatorId,
        matchedCode
      };
    }

    await repository.markKitOrdered({
      creatorId: matchedCreatorId,
      kitOrderPlacedAt: input.orderCreatedAt,
      shopifyKitOrderId: input.orderGid
    });

    return {
      outcome: "recorded",
      creatorId: matchedCreatorId,
      matchedCode
    };
  } catch (error) {
    // Downstream failure: rollback dedupe so Shopify's retry can pick it up.
    try {
      await repository.rollbackShopifyWebhook(input.webhookId);
    } catch {
      // Best-effort rollback; swallow to surface the original error.
    }
    throw error;
  }
}
