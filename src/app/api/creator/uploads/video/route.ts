import { recordVideoUpload } from "@/application/use-cases/record-video-upload";
import { VIDEO_TYPES, type VideoAsset } from "@/domain/types";
import { requireApiRole } from "@/features/auth/server/api-guards";
import { setAuthCookies } from "@/features/auth/server/auth-cookies";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server-client";
import { apiError, apiJson, createApiContext, handleBodyParseError } from "@/lib/api-response";
import { isAllowedOrigin } from "@/lib/origin";
import { rateLimit } from "@/lib/rate-limit";
import { readJsonBodyWithLimit } from "@/lib/request-body";
import { isUuid } from "@/lib/validation";

interface UploadVideoPayload {
  monthlyTrackingId: string;
  videoType: VideoAsset["videoType"];
  fileUrl: string;
  durationSeconds: number;
  resolution: VideoAsset["resolution"];
  fileSizeMb: number;
}

function resolveRecordUploadError(error: unknown): {
  status: number;
  code: "BAD_REQUEST" | "NOT_FOUND" | "INTERNAL";
  message: string;
} {
  if (!(error instanceof Error)) {
    return { status: 500, code: "INTERNAL", message: "Unable to record upload" };
  }

  if (
    error.message.startsWith("Invalid videoType:") ||
    error.message.startsWith("Rate not found for videoType:") ||
    error.message.startsWith("Video type is disabled:")
  ) {
    return { status: 400, code: "BAD_REQUEST", message: error.message };
  }

  if (
    error.message.toLowerCase().includes("creator not found") ||
    error.message.toLowerCase().includes("tracking")
  ) {
    return { status: 404, code: "NOT_FOUND", message: error.message };
  }

  return { status: 500, code: "INTERNAL", message: "Unable to record upload" };
}

function parsePayload(body: unknown): UploadVideoPayload {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid payload");
  }

  const input = body as Record<string, unknown>;
  const monthlyTrackingId =
    typeof input.monthlyTrackingId === "string" ? input.monthlyTrackingId.trim() : "";
  const videoType = typeof input.videoType === "string" ? input.videoType.trim().toUpperCase() : "";
  const fileUrl = typeof input.fileUrl === "string" ? input.fileUrl.trim() : "";
  const durationSecondsRaw =
    typeof input.durationSeconds === "number"
      ? input.durationSeconds
      : Number(input.durationSeconds);
  const fileSizeMbRaw =
    typeof input.fileSizeMb === "number" ? input.fileSizeMb : Number(input.fileSizeMb);
  const resolution = typeof input.resolution === "string" ? input.resolution.trim() : "";

  if (!monthlyTrackingId || !isUuid(monthlyTrackingId)) {
    throw new Error("Invalid monthlyTrackingId");
  }
  if (!VIDEO_TYPES.includes(videoType as VideoAsset["videoType"])) {
    throw new Error("Invalid videoType");
  }
  if (!fileUrl || fileUrl.length > 1024 || fileUrl.startsWith("/") || fileUrl.includes("..")) {
    throw new Error("Invalid fileUrl");
  }

  const durationSeconds = Math.floor(durationSecondsRaw);
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || durationSeconds > 600) {
    throw new Error("Invalid durationSeconds");
  }

  const fileSizeMb = Math.floor(fileSizeMbRaw);
  if (!Number.isFinite(fileSizeMb) || fileSizeMb <= 0 || fileSizeMb > 2048) {
    throw new Error("Invalid fileSizeMb");
  }

  if (resolution !== "1080x1920" && resolution !== "1080x1080") {
    throw new Error("Invalid resolution");
  }

  return {
    monthlyTrackingId,
    videoType: videoType as VideoAsset["videoType"],
    fileUrl,
    durationSeconds,
    resolution: resolution as VideoAsset["resolution"],
    fileSizeMb
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
    key: "creator:uploads:video",
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

  let payload: UploadVideoPayload;
  try {
    payload = parsePayload(await readJsonBodyWithLimit(request, { maxBytes: 16 * 1024 }));
  } catch (error) {
    const response = handleBodyParseError(ctx, error);
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }

  if (!payload.fileUrl.startsWith(`${auth.session.userId}/`)) {
    const response = apiError(ctx, {
      status: 400,
      code: "BAD_REQUEST",
      message: "Invalid fileUrl prefix"
    });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }

  // C-01: Verify the file actually exists in storage before creating a DB record.
  // Without this check a creator can skip the upload and register a phantom video.
  {
    const supabase = createSupabaseServerClient();
    const { error: storageError } = await supabase.storage
      .from("videos")
      .createSignedUrl(payload.fileUrl, 10);
    if (storageError) {
      const response = apiError(ctx, {
        status: 400,
        code: "BAD_REQUEST",
        message: "Uploaded file not found"
      });
      if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
      return response;
    }
  }

  try {
    const video = await recordVideoUpload({
      userId: auth.session.userId,
      monthlyTrackingId: payload.monthlyTrackingId,
      videoType: payload.videoType,
      fileUrl: payload.fileUrl,
      durationSeconds: payload.durationSeconds,
      resolution: payload.resolution,
      fileSizeMb: payload.fileSizeMb
    });

    const response = apiJson(ctx, video, { status: 201 });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  } catch (error) {
    // Best-effort cleanup: if DB insert fails, remove the previously uploaded object.
    try {
      const supabase = createSupabaseServerClient();
      await supabase.storage.from("videos").remove([payload.fileUrl]);
    } catch {
      // ignore
    }

    const uploadError = resolveRecordUploadError(error);
    const response = apiError(ctx, {
      status: uploadError.status,
      code: uploadError.code,
      message: uploadError.message
    });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }
}
