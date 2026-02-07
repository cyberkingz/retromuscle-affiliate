import { createSupabaseAnonServerClient } from "@/infrastructure/supabase/anon-server-client";
import { setAuthCookies } from "@/features/auth/server/auth-cookies";
import { apiError, apiJson, createApiContext } from "@/lib/api-response";
import { isAllowedOrigin } from "@/lib/origin";
import { rateLimit } from "@/lib/rate-limit";
import { readJsonBodyWithLimit } from "@/lib/request-body";
import { isValidEmail } from "@/lib/validation";

interface SignInPayload {
  email: string;
  password: string;
}

function parsePayload(body: unknown): SignInPayload {
  if (!body || typeof body !== "object") {
    throw new Error("Payload invalide.");
  }

  const input = body as Record<string, unknown>;
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = typeof input.password === "string" ? input.password : "";

  if (!email || !isValidEmail(email)) {
    throw new Error("Email invalide.");
  }
  if (password.length < 8) {
    throw new Error("Mot de passe invalide.");
  }

  return { email, password };
}

export async function POST(request: Request) {
  const ctx = createApiContext(request);
  if (!isAllowedOrigin(request)) {
    return apiError(ctx, { status: 403, code: "INVALID_ORIGIN", message: "Invalid origin" });
  }

  const limited = rateLimit({ ctx, request, key: "auth:sign-in", limit: 20, windowMs: 60_000 });
  if (limited) {
    return limited;
  }

  let rawBody: unknown;
  try {
    rawBody = await readJsonBodyWithLimit(request, { maxBytes: 8 * 1024 });
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

  let payload: SignInPayload;
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
  const { data, error } = await supabase.auth.signInWithPassword({
    email: payload.email,
    password: payload.password
  });

  if (error) {
    const isServerIssue = typeof error.status === "number" && error.status >= 500;
    return apiError(ctx, {
      status: isServerIssue ? 503 : 401,
      code: isServerIssue ? "INTERNAL" : "UNAUTHORIZED",
      message: isServerIssue
        ? "Service d'auth indisponible. Reessaie dans quelques instants."
        : "Identifiants invalides."
    });
  }

  if (!data.session?.access_token || !data.session.refresh_token) {
    return apiError(ctx, { status: 401, code: "UNAUTHORIZED", message: "Identifiants invalides." });
  }

  const response = apiJson(ctx, { ok: true }, { status: 200 });
  setAuthCookies(response, {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    expiresAt: data.session.expires_at ?? null
  });
  return response;
}
