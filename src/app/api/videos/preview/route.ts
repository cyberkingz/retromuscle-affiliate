import { requireApiSession } from "@/features/auth/server/api-guards";
import { setAuthCookies } from "@/features/auth/server/auth-cookies";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server-client";
import { apiError, apiJson, createApiContext } from "@/lib/api-response";
import { rateLimit } from "@/lib/rate-limit";

function parseFileUrlParam(value: string | null): string {
  const fileUrl = (value ?? "").trim();
  if (!fileUrl || fileUrl.length > 1024 || fileUrl.startsWith("/") || fileUrl.includes("..")) {
    throw new Error("Invalid fileUrl");
  }
  return fileUrl;
}

export async function GET(request: Request) {
  const ctx = createApiContext(request);
  const limited = rateLimit({ ctx, request, key: "videos:preview", limit: 240, windowMs: 60_000 });
  if (limited) {
    return limited;
  }

  const auth = await requireApiSession(request, { ctx });
  if (!auth.ok) {
    return auth.response;
  }

  let fileUrl: string;
  try {
    const { searchParams } = new URL(request.url);
    fileUrl = parseFileUrlParam(searchParams.get("fileUrl"));
  } catch (error) {
    const response = apiError(ctx, {
      status: 400,
      code: "BAD_REQUEST",
      message: error instanceof Error ? error.message : "Invalid query params"
    });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }

  if (auth.session.role !== "admin" && !fileUrl.startsWith(`${auth.session.userId}/`)) {
    const response = apiError(ctx, { status: 403, code: "FORBIDDEN", message: "Forbidden" });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.storage.from("videos").createSignedUrl(fileUrl, 300);

  if (error || !data?.signedUrl) {
    const response = apiError(ctx, { status: 500, code: "INTERNAL", message: "Unable to generate preview URL" });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }

  const response = apiJson(ctx, { signedUrl: data.signedUrl }, { status: 200 });
  if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
  return response;
}
