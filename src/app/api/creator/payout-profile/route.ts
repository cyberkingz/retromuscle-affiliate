import { getCreatorPayoutProfile } from "@/application/use-cases/get-creator-payout-profile";
import { saveCreatorPayoutProfile } from "@/application/use-cases/save-creator-payout-profile";
import { requireApiRole } from "@/features/auth/server/api-guards";
import { setAuthCookies } from "@/features/auth/server/auth-cookies";
import { apiError, apiJson, createApiContext } from "@/lib/api-response";
import { isAllowedOrigin } from "@/lib/origin";
import { rateLimit } from "@/lib/rate-limit";
import { readJsonBodyWithLimit } from "@/lib/request-body";
import { isValidEmail } from "@/lib/validation";

type PayoutMethod = "iban" | "paypal" | "stripe";

function normalizeIban(value: string): string {
  return value.replace(/\s+/g, "").toUpperCase();
}

function isLikelyIban(value: string): boolean {
  const iban = normalizeIban(value);
  return /^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(iban) && iban.length >= 15 && iban.length <= 34;
}

function maskIbanLast4(value: string | null | undefined): string | null {
  const clean = (value ?? "").replace(/\s+/g, "");
  if (!clean) return null;
  return clean.slice(-4);
}

function parseMethod(value: unknown): PayoutMethod {
  if (value === "iban" || value === "paypal" || value === "stripe") {
    return value;
  }
  throw new Error("Invalid payout method");
}

export async function GET(request: Request) {
  const ctx = createApiContext(request);
  const limited = rateLimit({ ctx, request, key: "creator:payout-profile:get", limit: 60, windowMs: 60_000 });
  if (limited) {
    return limited;
  }

  const auth = await requireApiRole(request, "affiliate", { ctx });
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const profile = await getCreatorPayoutProfile({ userId: auth.session.userId });

    const response = apiJson(
      ctx,
      {
        profile: profile
          ? {
              method: profile.method,
              accountHolderName: profile.accountHolderName ?? null,
              ibanLast4: maskIbanLast4(profile.iban),
              paypalEmail: profile.paypalEmail ?? null,
              stripeAccount: profile.stripeAccount ?? null,
              updatedAt: profile.updatedAt
            }
          : null
      },
      { status: 200 }
    );
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  } catch {
    const response = apiError(ctx, { status: 500, code: "INTERNAL", message: "Unable to fetch payout profile" });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }
}

export async function POST(request: Request) {
  const ctx = createApiContext(request);
  if (!isAllowedOrigin(request)) {
    return apiError(ctx, { status: 403, code: "INVALID_ORIGIN", message: "Invalid origin" });
  }

  const limited = rateLimit({ ctx, request, key: "creator:payout-profile:save", limit: 20, windowMs: 60_000 });
  if (limited) {
    return limited;
  }

  const auth = await requireApiRole(request, "affiliate", { ctx });
  if (!auth.ok) {
    return auth.response;
  }

  let rawBody: unknown;
  try {
    rawBody = await readJsonBodyWithLimit(request, { maxBytes: 12 * 1024 });
  } catch (error) {
    const response = apiError(ctx, {
      status: error instanceof Error && error.message === "PAYLOAD_TOO_LARGE" ? 413 : 400,
      code: error instanceof Error && error.message === "PAYLOAD_TOO_LARGE" ? "PAYLOAD_TOO_LARGE" : "BAD_REQUEST",
      message: error instanceof Error && error.message === "PAYLOAD_TOO_LARGE" ? "Payload trop volumineux." : "Payload invalide."
    });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }

  if (!rawBody || typeof rawBody !== "object") {
    const response = apiError(ctx, { status: 400, code: "BAD_REQUEST", message: "Payload invalide." });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }

  const input = rawBody as Record<string, unknown>;

  let method: PayoutMethod;
  try {
    method = parseMethod(input.method);
  } catch (error) {
    const response = apiError(ctx, { status: 400, code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Invalid method" });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }

  const accountHolderName =
    typeof input.accountHolderName === "string" ? input.accountHolderName.trim() : "";
  const ibanRaw = typeof input.iban === "string" ? input.iban.trim() : "";
  const paypalEmailRaw = typeof input.paypalEmail === "string" ? input.paypalEmail.trim() : "";
  const stripeAccountRaw = typeof input.stripeAccount === "string" ? input.stripeAccount.trim() : "";

  if (method === "iban") {
    if (accountHolderName.length < 2) {
      const response = apiError(ctx, { status: 400, code: "BAD_REQUEST", message: "Nom titulaire invalide." });
      if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
      return response;
    }
    if (ibanRaw && !isLikelyIban(ibanRaw)) {
      const response = apiError(ctx, { status: 400, code: "BAD_REQUEST", message: "IBAN invalide." });
      if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
      return response;
    }
  }

  if (method === "paypal") {
    if (!paypalEmailRaw || !isValidEmail(paypalEmailRaw)) {
      const response = apiError(ctx, { status: 400, code: "BAD_REQUEST", message: "Email PayPal invalide." });
      if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
      return response;
    }
  }

  try {
    await saveCreatorPayoutProfile({
      userId: auth.session.userId,
      method,
      accountHolderName: method === "iban" ? accountHolderName : null,
      iban: method === "iban" && ibanRaw ? normalizeIban(ibanRaw) : null,
      paypalEmail: method === "paypal" ? paypalEmailRaw.toLowerCase() : null,
      stripeAccount: method === "stripe" ? stripeAccountRaw : null
    });

    const response = apiJson(ctx, { ok: true }, { status: 200 });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  } catch {
    const response = apiError(ctx, {
      status: 500,
      code: "INTERNAL",
      message: "Unable to save payout profile"
    });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }
}
