import { NextResponse } from "next/server";

import { recordVideoUpload } from "@/application/use-cases/record-video-upload";
import { VIDEO_TYPES, type VideoAsset } from "@/domain/types";
import { requireApiRole } from "@/features/auth/server/api-guards";
import { setAuthCookies } from "@/features/auth/server/auth-cookies";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server-client";
import { apiError, apiJson, createApiContext } from "@/lib/api-response";
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

function parsePayload(body: unknown): UploadVideoPayload {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid payload");
  }

  const input = body as Record<string, unknown>;
  const monthlyTrackingId = typeof input.monthlyTrackingId === "string" ? input.monthlyTrackingId.trim() : "";
  const videoType = typeof input.videoType === "string" ? input.videoType.trim().toUpperCase() : "";
  const fileUrl = typeof input.fileUrl === "string" ? input.fileUrl.trim() : "";
  const durationSecondsRaw = typeof input.durationSeconds === "number" ? input.durationSeconds : Number(input.durationSeconds);
  const fileSizeMbRaw = typeof input.fileSizeMb === "number" ? input.fileSizeMb : Number(input.fileSizeMb);
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
  if (!Number.isFinite(fileSizeMb) || fileSizeMb <= 0 || fileSizeMb > 600) {
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

  const limited = rateLimit({ ctx, request, key: "creator:uploads:video", limit: 40, windowMs: 60_000 });
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

  if (!payload.fileUrl.startsWith(`${auth.session.userId}/`)) {
    const response = apiError(ctx, { status: 400, code: "BAD_REQUEST", message: "Invalid fileUrl prefix" });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
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

    const response = apiError(ctx, { status: 500, code: "INTERNAL", message: "Unable to record upload" });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }
}
