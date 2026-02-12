import { createSupabaseAnonServerClient } from "@/infrastructure/supabase/anon-server-client";
import { apiError, apiJson, createApiContext } from "@/lib/api-response";
import { isAllowedOrigin } from "@/lib/origin";
import { rateLimit } from "@/lib/rate-limit";
import { readJsonBodyWithLimit } from "@/lib/request-body";
import { isValidEmail } from "@/lib/validation";

interface ResendPayload {
  email: string;
}

function parsePayload(body: unknown): ResendPayload {
  if (!body || typeof body !== "object") {
    throw new Error("Payload invalide.");
  }

  const input = body as Record<string, unknown>;
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";

  if (!email || !isValidEmail(email)) {
    throw new Error("Email invalide.");
  }

  return { email };
}

export async function POST(request: Request) {
  const ctx = createApiContext(request);
  if (!isAllowedOrigin(request)) {
    return apiError(ctx, { status: 403, code: "INVALID_ORIGIN", message: "Invalid origin" });
  }

  const limited = rateLimit({ ctx, request, key: "auth:resend-verification", limit: 3, windowMs: 60_000 });
  if (limited) {
    return limited;
  }

  let rawBody: unknown;
  try {
    rawBody = await readJsonBodyWithLimit(request, { maxBytes: 2 * 1024 });
  } catch (error) {
    return apiError(ctx, {
      status: error instanceof Error && error.message === "PAYLOAD_TOO_LARGE" ? 413 : 400,
      code: error instanceof Error && error.message === "PAYLOAD_TOO_LARGE" ? "PAYLOAD_TOO_LARGE" : "BAD_REQUEST",
      message:
        error instanceof Error && error.message === "PAYLOAD_TOO_LARGE"
          ? "Payload trop volumineux."
          : "Payload invalide."
    });
  }

  let payload: ResendPayload;
  try {
    payload = parsePayload(rawBody);
  } catch (error) {
    return apiError(ctx, {
      status: 400,
      code: "BAD_REQUEST",
      message: error instanceof Error ? error.message : "Payload invalide."
    });
  }

  let supabase;
  try {
    supabase = createSupabaseAnonServerClient();
  } catch {
    return apiError(ctx, {
      status: 500,
      code: "SUPABASE_MISCONFIG",
      message: "Service d'auth indisponible (configuration Supabase)."
    });
  }

  const { error: resendError } = await supabase.auth.resend({
    type: "signup",
    email: payload.email
  });

  if (resendError) {
    return apiError(ctx, {
      status: 400,
      code: "BAD_REQUEST",
      message: "Impossible de renvoyer l'email. Reessaie dans quelques minutes."
    });
  }

  return apiJson(ctx, { ok: true, message: "Email de verification renvoye." }, { status: 200 });
}
