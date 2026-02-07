import { requireApiSession } from "@/features/auth/server/api-guards";
import { setAuthCookies } from "@/features/auth/server/auth-cookies";
import { apiJson, createApiContext } from "@/lib/api-response";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const ctx = createApiContext(request);
  const limited = rateLimit({ ctx, request, key: "auth:redirect-target", limit: 120, windowMs: 60_000 });
  if (limited) {
    return limited;
  }

  const auth = await requireApiSession(request, { ctx });
  if (!auth.ok) {
    return auth.response;
  }

  const response = apiJson(ctx, { role: auth.session.role, target: auth.session.target }, { status: 200 });
  if (auth.setAuthCookies) {
    setAuthCookies(response, auth.setAuthCookies);
  }
  return response;
}
