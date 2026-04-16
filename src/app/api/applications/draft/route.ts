import type { Json } from "@/infrastructure/supabase/database.types";
import { requireApiRole } from "@/features/auth/server/api-guards";
import { setAuthCookies } from "@/features/auth/server/auth-cookies";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server-client";
import { apiError, apiJson, createApiContext, handleBodyParseError } from "@/lib/api-response";
import { isAllowedOrigin } from "@/lib/origin";
import { rateLimit } from "@/lib/rate-limit";
import { readJsonBodyWithLimit } from "@/lib/request-body";

export async function GET(request: Request) {
  const ctx = createApiContext(request);
  const auth = await requireApiRole(request, "affiliate", { ctx });
  if (!auth.ok) {
    return auth.response;
  }

  const client = createSupabaseServerClient();
  const { data, error } = await client
    .from("onboarding_drafts")
    .select("form_data, step")
    .eq("user_id", auth.session.userId)
    .maybeSingle();

  if (error) {
    const response = apiError(ctx, {
      status: 500,
      code: "INTERNAL",
      message: "Unable to load draft"
    });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }

  const response = apiJson(ctx, { draft: data ?? null }, { status: 200 });
  if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
  return response;
}

export async function PUT(request: Request) {
  const ctx = createApiContext(request);
  if (!isAllowedOrigin(request)) {
    return apiError(ctx, { status: 403, code: "INVALID_ORIGIN", message: "Invalid origin" });
  }

  const limited = await rateLimit({ ctx, request, key: "applications:draft", limit: 30, windowMs: 60_000 });
  if (limited) return limited;

  const auth = await requireApiRole(request, "affiliate", { ctx });
  if (!auth.ok) {
    return auth.response;
  }

  let body: unknown;
  try {
    body = await readJsonBodyWithLimit(request, { maxBytes: 16 * 1024 });
  } catch (error) {
    const response = handleBodyParseError(ctx, error);
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }

  // H-10: Validate body structure before casting.
  const parsed = (body && typeof body === "object" && !Array.isArray(body) ? body : {}) as Record<string, unknown>;
  const step =
    typeof parsed.step === "number" && Number.isInteger(parsed.step) && parsed.step >= 0 && parsed.step <= 1
      ? parsed.step
      : 0;

  // Reject arrays (typeof [] === "object") and non-objects.
  // Strip prototype-polluting keys before storing.
  let formData: Record<string, unknown> = {};
  if (parsed.formData && typeof parsed.formData === "object" && !Array.isArray(parsed.formData)) {
    const raw = parsed.formData as Record<string, unknown>;
    const BLOCKED_KEYS = new Set(["__proto__", "constructor", "prototype"]);
    for (const [k, v] of Object.entries(raw)) {
      if (!BLOCKED_KEYS.has(k)) {
        formData[k] = v;
      }
    }
  }

  const client = createSupabaseServerClient();
  const { error } = await client.from("onboarding_drafts").upsert(
    {
      user_id: auth.session.userId,
      form_data: formData as unknown as Json,
      step
    },
    { onConflict: "user_id" }
  );

  if (error) {
    const response = apiError(ctx, {
      status: 500,
      code: "INTERNAL",
      message: "Unable to save draft"
    });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }

  const response = apiJson(ctx, { ok: true }, { status: 200 });
  if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
  return response;
}

export async function DELETE(request: Request) {
  const ctx = createApiContext(request);
  if (!isAllowedOrigin(request)) {
    return apiError(ctx, { status: 403, code: "INVALID_ORIGIN", message: "Invalid origin" });
  }

  const limited = await rateLimit({ ctx, request, key: "applications:draft", limit: 30, windowMs: 60_000 });
  if (limited) return limited;

  const auth = await requireApiRole(request, "affiliate", { ctx });
  if (!auth.ok) {
    return auth.response;
  }

  const client = createSupabaseServerClient();
  const { error } = await client
    .from("onboarding_drafts")
    .delete()
    .eq("user_id", auth.session.userId);

  if (error) {
    const response = apiError(ctx, {
      status: 500,
      code: "INTERNAL",
      message: "Unable to delete draft"
    });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }

  const response = apiJson(ctx, { ok: true }, { status: 200 });
  if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
  return response;
}
