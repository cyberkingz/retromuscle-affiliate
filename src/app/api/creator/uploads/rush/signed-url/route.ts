import { requireApiRole } from "@/features/auth/server/api-guards";
import { setAuthCookies } from "@/features/auth/server/auth-cookies";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server-client";
import { resolveUploadTrackingForUser } from "@/application/use-cases/resolve-upload-tracking";
import { apiError, apiJson, createApiContext, handleBodyParseError } from "@/lib/api-response";
import { isAllowedOrigin } from "@/lib/origin";
import { rateLimit } from "@/lib/rate-limit";
import { readJsonBodyWithLimit } from "@/lib/request-body";
import { isUuid } from "@/lib/validation";

interface SignedRushUploadPayload {
  monthlyTrackingId?: string;
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

  if (monthlyTrackingId && !isUuid(monthlyTrackingId)) {
    throw new Error("Invalid monthlyTrackingId");
  }

  return {
    monthlyTrackingId: monthlyTrackingId || undefined,
    filename: sanitizeFilename(filename)
  };
}

export async function POST(request: Request) {
  const ctx = createApiContext(request);
  if (!isAllowedOrigin(request)) {
    return apiError(ctx, { status: 403, code: "INVALID_ORIGIN", message: "Invalid origin" });
  }

  const limited = await rateLimit({
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
    const response = handleBodyParseError(ctx, error);
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }

  let trackingId = payload.monthlyTrackingId;
  try {
    const context = await resolveUploadTrackingForUser({
      userId: auth.session.userId,
      monthlyTrackingId: payload.monthlyTrackingId
    });
    trackingId = context.monthlyTrackingId;
  } catch (error) {
    const message =
      error instanceof Error && error.message.toLowerCase().includes("creator")
        ? "Createur introuvable"
        : "Suivi mensuel introuvable";
    const response = apiError(ctx, { status: 404, code: "NOT_FOUND", message });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }

  const supabase = createSupabaseServerClient();
  const key = `${auth.session.userId}/${trackingId}/rushes/${Date.now()}-${payload.filename}`;
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
      monthlyTrackingId: trackingId,
      signedUrl: data.signedUrl,
      token: data.token
    },
    { status: 200 }
  );
  if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
  return response;
}
