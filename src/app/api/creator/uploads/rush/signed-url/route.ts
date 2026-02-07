import { NextResponse } from "next/server";

import { requireApiRole } from "@/features/auth/server/api-guards";
import { setAuthCookies } from "@/features/auth/server/auth-cookies";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server-client";
import { apiError, apiJson, createApiContext } from "@/lib/api-response";
import { isAllowedOrigin } from "@/lib/origin";
import { rateLimit } from "@/lib/rate-limit";
import { readJsonBodyWithLimit } from "@/lib/request-body";
import { isUuid } from "@/lib/validation";

interface SignedRushUploadPayload {
  monthlyTrackingId: string;
  filename: string;
}

function sanitizeFilename(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "rush.mp4";
  }
  return trimmed.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 96);
}

function parsePayload(body: unknown): SignedRushUploadPayload {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid payload");
  }

  const input = body as Record<string, unknown>;
  const monthlyTrackingId = typeof input.monthlyTrackingId === "string" ? input.monthlyTrackingId.trim() : "";
  const filename = typeof input.filename === "string" ? input.filename : "";

  if (!monthlyTrackingId || !isUuid(monthlyTrackingId)) {
    throw new Error("Invalid monthlyTrackingId");
  }

  return {
    monthlyTrackingId,
    filename: sanitizeFilename(filename)
  };
}

export async function POST(request: Request) {
  const ctx = createApiContext(request);
  if (!isAllowedOrigin(request)) {
    return apiError(ctx, { status: 403, code: "INVALID_ORIGIN", message: "Invalid origin" });
  }

  const limited = rateLimit({
    ctx,
    request,
    key: "creator:uploads:rush:signed-url",
    limit: 40,
    windowMs: 60_000
  });
  if (limited) {
    return limited;
  }

  const auth = await requireApiRole(request, "affiliate", { ctx });
  if (!auth.ok) {
    return auth.response;
  }

  let payload: SignedRushUploadPayload;
  try {
    payload = parsePayload(await readJsonBodyWithLimit(request, { maxBytes: 12 * 1024 }));
  } catch (error) {
    const response = apiError(ctx, {
      status: error instanceof Error && error.message === "PAYLOAD_TOO_LARGE" ? 413 : 400,
      code: error instanceof Error && error.message === "PAYLOAD_TOO_LARGE" ? "PAYLOAD_TOO_LARGE" : "BAD_REQUEST",
      message:
        error instanceof Error && error.message === "PAYLOAD_TOO_LARGE"
          ? "Payload trop volumineux."
          : error instanceof Error && error.message === "INVALID_JSON"
            ? "Payload invalide."
            : error instanceof Error
              ? error.message
              : "Invalid payload"
    });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }

  const key = `${auth.session.userId}/${payload.monthlyTrackingId}/rushes/${Date.now()}-${payload.filename}`;
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.storage.from("rushes").createSignedUploadUrl(key, { upsert: false });

  if (error || !data?.signedUrl || !data.token) {
    const response = apiError(ctx, { status: 500, code: "INTERNAL", message: "Unable to create upload URL" });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }

  const response = apiJson(
    ctx,
    {
      key,
      signedUrl: data.signedUrl,
      token: data.token
    },
    { status: 200 }
  );
  if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
  return response;
}

