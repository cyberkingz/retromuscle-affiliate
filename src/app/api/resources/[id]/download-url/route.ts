import { getResourceDownloadUrl } from "@/application/use-cases/get-resource-download-url";
import { requireApiSession } from "@/features/auth/server/api-guards";
import { setAuthCookies } from "@/features/auth/server/auth-cookies";
import { apiError, apiJson, createApiContext } from "@/lib/api-response";
import { rateLimit } from "@/lib/rate-limit";

/** GET /api/resources/[id]/download-url — get a 60s signed download URL */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = createApiContext(request);

  const limited = await rateLimit({
    ctx,
    request,
    key: "resources:download-url",
    limit: 30,
    windowMs: 60_000
  });
  if (limited) return limited;

  const auth = await requireApiSession(request, { ctx });
  if (!auth.ok) return auth.response;

  // Active-creator check for affiliates
  if (auth.session.role === "affiliate" && auth.session.target !== "/dashboard") {
    const response = apiError(ctx, {
      status: 403,
      code: "FORBIDDEN",
      message: "Accès réservé aux créateurs actifs."
    });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }

  const { id } = await params;

  try {
    const result = await getResourceDownloadUrl({
      id,
      isAdmin: auth.session.role === "admin"
    });

    const response = apiJson(ctx, result, {
      headers: { "Cache-Control": "private, no-cache, no-store" }
    });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      const response = apiError(ctx, { status: 404, code: "NOT_FOUND", message: "Resource not found" });
      if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
      return response;
    }
    const response = apiError(ctx, { status: 500, code: "INTERNAL", message: "Unable to generate download URL" });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }
}
