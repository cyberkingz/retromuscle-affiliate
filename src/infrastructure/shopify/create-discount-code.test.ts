import { describe, expect, it } from "vitest";

import {
  buildKitPromoCode,
  createDiscountCodeOnShopify
} from "./create-discount-code";
import { ShopifyAdminClient, ShopifyApiError } from "./shopify-admin-client";

function makeClientWithFetch(
  handler: (url: string, init: RequestInit) => Promise<Response>
): ShopifyAdminClient {
  return new ShopifyAdminClient({
    shopDomain: "test.myshopify.com",
    adminApiToken: "shpat_test",
    fetchImpl: handler as unknown as typeof fetch
  });
}

describe("buildKitPromoCode", () => {
  it("uppercases and prefixes with RETRO-", () => {
    expect(buildKitPromoCode("cocolaban")).toBe("RETRO-COCOLABAN");
  });

  it("replaces non-alphanumeric runs with a single hyphen", () => {
    expect(buildKitPromoCode("coco.laban  88")).toBe("RETRO-COCO-LABAN-88");
  });

  it("strips leading/trailing hyphens from the handle", () => {
    expect(buildKitPromoCode("--abc--")).toBe("RETRO-ABC");
  });

  it("throws when the handle is empty", () => {
    expect(() => buildKitPromoCode("")).toThrow();
    expect(() => buildKitPromoCode("---")).toThrow();
  });

  it("caps length at 64 characters", () => {
    const long = "a".repeat(100);
    expect(buildKitPromoCode(long).length).toBeLessThanOrEqual(64);
  });
});

describe("createDiscountCodeOnShopify", () => {
  it("returns the code + discountId on a successful mutation", async () => {
    const fakeResponse = {
      data: {
        discountCodeBasicCreate: {
          codeDiscountNode: {
            id: "gid://shopify/DiscountCodeNode/111",
            codeDiscount: {
              __typename: "DiscountCodeBasic",
              codes: { nodes: [{ code: "RETRO-COCOLABAN" }] }
            }
          },
          userErrors: []
        }
      }
    };

    const client = makeClientWithFetch(async () => {
      return new Response(JSON.stringify(fakeResponse), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    });

    const result = await createDiscountCodeOnShopify({
      code: "RETRO-COCOLABAN",
      client
    });

    expect(result).toEqual({
      code: "RETRO-COCOLABAN",
      discountId: "gid://shopify/DiscountCodeNode/111"
    });
  });

  it("throws ShopifyApiError on userErrors (e.g., code collision)", async () => {
    const fakeResponse = {
      data: {
        discountCodeBasicCreate: {
          codeDiscountNode: null,
          userErrors: [
            {
              field: ["basicCodeDiscount", "code"],
              message: "Code has already been taken",
              code: "TAKEN"
            }
          ]
        }
      }
    };

    const client = makeClientWithFetch(async () => {
      return new Response(JSON.stringify(fakeResponse), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    });

    await expect(
      createDiscountCodeOnShopify({ code: "RETRO-COCOLABAN", client })
    ).rejects.toBeInstanceOf(ShopifyApiError);
  });

  it("throws on HTTP 401 / non-retryable errors", async () => {
    const client = makeClientWithFetch(async () => {
      return new Response("Unauthorized", { status: 401 });
    });

    await expect(
      createDiscountCodeOnShopify({ code: "RETRO-COCOLABAN", client })
    ).rejects.toBeInstanceOf(ShopifyApiError);
  });
});
