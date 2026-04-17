import { NextResponse } from "next/server";

import { markKitOrderPlaced } from "@/application/use-cases/mark-kit-order-placed";
import { verifyShopifyWebhookHmac } from "@/infrastructure/shopify/verify-webhook-hmac";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Shopify `orders/create` webhook.
 *
 * Authentication = HMAC-SHA256 verification of the raw body with the shared
 * secret. We do NOT call `requireApiRole()` here: this is a server-to-server
 * callback, not a user session.
 *
 * Response policy:
 *   - 200 on success / already-deduped / code-did-not-match (tell Shopify to
 *     stop retrying).
 *   - 401 on HMAC/shop mismatch.
 *   - 400 on malformed body.
 *   - 500 on downstream failure (lets Shopify retry).
 * Empty body on all responses — no JSON leakage.
 */
export async function POST(request: Request) {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  const expectedShopDomain = process.env.SHOPIFY_SHOP_DOMAIN;

  if (!secret || !expectedShopDomain) {
    // Misconfiguration: treat as server error so Shopify retries once admin fixes env.
    return new NextResponse(null, { status: 500 });
  }

  const providedSignature = request.headers.get("x-shopify-hmac-sha256");
  const shopDomain = request.headers.get("x-shopify-shop-domain");
  const topic = request.headers.get("x-shopify-topic") ?? "orders/create";
  const webhookId = request.headers.get("x-shopify-webhook-id");

  if (!webhookId) {
    return new NextResponse(null, { status: 400 });
  }

  // Validate shop domain BEFORE HMAC to reject replays from unknown shops.
  if (shopDomain !== expectedShopDomain) {
    return new NextResponse(null, { status: 401 });
  }

  // Read RAW body BEFORE any JSON parse for accurate HMAC input.
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  const hmacValid = verifyShopifyWebhookHmac({
    rawBody,
    providedSignatureBase64: providedSignature,
    secret
  });
  if (!hmacValid) {
    return new NextResponse(null, { status: 401 });
  }

  let payload: ShopifyOrderCreatePayload;
  try {
    const parsed: unknown = JSON.parse(rawBody);
    payload = parseOrderCreatePayload(parsed);
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  try {
    await markKitOrderPlaced({
      webhookId,
      topic,
      shopDomain,
      orderGid: payload.orderGid,
      orderNumericId: payload.orderNumericId,
      appliedDiscountCodes: payload.appliedDiscountCodes,
      orderCreatedAt: payload.orderCreatedAt
    });
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error("[shopify-webhook] markKitOrderPlaced failed", {
      webhookId,
      message: error instanceof Error ? error.message : "unknown"
    });
    return new NextResponse(null, { status: 500 });
  }
}

interface ShopifyOrderCreatePayload {
  orderGid: string;
  orderNumericId: string | null;
  appliedDiscountCodes: string[];
  orderCreatedAt: string;
}

function parseOrderCreatePayload(raw: unknown): ShopifyOrderCreatePayload {
  if (!raw || typeof raw !== "object") {
    throw new Error("order payload is not an object");
  }
  const input = raw as Record<string, unknown>;

  const orderNumericId =
    typeof input.id === "number"
      ? String(input.id)
      : typeof input.id === "string"
        ? input.id
        : null;

  const adminGid =
    typeof input.admin_graphql_api_id === "string" ? input.admin_graphql_api_id : null;

  const orderGid = adminGid ?? (orderNumericId ? `gid://shopify/Order/${orderNumericId}` : "");
  if (!orderGid) {
    throw new Error("order payload missing id");
  }

  const orderCreatedAt =
    typeof input.created_at === "string" ? input.created_at : new Date().toISOString();

  const codes = new Set<string>();
  const discountCodes = input.discount_codes;
  if (Array.isArray(discountCodes)) {
    for (const entry of discountCodes) {
      if (entry && typeof entry === "object") {
        const code = (entry as Record<string, unknown>).code;
        if (typeof code === "string" && code.trim()) codes.add(code.trim().toUpperCase());
      }
    }
  }
  const discountApplications = input.discount_applications;
  if (Array.isArray(discountApplications)) {
    for (const entry of discountApplications) {
      if (entry && typeof entry === "object") {
        const code = (entry as Record<string, unknown>).code;
        if (typeof code === "string" && code.trim()) codes.add(code.trim().toUpperCase());
      }
    }
  }

  return {
    orderGid,
    orderNumericId,
    appliedDiscountCodes: Array.from(codes),
    orderCreatedAt
  };
}
