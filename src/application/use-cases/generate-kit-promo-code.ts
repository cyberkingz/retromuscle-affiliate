import type { CreatorRepository } from "@/application/repositories/creator-repository";
import type { Creator } from "@/domain/types";
import { getRepository } from "@/application/dependencies";
import {
  buildKitPromoCode,
  createDiscountCodeOnShopify
} from "@/infrastructure/shopify/create-discount-code";
import { ShopifyApiError } from "@/infrastructure/shopify/shopify-admin-client";

export type GenerateKitPromoCodeErrorCode =
  | "CREATOR_NOT_FOUND"
  | "ALREADY_GENERATED"
  | "CODE_COLLISION_EXHAUSTED"
  | "SHOPIFY_ERROR"
  | "CONTRACT_NOT_SIGNED";

export class GenerateKitPromoCodeError extends Error {
  constructor(
    public readonly code: GenerateKitPromoCodeErrorCode,
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "GenerateKitPromoCodeError";
  }
}

const MAX_COLLISION_RETRIES = 3;

function isCodeCollision(error: unknown): boolean {
  if (!(error instanceof ShopifyApiError)) return false;
  const userErrors = error.detail?.userErrors ?? [];
  return userErrors.some(
    (e) =>
      e.code === "TAKEN" ||
      /already\s+been\s+taken/i.test(e.message) ||
      /duplicate/i.test(e.message)
  );
}

/**
 * Create a per-creator Shopify promo code and store it on the creator row.
 *
 * Idempotent: if the creator already has a `kitPromoCode` we return it
 * unchanged and do NOT call Shopify again. Callers that want a fresh code
 * (admin "regenerate") must clear the column first.
 *
 * On Shopify code-collision (another creator picked up the same base handle,
 * or a manual code pre-exists) we retry with numeric suffixes `-2`, `-3`, ...
 * up to MAX_COLLISION_RETRIES before giving up.
 */
export async function generateKitPromoCode(
  input: {
    creatorId: string;
    /** Only used in tests. Prod reads from env via default. */
    repository?: CreatorRepository;
    /** Injectable Shopify implementation for tests. */
    createDiscount?: typeof createDiscountCodeOnShopify;
  },
  options?: { allowWithoutSignedContract?: boolean }
): Promise<{ creator: Creator; code: string; discountId: string; alreadyExisted: boolean }> {
  const repository = input.repository ?? getRepository();
  const createDiscount = input.createDiscount ?? createDiscountCodeOnShopify;

  const creator = await repository.getCreatorById(input.creatorId);
  if (!creator) {
    throw new GenerateKitPromoCodeError(
      "CREATOR_NOT_FOUND",
      `Creator ${input.creatorId} not found`
    );
  }

  if (!options?.allowWithoutSignedContract && !creator.contractSignedAt) {
    throw new GenerateKitPromoCodeError(
      "CONTRACT_NOT_SIGNED",
      "Creator must sign the contract before a kit promo code can be generated."
    );
  }

  if (creator.kitPromoCode && creator.shopifyDiscountId) {
    return {
      creator,
      code: creator.kitPromoCode,
      discountId: creator.shopifyDiscountId,
      alreadyExisted: true
    };
  }

  const baseCode = buildKitPromoCode(creator.handle);
  let lastError: unknown = null;

  for (let attempt = 0; attempt < MAX_COLLISION_RETRIES; attempt += 1) {
    const candidate = attempt === 0 ? baseCode : `${baseCode}-${attempt + 1}`;

    try {
      const { code, discountId } = await createDiscount({
        code: candidate,
        title: `RetroMuscle Kit — ${creator.handle}`
      });

      const updated = await repository.updateKitPromoCode({
        creatorId: creator.id,
        kitPromoCode: code,
        shopifyDiscountId: discountId
      });

      return {
        creator: updated,
        code,
        discountId,
        alreadyExisted: false
      };
    } catch (error) {
      lastError = error;
      if (isCodeCollision(error)) {
        continue;
      }
      throw new GenerateKitPromoCodeError(
        "SHOPIFY_ERROR",
        error instanceof Error ? error.message : "Unknown Shopify error",
        error
      );
    }
  }

  throw new GenerateKitPromoCodeError(
    "CODE_COLLISION_EXHAUSTED",
    `Could not allocate a unique promo code after ${MAX_COLLISION_RETRIES} attempts (base: ${baseCode})`,
    lastError
  );
}
