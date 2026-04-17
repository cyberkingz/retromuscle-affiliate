import crypto from "node:crypto";
import { describe, expect, it } from "vitest";

import { verifyShopifyWebhookHmac } from "./verify-webhook-hmac";

function sign(body: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(body, "utf8").digest("base64");
}

describe("verifyShopifyWebhookHmac", () => {
  const secret = "test-webhook-secret";
  const rawBody = JSON.stringify({ id: 123, name: "#1001" });

  it("returns true for a valid signature", () => {
    const providedSignatureBase64 = sign(rawBody, secret);
    expect(
      verifyShopifyWebhookHmac({ rawBody, providedSignatureBase64, secret })
    ).toBe(true);
  });

  it("returns false when the body was tampered with", () => {
    const providedSignatureBase64 = sign(rawBody, secret);
    expect(
      verifyShopifyWebhookHmac({
        rawBody: rawBody + "x",
        providedSignatureBase64,
        secret
      })
    ).toBe(false);
  });

  it("returns false when the signature was produced with a different secret", () => {
    const providedSignatureBase64 = sign(rawBody, "other-secret");
    expect(
      verifyShopifyWebhookHmac({ rawBody, providedSignatureBase64, secret })
    ).toBe(false);
  });

  it("returns false for a signature of the wrong length", () => {
    const tooShort = Buffer.from([1, 2, 3]).toString("base64");
    expect(
      verifyShopifyWebhookHmac({ rawBody, providedSignatureBase64: tooShort, secret })
    ).toBe(false);
  });

  it("returns false when the signature header is missing", () => {
    expect(
      verifyShopifyWebhookHmac({ rawBody, providedSignatureBase64: null, secret })
    ).toBe(false);
    expect(
      verifyShopifyWebhookHmac({ rawBody, providedSignatureBase64: undefined, secret })
    ).toBe(false);
    expect(
      verifyShopifyWebhookHmac({ rawBody, providedSignatureBase64: "", secret })
    ).toBe(false);
  });

  it("returns false when the secret is empty", () => {
    const providedSignatureBase64 = sign(rawBody, secret);
    expect(
      verifyShopifyWebhookHmac({ rawBody, providedSignatureBase64, secret: "" })
    ).toBe(false);
  });

  it("returns false when the signature is not valid base64 of 32 bytes", () => {
    expect(
      verifyShopifyWebhookHmac({
        rawBody,
        providedSignatureBase64: "not-base64-of-32-bytes!!",
        secret
      })
    ).toBe(false);
  });
});
