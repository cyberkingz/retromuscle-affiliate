import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Creator } from "@/domain/types";
import type { CreatorRepository } from "@/application/repositories/creator-repository";
import { ShopifyApiError } from "@/infrastructure/shopify/shopify-admin-client";
import {
  GenerateKitPromoCodeError,
  generateKitPromoCode
} from "@/application/use-cases/generate-kit-promo-code";

const CREATOR_ID = "creator-xyz";

function makeCreator(overrides: Partial<Creator> = {}): Creator {
  return {
    id: CREATOR_ID,
    handle: "cocolaban",
    displayName: "Coco Laban",
    email: "coco@example.com",
    whatsapp: "+33600000000",
    country: "FR",
    address: "1 rue X",
    followersTiktok: 10000,
    followersInstagram: 5000,
    socialLinks: {},
    status: "actif",
    startDate: "2026-04-15",
    contractSignedAt: "2026-04-15T10:00:00Z",
    ...overrides
  };
}

function makeRepo(overrides: Partial<CreatorRepository> = {}): CreatorRepository {
  return {
    getCreatorById: vi.fn().mockResolvedValue(makeCreator()),
    updateKitPromoCode: vi.fn().mockImplementation(async (input) =>
      makeCreator({
        kitPromoCode: input.kitPromoCode,
        shopifyDiscountId: input.shopifyDiscountId
      })
    ),
    ...overrides
  } as unknown as CreatorRepository;
}

beforeEach(() => {
  vi.clearAllMocks();
});

const noopEmail = vi.fn().mockResolvedValue(undefined);

