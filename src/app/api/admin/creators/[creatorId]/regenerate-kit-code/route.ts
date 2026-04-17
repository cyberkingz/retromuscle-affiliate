import { generateKitPromoCode } from "@/application/use-cases/generate-kit-promo-code";
import { getRepository } from "@/application/dependencies";
import { requireApiRole } from "@/features/auth/server/api-guards";
import { setAuthCookies } from "@/features/auth/server/auth-cookies";
import { writeAdminAuditLog } from "@/features/admin/server/admin-audit-log";
import { apiError, apiJson, createApiContext } from "@/lib/api-response";
import { isAllowedOrigin } from "@/lib/origin";
import { rateLimit } from "@/lib/rate-limit";
import { isUuid } from "@/lib/validation";

export const runtime = "nodejs";

/**
 * POST /api/admin/creators/:id/regenerate-kit-code
 *
 * Admin-only: clears any existing Shopify promo code on the creator row and
 * calls Shopify to mint a fresh one. Used when initial generation failed at
 * contract-sign time, or when an admin needs to rotate a code.
 */
export async function POST(request: Request, context: { params: Promise<{ creatorId: string }> }) {
  const ctx = createApiContext(request);
  if (!isAllowedOrigin(request)) {
    return apiError(ctx, { status: 403, code: "INVALID_ORIGIN", message: "Invalid origin" });
  }

  const limited = await rateLimit({
    ctx,
    request,
    key: "admin:kit-code:regenerate",
    limit: 20,
    windowMs: 60_000
  });
  if (limited) return limited;

  const auth = await requireApiRole(request, "admin", { ctx });
  if (!auth.ok) return auth.response;

  const { creatorId: id } = await context.params;
  if (!id || !isUuid(id)) {
    const response = apiError(ctx, {
      status: 400,
      code: "BAD_REQUEST",
      message: "Invalid creator id"
    });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }

  try {
    const repository = getRepository();
    const creator = await repository.getCreatorById(id);
    if (!creator) {
      const response = apiError(ctx, {
        status: 404,
        code: "NOT_FOUND",
        message: "Creator not found"
      });
      if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
      return response;
    }

    // Clear existing code (if any) so the generator mints a fresh one.
    if (creator.kitPromoCode || creator.shopifyDiscountId) {
      await repository.clearKitPromoCode(creator.id);
    }

    const result = await generateKitPromoCode(
      {
        creatorId: id,
        repository
      },
      { allowWithoutSignedContract: true }
    );

    writeAdminAuditLog({
      request,
      requestId: ctx.requestId,
      adminUserId: auth.session.userId,
      action: "creator.regenerate_kit_code",
      entityType: "creator",
      entityId: id,
      metadata: {
        previousCode: creator.kitPromoCode ?? null,
        newCode: result.code
      }
    }).catch(console.error);

    const response = apiJson(
      ctx,
      { creatorId: id, code: result.code, discountId: result.discountId },
      { status: 200 }
    );
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to regenerate kit code";
    const response = apiError(ctx, {
      status: 500,
      code: "INTERNAL",
      message
    });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }
}
