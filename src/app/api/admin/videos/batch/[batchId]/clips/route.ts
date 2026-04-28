import { getRepository } from "@/application/dependencies";
import { requireApiRole } from "@/features/auth/server/api-guards";
import { setAuthCookies } from "@/features/auth/server/auth-cookies";
import { apiError, apiJson, createApiContext } from "@/lib/api-response";
import { rateLimit } from "@/lib/rate-limit";
import { isUuid } from "@/lib/validation";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ batchId: string }> }
) {
  const ctx = createApiContext(request);

  const limited = await rateLimit({ ctx, request, key: "admin:videos:batch:clips", limit: 120, windowMs: 60_000 });
  if (limited) return limited;

  const auth = await requireApiRole(request, "admin", { ctx });
  if (!auth.ok) return auth.response;

  const { batchId } = await params;
  if (!batchId || !isUuid(batchId)) {
    const response = apiError(ctx, { status: 400, code: "BAD_REQUEST", message: "Invalid batchId" });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }

  try {
    const clips = await getRepository().listClipsByBatch(batchId);
    const response = apiJson(ctx, { clips }, { status: 200 });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  } catch (error) {
    const response = apiError(ctx, { status: 500, code: "INTERNAL", message: "Unable to fetch clips" });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }
}
