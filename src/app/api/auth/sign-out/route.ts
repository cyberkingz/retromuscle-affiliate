import { clearAuthCookies } from "@/features/auth/server/auth-cookies";
import { apiError, apiJson, createApiContext } from "@/lib/api-response";
import { isAllowedOrigin } from "@/lib/origin";

export async function POST(request: Request) {
  const ctx = createApiContext(request);
  if (!isAllowedOrigin(request)) {
    return apiError(ctx, { status: 403, code: "INVALID_ORIGIN", message: "Invalid origin" });
  }

  const response = apiJson(ctx, { ok: true }, { status: 200 });
  clearAuthCookies(response);
  return response;
}
