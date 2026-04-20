import { recordRevisionUpload } from "@/application/use-cases/record-revision-upload";
import { getRepository } from "@/application/dependencies";
import type { VideoAsset } from "@/domain/types";
import { sendNewUploadAdminEmail } from "@/infrastructure/email/send-emails";
import { requireApiRole } from "@/features/auth/server/api-guards";
import { setAuthCookies } from "@/features/auth/server/auth-cookies";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server-client";
import { apiError, apiJson, createApiContext, handleBodyParseError } from "@/lib/api-response";
import { isAllowedOrigin } from "@/lib/origin";
import { rateLimit } from "@/lib/rate-limit";
import { readJsonBodyWithLimit } from "@/lib/request-body";
import { isUuid } from "@/lib/validation";

interface RevisionUploadPayload {
  originalVideoId: string;
  fileUrl: string;
  durationSeconds: number;
  resolution: VideoAsset["resolution"];
  fileSizeMb: number;
}

function parsePayload(body: unknown): RevisionUploadPayload {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid payload");
  }

  const input = body as Record<string, unknown>;

  const originalVideoId =
    typeof input.originalVideoId === "string" ? input.originalVideoId.trim() : "";
  const fileUrl = typeof input.fileUrl === "string" ? input.fileUrl.trim() : "";
  const durationSecondsRaw =
    typeof input.durationSeconds === "number"
      ? input.durationSeconds
      : Number(input.durationSeconds);
  const fileSizeMbRaw =
    typeof input.fileSizeMb === "number" ? input.fileSizeMb : Number(input.fileSizeMb);
  const resolution = typeof input.resolution === "string" ? input.resolution.trim() : "";

  if (!originalVideoId || !isUuid(originalVideoId)) {
    throw new Error("Invalid originalVideoId");
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
    originalVideoId,
    fileUrl,
    durationSeconds,
    resolution: resolution as VideoAsset["resolution"],
    fileSizeMb
  };
}

function resolveRevisionUploadError(error: unknown): {
  status: number;
  code: "BAD_REQUEST" | "NOT_FOUND" | "FORBIDDEN" | "INTERNAL";
  message: string;
} {
  if (!(error instanceof Error)) {
    return { status: 500, code: "INTERNAL", message: "Unable to record revision upload" };
  }

  const msg = error.message.toLowerCase();

  if (msg.includes("access denied")) {
    return { status: 403, code: "FORBIDDEN", message: "Access denied" };
  }
  if (msg.includes("video not found")) {
    return { status: 404, code: "NOT_FOUND", message: "Video not found" };
  }
  if (
    msg.includes("not awaiting revision") ||
    msg.includes("already been submitted") ||
    msg.startsWith("invalid") ||
    msg.includes("video type is disabled") ||
    msg.includes("contract not signed") ||
    msg.includes("not active")
  ) {
    return { status: 400, code: "BAD_REQUEST", message: error.message };
  }
  if (msg.includes("creator not found")) {
    return { status: 404, code: "NOT_FOUND", message: "Creator not found" };
  }

  return { status: 500, code: "INTERNAL", message: "Unable to record revision upload" };
}

export async function POST(request: Request) {
  const ctx = createApiContext(request);
  if (!isAllowedOrigin(request)) {
    return apiError(ctx, { status: 403, code: "INVALID_ORIGIN", message: "Invalid origin" });
  }

  const limited = await rateLimit({
    ctx,
    request,
    key: "creator:uploads:video:revision",
    limit: 20,
    windowMs: 60_000
  });
  if (limited) {
    return limited;
  }

  const auth = await requireApiRole(request, "affiliate", { ctx });
  if (!auth.ok) {
    return auth.response;
  }

  let payload: RevisionUploadPayload;
  try {
    payload = parsePayload(await readJsonBodyWithLimit(request, { maxBytes: 16 * 1024 }));
  } catch (error) {
    const response = handleBodyParseError(ctx, error);
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }

  // Storage ownership check: the file path must be prefixed with the authed user's id.
  if (!payload.fileUrl.startsWith(`${auth.session.userId}/`)) {
    const response = apiError(ctx, {
      status: 400,
      code: "BAD_REQUEST",
      message: "Invalid fileUrl prefix"
    });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }

  // Verify the file actually exists in storage before creating a DB record (C-01).
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
    const result = await recordRevisionUpload({
      userId: auth.session.userId,
      originalVideoId: payload.originalVideoId,
      fileUrl: payload.fileUrl,
      durationSeconds: payload.durationSeconds,
      resolution: payload.resolution,
      fileSizeMb: payload.fileSizeMb
    });

    // Fire-and-forget admin notification for revision submissions
    getRepository()
      .getCreatorByUserId(auth.session.userId)
      .then((creator) =>
        sendNewUploadAdminEmail({
          creatorHandle: creator?.handle ?? result.newVideo.creatorId,
          creatorId: result.newVideo.creatorId,
          videoType: result.newVideo.videoType,
          isRevision: true
        })
      )
      .catch(console.error);

    const response = apiJson(ctx, result, { status: 201 });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  } catch (error) {
    // Best-effort cleanup: if use-case fails, remove the previously uploaded file.
    try {
      const supabase = createSupabaseServerClient();
      await supabase.storage.from("videos").remove([payload.fileUrl]);
    } catch {
      // ignore
    }

    const uploadError = resolveRevisionUploadError(error);
    const response = apiError(ctx, {
      status: uploadError.status,
      code: uploadError.code,
      message: uploadError.message
    });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }
}