describe("generateKitPromoCode", () => {
  it("creates a new code and stores it on the creator row", async () => {
    const repository = makeRepo();
    const createDiscount = vi.fn().mockResolvedValue({
      code: "RETRO-COCOLABAN",
      discountId: "gid://shopify/DiscountCodeNode/1"
    });
    const sendEmail = vi.fn().mockResolvedValue(undefined);

    const result = await generateKitPromoCode({
      creatorId: CREATOR_ID,
      repository,
      createDiscount,
      sendEmail
    });

    expect(result.alreadyExisted).toBe(false);
    expect(result.code).toBe("RETRO-COCOLABAN");
    expect(result.discountId).toBe("gid://shopify/DiscountCodeNode/1");
    expect(createDiscount).toHaveBeenCalledTimes(1);
    expect(createDiscount).toHaveBeenCalledWith(
      expect.objectContaining({ code: "RETRO-COCOLABAN" })
    );
    expect(repository.updateKitPromoCode).toHaveBeenCalledWith({
      creatorId: CREATOR_ID,
      kitPromoCode: "RETRO-COCOLABAN",
      shopifyDiscountId: "gid://shopify/DiscountCodeNode/1"
    });
    expect(sendEmail).toHaveBeenCalledWith({
      to: "coco@example.com",
      displayName: "Coco Laban",
      promoCode: "RETRO-COCOLABAN"
    });
  });

  it("does not send a welcome email when skipWelcomeEmail is set", async () => {
    const repository = makeRepo();
    const createDiscount = vi.fn().mockResolvedValue({
      code: "RETRO-COCOLABAN",
      discountId: "gid://shopify/DiscountCodeNode/1"
    });
    const sendEmail = vi.fn().mockResolvedValue(undefined);

    await generateKitPromoCode(
      { creatorId: CREATOR_ID, repository, createDiscount, sendEmail },
      { skipWelcomeEmail: true }
    );

    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("swallows email send errors without failing the use-case", async () => {
    const repository = makeRepo();
    const createDiscount = vi.fn().mockResolvedValue({
      code: "RETRO-COCOLABAN",
      discountId: "gid://shopify/DiscountCodeNode/1"
    });
    const sendEmail = vi.fn().mockRejectedValue(new Error("resend down"));
    const originalError = console.error;
    console.error = vi.fn();

    const result = await generateKitPromoCode({
      creatorId: CREATOR_ID,
      repository,
      createDiscount,
      sendEmail
    });

    expect(result.code).toBe("RETRO-COCOLABAN");
    console.error = originalError;
  });

  it("is idempotent: returns existing code without calling Shopify again", async () => {
    const existing = makeCreator({
      kitPromoCode: "RETRO-COCOLABAN",
      shopifyDiscountId: "gid://shopify/DiscountCodeNode/1"
    });
    const repository = makeRepo({
      getCreatorById: vi.fn().mockResolvedValue(existing)
    });
    const createDiscount = vi.fn();

    const result = await generateKitPromoCode({
      creatorId: CREATOR_ID,
      repository,
      createDiscount,
      sendEmail: noopEmail
    });

    expect(result.alreadyExisted).toBe(true);
    expect(result.code).toBe("RETRO-COCOLABAN");
    expect(createDiscount).not.toHaveBeenCalled();
  });

  it("retries with a numeric suffix on code collision", async () => {
    const repository = makeRepo();
    const collisionError = new ShopifyApiError("userErrors", {
      userErrors: [{ field: ["code"], message: "Code has already been taken", code: "TAKEN" }]
    });
    const createDiscount = vi
      .fn()
      .mockRejectedValueOnce(collisionError)
      .mockResolvedValueOnce({
        code: "RETRO-COCOLABAN-2",
        discountId: "gid://shopify/DiscountCodeNode/2"
      });

    const result = await generateKitPromoCode({
      creatorId: CREATOR_ID,
      repository,
      createDiscount,
      sendEmail: noopEmail
    });

    expect(result.code).toBe("RETRO-COCOLABAN-2");
    expect(createDiscount).toHaveBeenCalledTimes(2);
    expect(createDiscount).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ code: "RETRO-COCOLABAN" })
    );
    expect(createDiscount).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ code: "RETRO-COCOLABAN-2" })
    );
  });

  it("throws CODE_COLLISION_EXHAUSTED after 3 collisions", async () => {
    const repository = makeRepo();
    const collisionError = new ShopifyApiError("userErrors", {
      userErrors: [{ field: ["code"], message: "Code has already been taken", code: "TAKEN" }]
    });
    const createDiscount = vi.fn().mockRejectedValue(collisionError);

    await expect(
      generateKitPromoCode({
        creatorId: CREATOR_ID,
        repository,
        createDiscount,
        sendEmail: noopEmail
      })
    ).rejects.toMatchObject({ code: "CODE_COLLISION_EXHAUSTED" });

    expect(createDiscount).toHaveBeenCalledTimes(3);
  });

  it("throws CREATOR_NOT_FOUND when creator missing", async () => {
    const repository = makeRepo({
      getCreatorById: vi.fn().mockResolvedValue(null)
    });

    await expect(
      generateKitPromoCode({
        creatorId: "missing",
        repository,
        createDiscount: vi.fn(),
        sendEmail: noopEmail
      })
    ).rejects.toBeInstanceOf(GenerateKitPromoCodeError);
  });

  it("throws CONTRACT_NOT_SIGNED unless override is set", async () => {
    const repository = makeRepo({
      getCreatorById: vi.fn().mockResolvedValue(makeCreator({ contractSignedAt: undefined }))
    });

    await expect(
      generateKitPromoCode({
        creatorId: CREATOR_ID,
        repository,
        createDiscount: vi.fn(),
        sendEmail: noopEmail
      })
    ).rejects.toMatchObject({ code: "CONTRACT_NOT_SIGNED" });
  });

  it("wraps non-collision Shopify errors in SHOPIFY_ERROR", async () => {
    const repository = makeRepo();
    const createDiscount = vi
      .fn()
      .mockRejectedValue(new ShopifyApiError("Shopify down", { status: 500 }));

    await expect(
      generateKitPromoCode({
        creatorId: CREATOR_ID,
        repository,
        createDiscount,
        sendEmail: noopEmail
      })
    ).rejects.toMatchObject({ code: "SHOPIFY_ERROR" });
  });
});
