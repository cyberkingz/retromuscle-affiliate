import { NextResponse } from "next/server";

import { recordVideoUpload } from "@/application/use-cases/record-video-upload";
import { VIDEO_TYPES, type VideoAsset } from "@/domain/types";
import { readBearerToken, resolveAuthSessionFromAccessToken } from "@/features/auth/server/resolve-auth-session";
import { isSafeEntityId } from "@/lib/validation";

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

  if (!monthlyTrackingId || !isSafeEntityId(monthlyTrackingId)) {
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
  const token = readBearerToken(request.headers.get("authorization"));
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let session: Awaited<ReturnType<typeof resolveAuthSessionFromAccessToken>>;
  try {
    session = await resolveAuthSessionFromAccessToken(token);
  } catch {
    return NextResponse.json({ message: "Unable to resolve auth session" }, { status: 500 });
  }

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "affiliate") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  let payload: UploadVideoPayload;
  try {
    payload = parsePayload(await request.json());
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Invalid payload" },
      { status: 400 }
    );
  }

  if (!payload.fileUrl.startsWith(`${session.userId}/`)) {
    return NextResponse.json({ message: "Invalid fileUrl prefix" }, { status: 400 });
  }

  try {
    const video = await recordVideoUpload({
      userId: session.userId,
      monthlyTrackingId: payload.monthlyTrackingId,
      videoType: payload.videoType,
      fileUrl: payload.fileUrl,
      durationSeconds: payload.durationSeconds,
      resolution: payload.resolution,
      fileSizeMb: payload.fileSizeMb
    });

    return NextResponse.json(video, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to record upload" },
      { status: 500 }
    );
  }
}

