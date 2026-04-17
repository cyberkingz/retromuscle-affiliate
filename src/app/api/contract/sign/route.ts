import crypto from "node:crypto";
import { isIP } from "node:net";

import {
  AFFILIATE_CONTRACT_VERSION,
  getAffiliateContractCanonicalText
} from "@/domain/contracts/affiliate-program-contract";
import { getRepository } from "@/application/dependencies";
import {
  GenerateKitPromoCodeError,
  generateKitPromoCode
} from "@/application/use-cases/generate-kit-promo-code";
import { requireApiRole } from "@/features/auth/server/api-guards";
import { setAuthCookies } from "@/features/auth/server/auth-cookies";
import { apiError, apiJson, createApiContext, handleBodyParseError } from "@/lib/api-response";
import { isAllowedOrigin } from "@/lib/origin";
import { rateLimit } from "@/lib/rate-limit";
import { readJsonBodyWithLimit } from "@/lib/request-body";

export const runtime = "nodejs";

interface ContractSignPayload {
  signerName: string;
  accepted: {
    terms: boolean;
    age18: boolean;
    rightsAndReleases: boolean;
  };
}

function parsePayload(body: unknown): ContractSignPayload {
  if (!body || typeof body !== "object") {
    throw new Error("Payload invalide.");
  }

  const input = body as Record<string, unknown>;
  const signerName = typeof input.signerName === "string" ? input.signerName.trim() : "";
  const accepted =
    input.accepted && typeof input.accepted === "object"
      ? (input.accepted as Record<string, unknown>)
      : {};

  const terms = Boolean(accepted.terms);
  const age18 = Boolean(accepted.age18);
  const rightsAndReleases = Boolean(accepted.rightsAndReleases);

  if (signerName.length < 2 || signerName.length > 120) {
    throw new Error("Nom de signature invalide.");
  }
  if (!terms || !age18 || !rightsAndReleases) {
    throw new Error("Toutes les declarations doivent etre acceptees.");
  }

  return { signerName, accepted: { terms, age18, rightsAndReleases } };
}

function getClientIp(request: Request): string | null {
  const forwarded =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip");
  if (!forwarded) {
    return null;
  }

  const value = forwarded.split(",")[0]?.trim() ?? "";
  return isIP(value) ? value : null;
}

export async function POST(request: Request) {
  const ctx = createApiContext(request);
  if (!isAllowedOrigin(request)) {
    return apiError(ctx, { status: 403, code: "INVALID_ORIGIN", message: "Invalid origin" });
  }

  const limited = await rateLimit({
    ctx,
    request,
    key: "contract:sign",
    limit: 30,
    windowMs: 60_000
  });
  if (limited) {
    return limited;
  }

  const auth = await requireApiRole(request, "affiliate", { ctx });
  if (!auth.ok) {
    return auth.response;
  }

  let rawBody: unknown;
  try {
    rawBody = await readJsonBodyWithLimit(request, { maxBytes: 6 * 1024 });
  } catch (error) {
    const response = handleBodyParseError(ctx, error);
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }

  let payload: ContractSignPayload;
  try {
    payload = parsePayload(rawBody);
  } catch (error) {
    const response = apiError(ctx, {
      status: 400,
      code: "BAD_REQUEST",
      message: error instanceof Error ? error.message : "Payload invalide."
    });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }

  const repository = getRepository();

  const creator = await repository.getCreatorByUserId(auth.session.userId);
  if (!creator) {
    const response = apiError(ctx, {
      status: 404,
      code: "NOT_FOUND",
      message: "Creator not found"
    });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }

  const contractText = getAffiliateContractCanonicalText();
  const checksum = crypto.createHash("sha256").update(contractText, "utf8").digest("hex");
  const now = new Date().toISOString();

  let signatureOutcome: Awaited<ReturnType<typeof repository.signContract>>;
  try {
    signatureOutcome = await repository.signContract({
      creatorId: creator.id,
      userId: auth.session.userId,
      contractVersion: AFFILIATE_CONTRACT_VERSION,
      contractChecksum: checksum,
      contractText,
      signerName: payload.signerName,
      acceptance: payload.accepted,
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent")?.slice(0, 700) ?? null,
      signedAt: now
    });
  } catch (error) {
    const response = apiError(ctx, {
      status: 500,
      code: "INTERNAL",
      message: error instanceof Error ? error.message : "Unable to sign contract."
    });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }

  // First-time side effect: Shopify promo code generation + welcome email.
  // Failure must NOT fail the signing request — the signature is the source of
  // truth; side effects can be retried via the admin regenerate path.
  let promoCode: string | null = null;
  if (signatureOutcome.wasFirstTimeSigning) {
    try {
      const generated = await generateKitPromoCode({ creatorId: creator.id, repository });
      promoCode = generated.code;
    } catch (error) {
      const code = error instanceof GenerateKitPromoCodeError ? error.code : "UNKNOWN";
      console.error("[contract:sign] generateKitPromoCode failed", {
        creatorId: creator.id,
        code,
        message: error instanceof Error ? error.message : "unknown"
      });
    }
  } else if (creator.kitPromoCode) {
    promoCode = creator.kitPromoCode;
  }

  const response = apiJson(
    ctx,
    {
      creatorId: creator.id,
      signatureId: signatureOutcome.signatureId,
      contractVersion: AFFILIATE_CONTRACT_VERSION,
      contractChecksum: checksum,
      contractSignedAt: signatureOutcome.contractSignedAt,
      promoCode
    },
    { status: 200 }
  );
  if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
  return response;
}
