import { clearAuthCookies, readCookieFromHeader, ACCESS_TOKEN_COOKIE_NAME } from "@/features/auth/server/auth-cookies";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/infrastructure/supabase/server-client";
import { apiError, apiJson, createApiContext } from "@/lib/api-response";
import { isAllowedOrigin } from "@/lib/origin";

export async function POST(request: Request) {
  const ctx = createApiContext(request);
  if (!isAllowedOrigin(request)) {
    return apiError(ctx, { status: 403, code: "INVALID_ORIGIN", message: "Invalid origin" });
  }

  // Revoke the server-side session so the token cannot be reused.
  if (isSupabaseConfigured()) {
    const token = readCookieFromHeader(request.headers.get("cookie"), ACCESS_TOKEN_COOKIE_NAME);
    if (token) {
      try {
        const client = createSupabaseServerClient();
        const { data } = await client.auth.getUser(token);
        if (data.user) {
          await client.auth.admin.signOut(data.user.id);
        }
      } catch {
        // Best-effort: if revocation fails, cookies are still cleared below.
      }
    }
  }

  const response = apiJson(ctx, { ok: true }, { status: 200 });
  clearAuthCookies(response);
  return response;
}
