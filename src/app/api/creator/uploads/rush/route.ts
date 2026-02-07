import { recordRushUpload } from "@/application/use-cases/record-rush-upload";
import { requireApiRole } from "@/features/auth/server/api-guards";
import { setAuthCookies } from "@/features/auth/server/auth-cookies";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server-client";
import { apiError, apiJson, createApiContext } from "@/lib/api-response";
import { isAllowedOrigin } from "@/lib/origin";
import { rateLimit } from "@/lib/rate-limit";
import { readJsonBodyWithLimit } from "@/lib/request-body";
import { isUuid } from "@/lib/validation";

interface UploadRushPayload {
  monthlyTrackingId: string;
  fileUrl: string;
  fileName: string;
  fileSizeMb: number;
}

function sanitizeFilename(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "rush.mp4";
  }
  return trimmed.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

function parsePayload(body: unknown): UploadRushPayload {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid payload");
  }

  const input = body as Record<string, unknown>;
  const monthlyTrackingId =
    typeof input.monthlyTrackingId === "string" ? input.monthlyTrackingId.trim() : "";
  const fileUrl = typeof input.fileUrl === "string" ? input.fileUrl.trim() : "";
  const fileNameRaw = typeof input.fileName === "string" ? input.fileName : "";
  const fileSizeMbRaw =
    typeof input.fileSizeMb === "number" ? input.fileSizeMb : Number(input.fileSizeMb);

  if (!monthlyTrackingId || !isUuid(monthlyTrackingId)) {
    throw new Error("Invalid monthlyTrackingId");
  }
  if (!fileUrl || fileUrl.length > 1024 || fileUrl.startsWith("/") || fileUrl.includes("..")) {
    throw new Error("Invalid fileUrl");
  }

  const fileSizeMb = Math.floor(fileSizeMbRaw);
  if (!Number.isFinite(fileSizeMb) || fileSizeMb <= 0 || fileSizeMb > 8000) {
    throw new Error("Invalid fileSizeMb");
  }

  return {
    monthlyTrackingId,
    fileUrl,
    fileName: sanitizeFilename(fileNameRaw),
    fileSizeMb
  };
}

export async function POST(request: Request) {
  const ctx = createApiContext(request);
  if (!isAllowedOrigin(request)) {
    return apiError(ctx, { status: 403, code: "INVALID_ORIGIN", message: "Invalid origin" });
  }

  const limited = rateLimit({ ctx, request, key: "creator:uploads:rush", limit: 40, windowMs: 60_000 });
  if (limited) {
    return limited;
  }

  const auth = await requireApiRole(request, "affiliate", { ctx });
  if (!auth.ok) {
    return auth.response;
  }

  let payload: UploadRushPayload;
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
    const rush = await recordRushUpload({
      userId: auth.session.userId,
      monthlyTrackingId: payload.monthlyTrackingId,
      fileName: payload.fileName,
      fileUrl: payload.fileUrl,
      fileSizeMb: payload.fileSizeMb
    });

    const response = apiJson(ctx, rush, { status: 201 });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  } catch {
    // Best-effort cleanup: if DB insert fails, remove the previously uploaded object.
    try {
      const supabase = createSupabaseServerClient();
      await supabase.storage.from("rushes").remove([payload.fileUrl]);
    } catch {
      // ignore
    }

    const response = apiError(ctx, { status: 500, code: "INTERNAL", message: "Unable to record rush upload" });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }
}

