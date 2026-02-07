import crypto from "node:crypto";
import { isIP } from "node:net";

import { requireApiRole } from "@/features/auth/server/api-guards";
import { setAuthCookies } from "@/features/auth/server/auth-cookies";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server-client";
import { apiError, apiJson, createApiContext } from "@/lib/api-response";
import { isAllowedOrigin } from "@/lib/origin";
import { rateLimit } from "@/lib/rate-limit";
import { readJsonBodyWithLimit } from "@/lib/request-body";
import {
  AFFILIATE_CONTRACT_VERSION,
  getAffiliateContractCanonicalText
} from "@/domain/contracts/affiliate-program-contract";

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
  const accepted = input.accepted && typeof input.accepted === "object" ? (input.accepted as Record<string, unknown>) : {};

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
  const forwarded = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || request.headers.get("cf-connecting-ip");
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

  const limited = rateLimit({ ctx, request, key: "contract:sign", limit: 30, windowMs: 60_000 });
  if (limited) {
    return limited;
  }

  const auth = await requireApiRole(request, "affiliate", { ctx });
  if (!auth.ok) {
    return auth.response;
  }

  const client = createSupabaseServerClient();
  const now = new Date().toISOString();

  let rawBody: unknown;
  try {
    rawBody = await readJsonBodyWithLimit(request, { maxBytes: 6 * 1024 });
  } catch (error) {
    const isTooLarge = error instanceof Error && error.message === "PAYLOAD_TOO_LARGE";
    const response = apiError(ctx, {
      status: isTooLarge ? 413 : 400,
      code: isTooLarge ? "PAYLOAD_TOO_LARGE" : "BAD_REQUEST",
      message: isTooLarge ? "Payload trop volumineux." : "Payload invalide."
    });
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

  const contractText = getAffiliateContractCanonicalText();
  const checksum = crypto.createHash("sha256").update(contractText, "utf8").digest("hex");
  const ip = getClientIp(request);
  const userAgent = request.headers.get("user-agent")?.slice(0, 700) ?? null;

  const { data: creator, error: creatorError } = await client
    .from("creators")
    .select("id, contract_signed_at")
    .eq("user_id", auth.session.userId)
    .maybeSingle();

  if (creatorError) {
    const response = apiError(ctx, { status: 500, code: "INTERNAL", message: "Unable to load creator profile." });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }

  if (!creator?.id) {
    const response = apiError(ctx, { status: 404, code: "NOT_FOUND", message: "Creator not found" });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }

  const signatureInsert = await client
    .from("creator_contract_signatures")
    .upsert(
      {
        creator_id: creator.id,
        user_id: auth.session.userId,
        contract_version: AFFILIATE_CONTRACT_VERSION,
        contract_checksum: checksum,
        contract_text: contractText,
        signer_name: payload.signerName,
        acceptance: payload.accepted,
        ip,
        user_agent: userAgent,
        signed_at: now
      },
      { onConflict: "user_id,contract_checksum", ignoreDuplicates: true }
    )
    .select("id, signed_at")
    .maybeSingle();

  if (signatureInsert.error) {
    const response = apiError(ctx, { status: 500, code: "INTERNAL", message: "Unable to sign contract." });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }

  let signatureId: string | null = signatureInsert.data?.id ?? null;
  let signedAt: string = signatureInsert.data?.signed_at ?? now;

  if (!signatureId) {
    const existing = await client
      .from("creator_contract_signatures")
      .select("id, signed_at")
      .eq("user_id", auth.session.userId)
      .eq("contract_checksum", checksum)
      .order("signed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    signatureId = existing.data?.id ?? null;
    signedAt = existing.data?.signed_at ?? now;
  }

  const { data: updatedCreator, error: updateError } = await client
    .from("creators")
    .update({ contract_signed_at: signedAt })
    .eq("id", creator.id)
    .select("contract_signed_at")
    .maybeSingle();

  if (updateError) {
    const response = apiError(ctx, { status: 500, code: "INTERNAL", message: "Unable to finalize contract signature." });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }

  const response = apiJson(
    ctx,
    {
      creatorId: creator.id,
      signatureId,
      contractVersion: AFFILIATE_CONTRACT_VERSION,
      contractChecksum: checksum,
      contractSignedAt: updatedCreator?.contract_signed_at ?? signedAt
    },
    { status: 200 }
  );
  if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
  return response;
}
