import { requireApiRole } from "@/features/auth/server/api-guards";
import { setAuthCookies } from "@/features/auth/server/auth-cookies";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server-client";
import { VIDEO_TYPES, type VideoAsset } from "@/domain/types";
import { apiError, apiJson, createApiContext, handleBodyParseError } from "@/lib/api-response";
import { isAllowedOrigin } from "@/lib/origin";
import { rateLimit } from "@/lib/rate-limit";
import { readJsonBodyWithLimit } from "@/lib/request-body";
import { isUuid } from "@/lib/validation";

interface SignedUploadPayload {
  monthlyTrackingId: string;
  videoType: VideoAsset["videoType"];
  filename: string;
}

function sanitizeFilename(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "video.mp4";
  }
  return trimmed.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 96);
}

function parsePayload(body: unknown): SignedUploadPayload {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid payload");
  }

  const input = body as Record<string, unknown>;
  const monthlyTrackingId = typeof input.monthlyTrackingId === "string" ? input.monthlyTrackingId.trim() : "";
  const videoTypeRaw = typeof input.videoType === "string" ? input.videoType.trim().toUpperCase() : "";
  const filename = typeof input.filename === "string" ? input.filename : "";

  if (!monthlyTrackingId || !isUuid(monthlyTrackingId)) {
    throw new Error("Invalid monthlyTrackingId");
  }
  if (!VIDEO_TYPES.includes(videoTypeRaw as VideoAsset["videoType"])) {
    throw new Error("Invalid videoType");
  }

  return {
    monthlyTrackingId,
    videoType: videoTypeRaw as VideoAsset["videoType"],
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
    key: "creator:uploads:video:signed-url",
    limit: 60,
    windowMs: 60_000
  });
  if (limited) {
    return limited;
  }

  const auth = await requireApiRole(request, "affiliate", { ctx });
  if (!auth.ok) {
    return auth.response;
  }

  let payload: SignedUploadPayload;
  try {
    payload = parsePayload(await readJsonBodyWithLimit(request, { maxBytes: 12 * 1024 }));
  } catch (error) {
    const response = handleBodyParseError(ctx, error);
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }

  // Verify tracking ownership: monthlyTrackingId must belong to this user's creator
  const supabase = createSupabaseServerClient();
  const { data: tracking } = await supabase
    .from("monthly_tracking")
    .select("id,creator_id")
    .eq("id", payload.monthlyTrackingId)
    .maybeSingle();

  if (!tracking) {
    const response = apiError(ctx, { status: 404, code: "NOT_FOUND", message: "Suivi mensuel introuvable" });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }

  const { data: creator } = await supabase
    .from("creators")
    .select("id")
    .eq("id", tracking.creator_id)
    .eq("user_id", auth.session.userId)
    .maybeSingle();

  if (!creator) {
    const response = apiError(ctx, { status: 403, code: "FORBIDDEN", message: "Acces refuse a ce suivi mensuel" });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }

  const key = `${auth.session.userId}/${payload.monthlyTrackingId}/${payload.videoType}/${Date.now()}-${payload.filename}`;
  const { data, error } = await supabase.storage.from("videos").createSignedUploadUrl(key, { upsert: false });

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
