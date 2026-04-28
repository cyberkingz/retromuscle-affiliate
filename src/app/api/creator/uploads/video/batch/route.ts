import { requireApiRole } from "@/features/auth/server/api-guards";
import { setAuthCookies } from "@/features/auth/server/auth-cookies";
import { recordBatchSubmission } from "@/application/use-cases/record-batch-submission";
import { getRepository } from "@/application/dependencies";
import { sendNewUploadAdminEmail } from "@/infrastructure/email/send-emails";
import { BATCH_MIN_CLIPS, BATCH_SUPPORTED_TYPES } from "@/domain/constants/batch-rules";
import { VIDEO_TYPES, type VideoAsset } from "@/domain/types";
import { apiError, apiJson, createApiContext, handleBodyParseError } from "@/lib/api-response";
import { isAllowedOrigin } from "@/lib/origin";
import { rateLimit } from "@/lib/rate-limit";
import { readJsonBodyWithLimit } from "@/lib/request-body";
import { isUuid } from "@/lib/validation";

const MAX_CLIPS = 20;

interface BatchUploadPayload {
  monthlyTrackingId: string;
  videoType: VideoAsset["videoType"];
  clipKeys: string[];
  clipSizesMb: number[];
  clipDurations: number[];
  clipResolutions: string[];
}

function parsePayload(body: unknown): BatchUploadPayload {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid payload");
  }

  const input = body as Record<string, unknown>;

  const monthlyTrackingId =
    typeof input.monthlyTrackingId === "string" ? input.monthlyTrackingId.trim() : "";
  if (!monthlyTrackingId || !isUuid(monthlyTrackingId)) {
    throw new Error("Invalid monthlyTrackingId");
  }

  const videoTypeRaw =
    typeof input.videoType === "string" ? input.videoType.trim().toUpperCase() : "";
  if (!VIDEO_TYPES.includes(videoTypeRaw as VideoAsset["videoType"])) {
    throw new Error("Invalid videoType");
  }
  const videoType = videoTypeRaw as VideoAsset["videoType"];

  if (!BATCH_SUPPORTED_TYPES.includes(videoType)) {
    throw new Error(`Batch upload not supported for type: ${videoType}`);
  }

  if (!Array.isArray(input.clipKeys) || input.clipKeys.length === 0) {
    throw new Error("clipKeys must be a non-empty array");
  }
  if (input.clipKeys.length > MAX_CLIPS) {
    throw new Error(`Maximum ${MAX_CLIPS} clips per batch`);
  }

  const minClips = BATCH_MIN_CLIPS[videoType] ?? 4;
  if (input.clipKeys.length < minClips) {
    throw new Error(`Minimum ${minClips} clips required for ${videoType}`);
  }

  const clipKeys: string[] = [];
  for (const key of input.clipKeys) {
    if (typeof key !== "string" || !key.trim()) {
      throw new Error("Each clipKey must be a non-empty string");
    }
    if (key.includes("..")) {
      throw new Error("Invalid clipKey: path traversal detected");
    }
    clipKeys.push(key.trim());
  }

  const clipSizesMb: number[] = [];
  if (!Array.isArray(input.clipSizesMb) || input.clipSizesMb.length !== clipKeys.length) {
    throw new Error("clipSizesMb must be an array of the same length as clipKeys");
  }
  for (const size of input.clipSizesMb) {
    const parsed = typeof size === "number" ? size : Number(size);
    if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 2048) {
      throw new Error("Each clipSizeMb must be between 1 and 2048");
    }
    clipSizesMb.push(Math.ceil(parsed));
  }

  // clipDurations — optional, falls back to 1 per clip
  const clipDurations: number[] = [];
  if (Array.isArray(input.clipDurations) && input.clipDurations.length === clipKeys.length) {
    for (const d of input.clipDurations) {
      const parsed = typeof d === "number" ? d : Number(d);
      clipDurations.push(Number.isFinite(parsed) && parsed > 0 && parsed <= 3600 ? Math.round(parsed) : 1);
    }
  } else {
    clipKeys.forEach(() => clipDurations.push(1));
  }

  // clipResolutions — optional, falls back to "1080x1920" per clip
  const clipResolutions: string[] = [];
  if (Array.isArray(input.clipResolutions) && input.clipResolutions.length === clipKeys.length) {
    for (const r of input.clipResolutions) {
      const str = typeof r === "string" ? r.trim() : "";
      clipResolutions.push(/^\d+x\d+$/.test(str) ? str : "1080x1920");
    }
  } else {
    clipKeys.forEach(() => clipResolutions.push("1080x1920"));
  }

  return { monthlyTrackingId, videoType, clipKeys, clipSizesMb, clipDurations, clipResolutions };
}

export async function POST(request: Request) {
  const ctx = createApiContext(request);

  if (!isAllowedOrigin(request)) {
    return apiError(ctx, { status: 403, code: "INVALID_ORIGIN", message: "Invalid origin" });
  }

  const limited = await rateLimit({
    ctx,
    request,
    key: "creator:uploads:video:batch",
    limit: 20,
    windowMs: 60_000
  });
  if (limited) return limited;

  const auth = await requireApiRole(request, "affiliate", { ctx });
  if (!auth.ok) return auth.response;

  let payload: BatchUploadPayload;
  try {
    payload = parsePayload(await readJsonBodyWithLimit(request, { maxBytes: 32 * 1024 }));
  } catch (error) {
    const response = handleBodyParseError(ctx, error);
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }

  // Ownership check: every clip key must be scoped to the authenticated user
  for (const key of payload.clipKeys) {
    if (!key.startsWith(`${auth.session.userId}/`)) {
      const response = apiError(ctx, {
        status: 400,
        code: "BAD_REQUEST",
        message: "Invalid clip key: ownership mismatch"
      });
      if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
      return response;
    }
  }

  try {
    const batch = await recordBatchSubmission({
      userId: auth.session.userId,
      monthlyTrackingId: payload.monthlyTrackingId,
      videoType: payload.videoType,
      clipKeys: payload.clipKeys,
      clipSizesMb: payload.clipSizesMb,
      clipDurations: payload.clipDurations,
      clipResolutions: payload.clipResolutions
    });

    // Fire-and-forget admin notification
    getRepository()
      .getCreatorByUserId(auth.session.userId)
      .then((creator) =>
        sendNewUploadAdminEmail({
          creatorHandle: creator?.handle ?? batch.creatorId,
          creatorId: batch.creatorId,
          videoType: batch.videoType
        })
      )
      .catch(console.error);

    const response = apiJson(ctx, batch, { status: 201 });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    const isForbidden =
      msg.toLowerCase().includes("contract") ||
      msg.toLowerCase().includes("not active") ||
      msg.toLowerCase().includes("disabled");
    const isNotFound =
      msg.toLowerCase().includes("not found") || msg.toLowerCase().includes("tracking");
    const isBadRequest = msg.toLowerCase().includes("minimum") || msg.toLowerCase().includes("invalid");

    const status = isForbidden ? 403 : isNotFound ? 404 : isBadRequest ? 400 : 500;
    const code = isForbidden
      ? ("FORBIDDEN" as const)
      : isNotFound
        ? ("NOT_FOUND" as const)
        : isBadRequest
          ? ("BAD_REQUEST" as const)
          : ("INTERNAL" as const);

    const response = apiError(ctx, { status, code, message: msg || "Unable to record batch upload" });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }
}
