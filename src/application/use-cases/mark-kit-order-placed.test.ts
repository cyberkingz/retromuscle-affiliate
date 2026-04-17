import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Creator } from "@/domain/types";
import type { CreatorRepository } from "@/application/repositories/creator-repository";
import { markKitOrderPlaced } from "@/application/use-cases/mark-kit-order-placed";

const CREATOR_ID = "creator-xyz";
const WEBHOOK_ID = "wh-abcd-0001";

function makeCreator(overrides: Partial<Creator> = {}): Creator {
  return {
    id: CREATOR_ID,
    handle: "cocolaban",
    displayName: "Coco Laban",
    email: "coco@example.com",
    whatsapp: "+33600000000",
    country: "FR",
    address: "1 rue X",
    followersTiktok: 0,
    followersInstagram: 0,
    socialLinks: {},
    status: "actif",
    startDate: "2026-04-01",
    contractSignedAt: "2026-04-02T10:00:00Z",
    kitPromoCode: "RETRO-COCOLABAN",
    shopifyDiscountId: "gid://shopify/DiscountCodeNode/1",
    ...overrides
  };
}

function makeRepo(overrides: Partial<CreatorRepository> = {}): CreatorRepository {
  return {
    recordShopifyWebhookOnce: vi.fn().mockResolvedValue(true),
    rollbackShopifyWebhook: vi.fn().mockResolvedValue(undefined),
    getCreatorByKitPromoCode: vi.fn().mockResolvedValue(makeCreator()),
    markKitOrdered: vi.fn().mockImplementation(async (input) =>
      makeCreator({
        kitOrderPlacedAt: input.kitOrderPlacedAt,
        shopifyKitOrderId: input.shopifyKitOrderId
      })
    ),
    ...overrides
  } as unknown as CreatorRepository;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("markKitOrderPlaced", () => {
  const baseInput = {
    webhookId: WEBHOOK_ID,
    topic: "orders/create",
    shopDomain: "retromuscle.myshopify.com",
    orderGid: "gid://shopify/Order/555",
    appliedDiscountCodes: ["RETRO-COCOLABAN"],
    orderCreatedAt: "2026-04-17T12:00:00Z"
  };

  it("records a first-time order and marks the creator kit ordered", async () => {
    const repository = makeRepo();

    const result = await markKitOrderPlaced(baseInput, { repository });

    expect(result.outcome).toBe("recorded");
    expect(result.creatorId).toBe(CREATOR_ID);
    expect(result.matchedCode).toBe("RETRO-COCOLABAN");

    expect(repository.recordShopifyWebhookOnce).toHaveBeenCalledWith(
      expect.objectContaining({
        webhookId: WEBHOOK_ID,
        topic: "orders/create",
        shopDomain: "retromuscle.myshopify.com"
      })
    );
    expect(repository.markKitOrdered).toHaveBeenCalledWith({
      creatorId: CREATOR_ID,
      kitOrderPlacedAt: "2026-04-17T12:00:00Z",
      shopifyKitOrderId: "gid://shopify/Order/555",
      orderAmount: null,
      orderCurrency: null
    });
    expect(repository.rollbackShopifyWebhook).not.toHaveBeenCalled();
  });

  it("returns duplicate_webhook when the webhook was already recorded", async () => {
    const repository = makeRepo({
      recordShopifyWebhookOnce: vi.fn().mockResolvedValue(false)
    });

    const result = await markKitOrderPlaced(baseInput, { repository });

    expect(result.outcome).toBe("duplicate_webhook");
    expect(repository.getCreatorByKitPromoCode).not.toHaveBeenCalled();
    expect(repository.markKitOrdered).not.toHaveBeenCalled();
  });

  it("returns no_creator_code_match when no code matches a creator", async () => {
    const repository = makeRepo({
      getCreatorByKitPromoCode: vi.fn().mockResolvedValue(null)
    });

    const result = await markKitOrderPlaced(
      {
        ...baseInput,
        appliedDiscountCodes: ["SUMMER2026"]
      },
      { repository }
    );

    expect(result.outcome).toBe("no_creator_code_match");
    expect(repository.markKitOrdered).not.toHaveBeenCalled();
    expect(repository.rollbackShopifyWebhook).not.toHaveBeenCalled();
  });

  it("returns already_marked when the creator has a kit order already", async () => {
    const repository = makeRepo({
      getCreatorByKitPromoCode: vi
        .fn()
        .mockResolvedValue(makeCreator({ kitOrderPlacedAt: "2026-04-10T12:00:00Z" }))
    });

    const result = await markKitOrderPlaced(baseInput, { repository });

    expect(result.outcome).toBe("already_marked");
    expect(repository.markKitOrdered).not.toHaveBeenCalled();
  });

  it("rolls back the webhook record when markKitOrdered throws", async () => {
    const repository = makeRepo({
      markKitOrdered: vi.fn().mockRejectedValue(new Error("db down"))
    });

    await expect(markKitOrderPlaced(baseInput, { repository })).rejects.toThrow("db down");
    expect(repository.rollbackShopifyWebhook).toHaveBeenCalledWith(WEBHOOK_ID);
  });

  it("iterates applied codes until it finds a match", async () => {
    const repository = makeRepo({
      getCreatorByKitPromoCode: vi.fn().mockImplementation(async (code: string) => {
        if (code.toUpperCase() === "RETRO-COCOLABAN") return makeCreator();
        return null;
      })
    });

    const result = await markKitOrderPlaced(
      {
        ...baseInput,
        appliedDiscountCodes: ["SUMMER2026", "RETRO-COCOLABAN"]
      },
      { repository }
    );

    expect(result.outcome).toBe("recorded");
    expect(result.matchedCode).toBe("RETRO-COCOLABAN");
    expect(repository.getCreatorByKitPromoCode).toHaveBeenCalledTimes(2);
  });
});
