import { clearAuthCookies, setAuthCookies } from "@/features/auth/server/auth-cookies";
import { requireApiSession } from "@/features/auth/server/api-guards";
import {
  createSupabaseServerClient,
  isSupabaseConfigured
} from "@/infrastructure/supabase/server-client";
import { apiError, apiJson, createApiContext } from "@/lib/api-response";
import { isAllowedOrigin } from "@/lib/origin";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ctx = createApiContext(request);
  if (!isAllowedOrigin(request)) {
    return apiError(ctx, { status: 403, code: "INVALID_ORIGIN", message: "Invalid origin" });
  }

  const limited = await rateLimit({ ctx, request, key: "auth:sign-out", limit: 10, windowMs: 60_000 });
  if (limited) return limited;

  // H-05: Require a valid session before revoking — prevents unauthenticated CSRF logout.
  const auth = await requireApiSession(request, { ctx });
  if (!auth.ok) return auth.response;

  // Revoke the server-side session so the token cannot be reused.
  if (isSupabaseConfigured()) {
    try {
      const client = createSupabaseServerClient();
      await client.auth.admin.signOut(auth.session.userId);
    } catch {
      // Best-effort: if revocation fails, cookies are still cleared below.
    }
  }

  const response = apiJson(ctx, { ok: true }, { status: 200 });
  clearAuthCookies(response);
  if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
  return response;
}
