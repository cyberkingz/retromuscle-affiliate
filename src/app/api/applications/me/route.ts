import { parsePayload } from "@/app/api/applications/_lib";
import { getRepository } from "@/application/dependencies";
import { saveCreatorApplication } from "@/application/use-cases/save-creator-application";
import { requireApiRole } from "@/features/auth/server/api-guards";
import { setAuthCookies } from "@/features/auth/server/auth-cookies";
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

  try {
    const repository = getRepository();
    const application = await repository.getCreatorApplicationByUserId(auth.session.userId);
    const response = apiJson(ctx, { application: application ?? null }, { status: 200 });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  } catch {
    const response = apiError(ctx, {
      status: 500,
      code: "INTERNAL",
      message: "Unable to load application"
    });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }
}

export async function POST(request: Request) {
  const ctx = createApiContext(request);
  if (!isAllowedOrigin(request)) {
    return apiError(ctx, { status: 403, code: "INVALID_ORIGIN", message: "Invalid origin" });
  }

  const limited = await rateLimit({ ctx, request, key: "applications:submit", limit: 10, windowMs: 60_000 });
  if (limited) return limited;

  const auth = await requireApiRole(request, "affiliate", { ctx });
  if (!auth.ok) {
    return auth.response;
  }

  let payload;
  try {
    payload = parsePayload(await readJsonBodyWithLimit(request, { maxBytes: 64 * 1024 }), {
      authEmail: auth.session.email
    });
  } catch (error) {
    const response = handleBodyParseError(ctx, error);
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }

  try {
    const application = await saveCreatorApplication({
      userId: auth.session.userId,
      authEmail: auth.session.email ?? "",
      handle: payload.handle,
      fullName: payload.fullName,
      whatsapp: payload.whatsapp,
      country: payload.country,
      address: payload.address,
      socialTiktok: payload.socialTiktok,
      socialInstagram: payload.socialInstagram,
      followersTiktok: payload.followersTiktok,
      followersInstagram: payload.followersInstagram,
      submit: payload.submit
    });

    const response = apiJson(ctx, { application }, { status: 200 });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  } catch (caught) {
    const is409 =
      caught instanceof Error &&
      (caught as NodeJS.ErrnoException & { statusCode?: number }).statusCode === 409;
    const response = apiError(ctx, {
      status: is409 ? 409 : 500,
      code: is409 ? "BAD_REQUEST" : "INTERNAL",
      message: caught instanceof Error ? caught.message : "Unable to save application"
    });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }
}
