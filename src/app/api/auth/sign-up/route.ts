import { createSupabaseAnonServerClient } from "@/infrastructure/supabase/anon-server-client";
import { setAuthCookies } from "@/features/auth/server/auth-cookies";
import { apiError, apiJson, createApiContext } from "@/lib/api-response";
import { isAllowedOrigin } from "@/lib/origin";
import { rateLimit } from "@/lib/rate-limit";
import { readJsonBodyWithLimit } from "@/lib/request-body";
import { isValidEmail } from "@/lib/validation";

interface SignUpPayload {
  email: string;
  password: string;
}

function parsePayload(body: unknown): SignUpPayload {
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
    throw new Error("Le mot de passe doit contenir au moins 8 caracteres.");
  }

  return { email, password };
}

export async function POST(request: Request) {
  const ctx = createApiContext(request);
  if (!isAllowedOrigin(request)) {
    return apiError(ctx, { status: 403, code: "INVALID_ORIGIN", message: "Invalid origin" });
  }

  const limited = rateLimit({ ctx, request, key: "auth:sign-up", limit: 10, windowMs: 60_000 });
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

  let payload: SignUpPayload;
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
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password
  });

  if (signUpError) {
    const raw = (signUpError.message ?? "").toLowerCase();
    const message = (() => {
      if (raw.includes("already") && raw.includes("registered")) {
        return "Un compte existe deja avec cet email. Connecte-toi.";
      }
      if (raw.includes("password") && (raw.includes("weak") || raw.includes("strength"))) {
        return "Mot de passe trop faible. Choisis-en un plus solide.";
      }
      return "Impossible de creer le compte.";
    })();

    const isServerIssue = typeof signUpError.status === "number" && signUpError.status >= 500;
    return apiError(ctx, {
      status: isServerIssue ? 503 : 400,
      code: isServerIssue ? "INTERNAL" : "BAD_REQUEST",
      message
    });
  }

  // Most projects allow immediate sessions on sign-up; when email confirmation is enabled, the session can be null.
  if (signUpData.session?.access_token && signUpData.session.refresh_token) {
    const response = apiJson(ctx, { ok: true }, { status: 200 });
    setAuthCookies(response, {
      accessToken: signUpData.session.access_token,
      refreshToken: signUpData.session.refresh_token,
      expiresAt: signUpData.session.expires_at ?? null
    });
    return response;
  }

  // Attempt immediate sign-in as a fallback when sign-up doesn't return a session (ex: email confirmation off but session missing).
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: payload.email,
    password: payload.password
  });

  if (signInError || !signInData.session?.access_token || !signInData.session.refresh_token) {
    return apiJson(ctx, { ok: true, needsEmailConfirmation: true }, { status: 200 });
  }

  const response = apiJson(ctx, { ok: true }, { status: 200 });
  setAuthCookies(response, {
    accessToken: signInData.session.access_token,
    refreshToken: signInData.session.refresh_token,
    expiresAt: signInData.session.expires_at ?? null
  });
  return response;
}
