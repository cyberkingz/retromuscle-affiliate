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
    .from("onboarding_drafts")
    .select("form_data, step")
    .eq("user_id", auth.session.userId)
    .maybeSingle();

  if (error) {
    const response = apiError(ctx, { status: 500, code: "INTERNAL", message: "Unable to load draft" });
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

  const auth = await requireApiRole(request, "affiliate", { ctx });
  if (!auth.ok) {
    return auth.response;
  }

  let body: { formData: unknown; step: unknown };
  try {
    body = await readJsonBodyWithLimit(request, { maxBytes: 16 * 1024 });
  } catch {
    const response = apiError(ctx, { status: 400, code: "BAD_REQUEST", message: "Invalid payload" });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }

  const step = typeof body.step === "number" && body.step >= 0 && body.step <= 2 ? body.step : 0;
  const formData = body.formData && typeof body.formData === "object" ? body.formData : {};

  const client = createSupabaseServerClient();
  const { error } = await client
    .from("onboarding_drafts")
    .upsert(
      {
        user_id: auth.session.userId,
        form_data: formData,
        step
      },
      { onConflict: "user_id" }
    );

  if (error) {
    const response = apiError(ctx, { status: 500, code: "INTERNAL", message: "Unable to save draft" });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }

  const response = apiJson(ctx, { ok: true }, { status: 200 });
  if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
  return response;
}

export async function DELETE(request: Request) {
  const ctx = createApiContext(request);
  const auth = await requireApiRole(request, "affiliate", { ctx });
  if (!auth.ok) {
    return auth.response;
  }

  const client = createSupabaseServerClient();
  await client
    .from("onboarding_drafts")
    .delete()
    .eq("user_id", auth.session.userId);

  const response = apiJson(ctx, { ok: true }, { status: 200 });
  if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
  return response;
}
