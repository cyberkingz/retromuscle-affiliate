import { ShopifyAdminClient, ShopifyApiError } from "./shopify-admin-client";

/**
 * Build a creator-scoped Shopify promo code from a handle.
 * Format: `RETRO-<HANDLE-UPPERCASE>`, stripped to [A-Z0-9-] and bounded to 64 chars.
 */
export function buildKitPromoCode(handle: string): string {
  const normalized = (handle || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!normalized) {
    throw new Error("Cannot build promo code from empty handle");
  }
  return `RETRO-${normalized}`.slice(0, 64);
}

/**
 * Create a 20%-off single-use discount code on all products for one creator.
 * Returns the stored code + Shopify discount node gid.
 *
 * Matches plan spec:
 *   - customerGets.items.all = true      (all products)
 *   - customerGets.value.percentage 0.20 (20% off)
 *   - usageLimit = 1                     (single-use)
 *   - startsAt now, no endsAt (no expiry)
 */
export async function createDiscountCodeOnShopify(input: {
  code: string;
  title?: string;
  client?: ShopifyAdminClient;
}): Promise<{ code: string; discountId: string }> {
  const client = input.client ?? new ShopifyAdminClient();
  const title = input.title ?? input.code;

  type MutationResponse = {
    discountCodeBasicCreate: {
      codeDiscountNode: {
        id: string;
        codeDiscount?: {
          __typename: string;
          codes?: { nodes?: Array<{ code: string }> };
        };
      } | null;
      userErrors: Array<{ field: string[] | null; message: string; code?: string }>;
    };
  };

  const mutation = /* GraphQL */ `
    mutation CreateKitDiscount($basicCodeDiscount: DiscountCodeBasicInput!) {
      discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
        codeDiscountNode {
          id
          codeDiscount {
            __typename
            ... on DiscountCodeBasic {
              codes(first: 1) {
                nodes {
                  code
                }
              }
            }
          }
        }
        userErrors {
          field
          message
          code
        }
      }
    }
  `;

  const data = await client.query<MutationResponse>({
    query: mutation,
    expectUserErrorsField: "discountCodeBasicCreate",
    variables: {
      basicCodeDiscount: {
        title,
        code: input.code,
        startsAt: new Date().toISOString(),
        customerSelection: { all: true },
        customerGets: {
          value: {
            percentage: 0.2
          },
          items: {
            all: true
          }
        },
        appliesOncePerCustomer: true,
        usageLimit: 1
      }
    }
  });

  const node = data.discountCodeBasicCreate.codeDiscountNode;
  if (!node?.id) {
    throw new ShopifyApiError("Shopify did not return a codeDiscountNode id", {});
  }

  const returnedCode =
    node.codeDiscount?.codes?.nodes?.[0]?.code ?? input.code;

  return {
    code: returnedCode,
    discountId: node.id
  };
}
