import { parsePayload } from "@/app/api/applications/_lib";
import { requireApiRole } from "@/features/auth/server/api-guards";
import { setAuthCookies } from "@/features/auth/server/auth-cookies";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server-client";
import { apiError, apiJson, createApiContext } from "@/lib/api-response";
import { isAllowedOrigin } from "@/lib/origin";
import { readJsonBodyWithLimit } from "@/lib/request-body";

export async function GET(request: Request) {
  const ctx = createApiContext(request);
  const auth = await requireApiRole(request, "affiliate", { ctx });
  if (!auth.ok) {
    return auth.response;
  }

  const client = createSupabaseServerClient();
  const { data, error } = await client
    .from("creator_applications")
    .select("*")
    .eq("user_id", auth.session.userId)
    .maybeSingle();

  if (error) {
    const response = apiError(ctx, { status: 500, code: "INTERNAL", message: "Unable to load application" });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }

  const response = apiJson(ctx, { application: data ?? null }, { status: 200 });
  if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
  return response;
}

export async function POST(request: Request) {
  const ctx = createApiContext(request);
  if (!isAllowedOrigin(request)) {
    return apiError(ctx, { status: 403, code: "INVALID_ORIGIN", message: "Invalid origin" });
  }

  const auth = await requireApiRole(request, "affiliate", { ctx });
  if (!auth.ok) {
    return auth.response;
  }

  const userId = auth.session.userId;
  const authEmail = auth.session.email;
  const client = createSupabaseServerClient();

  let payload;
  try {
    payload = parsePayload(await readJsonBodyWithLimit(request, { maxBytes: 64 * 1024 }), { authEmail });
  } catch (error) {
    const status = error instanceof Error && error.message === "PAYLOAD_TOO_LARGE" ? 413 : 400;
    const code = error instanceof Error && error.message === "PAYLOAD_TOO_LARGE" ? "PAYLOAD_TOO_LARGE" : "BAD_REQUEST";
    const message =
      error instanceof Error && error.message === "PAYLOAD_TOO_LARGE"
        ? "Payload trop volumineux."
        : error instanceof Error && error.message === "INVALID_JSON"
          ? "Payload invalide."
          : error instanceof Error
            ? error.message
            : "Invalid payload";

    const response = apiError(ctx, { status, code, message });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }

  const nowIso = new Date().toISOString();

  const row = {
    user_id: userId,
    handle: payload.handle,
    full_name: payload.fullName,
    email: payload.email,
    whatsapp: payload.whatsapp,
    country: payload.country,
    address: payload.address,
    social_tiktok: payload.socialTiktok ?? null,
    social_instagram: payload.socialInstagram ?? null,
    followers: payload.followers,
    portfolio_url: null,
    package_tier: payload.packageTier,
    mix_name: payload.mixName,
    status: payload.submit ? "pending_review" : "draft",
    submitted_at: payload.submit ? nowIso : null
  };

  const { data, error } = await client
    .from("creator_applications")
    .upsert(row, { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) {
    const response = apiError(ctx, { status: 500, code: "INTERNAL", message: "Unable to save application" });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }

  const response = apiJson(ctx, { application: data }, { status: 200 });
  if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
  return response;
}
