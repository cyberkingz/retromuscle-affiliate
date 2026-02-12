import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  ACCESS_TOKEN_COOKIE_NAME,
  type ResolvedAuthSession,
  type RedirectTarget,
  resolveAuthSessionFromAccessToken,
  sanitizeAccessToken
} from "@/features/auth/server/resolve-auth-session";
import { isSupabaseConfigured } from "@/infrastructure/supabase/server-client";

export async function getAuthSessionFromCookies(): Promise<ResolvedAuthSession | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const cookieStore = await cookies();
  const accessToken = sanitizeAccessToken(cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value);

  if (!accessToken) {
    return null;
  }

  try {
    return await resolveAuthSessionFromAccessToken(accessToken);
  } catch {
    return null;
  }
}

export async function getRedirectTargetFromCookies(): Promise<RedirectTarget | null> {
  const session = await getAuthSessionFromCookies();
  return session?.target ?? null;
}

export async function redirectAuthenticatedUserFromPublicAuthPages() {
  const target = await getRedirectTargetFromCookies();
  if (target) {
    redirect(target);
  }
}

export async function protectPage(expectedTarget: RedirectTarget) {
  if (!isSupabaseConfigured()) {
    return;
  }

  const target = await getRedirectTargetFromCookies();

  if (!target) {
    redirect("/login");
  }

  if (target !== expectedTarget) {
    // Redirect to the user's actual target instead of a generic 403 page.
    // e.g. pending_review users trying /dashboard get sent to /onboarding.
    redirect(target);
  }
}

export async function protectPageWithReturn(expectedTarget: RedirectTarget, returnTo: string) {
  if (!isSupabaseConfigured()) {
    return;
  }

  const target = await getRedirectTargetFromCookies();
  if (!target) {
    redirect("/login");
  }

  if (target !== expectedTarget) {
    redirect(target);
  }
}
