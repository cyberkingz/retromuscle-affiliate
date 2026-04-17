import crypto from "node:crypto";

/**
 * Verify a Shopify webhook signature using timing-safe HMAC-SHA256.
 *
 * Shopify sends the webhook payload hashed with the shared secret and the
 * Base64-encoded digest in the `X-Shopify-Hmac-Sha256` header. The raw request
 * body (before any JSON parse) must be passed through exactly, otherwise the
 * signatures will not match.
 *
 * Returns `true` only when both digests have the same byte length and are
 * bytewise equal. All other cases (missing/short/long header, invalid base64,
 * signature mismatch) return `false` without leaking timing information.
 */
export function verifyShopifyWebhookHmac(input: {
  rawBody: string;
  providedSignatureBase64: string | null | undefined;
  secret: string;
}): boolean {
  const { rawBody, providedSignatureBase64, secret } = input;

  if (!secret) return false;
  if (typeof providedSignatureBase64 !== "string") return false;
  if (providedSignatureBase64.length === 0) return false;

  let providedBuffer: Buffer;
  try {
    providedBuffer = Buffer.from(providedSignatureBase64, "base64");
  } catch {
    return false;
  }
  // HMAC-SHA256 always yields 32 bytes.
  if (providedBuffer.length !== 32) return false;

  const expectedBuffer = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest();

  if (expectedBuffer.length !== providedBuffer.length) return false;

  return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}
