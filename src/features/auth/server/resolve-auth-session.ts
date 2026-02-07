import "server-only";

import { createSupabaseServerClient, isSupabaseConfigured } from "@/infrastructure/supabase/server-client";
import type { AuthRole, RedirectTarget } from "@/features/auth/types";
import { ACCESS_TOKEN_COOKIE_NAME } from "@/features/auth/server/auth-cookies";

export type { AuthRole, RedirectTarget } from "@/features/auth/types";
export { ACCESS_TOKEN_COOKIE_NAME } from "@/features/auth/server/auth-cookies";

export interface ResolvedAuthSession {
  role: AuthRole;
  target: RedirectTarget;
  userId: string;
  email?: string;
}

const MAX_ACCESS_TOKEN_LENGTH = 4096;

function normalizeRole(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function resolveAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export function sanitizeAccessToken(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const token = value.trim();
  if (!token || token.length > MAX_ACCESS_TOKEN_LENGTH) {
    return null;
  }

  return token;
}

export async function resolveAuthSessionFromAccessToken(
  rawToken: string | null | undefined
): Promise<ResolvedAuthSession | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const token = sanitizeAccessToken(rawToken);
  if (!token) {
    return null;
  }

  const client = createSupabaseServerClient();
  const { data: userData, error: userError } = await client.auth.getUser(token);

  if (userError || !userData.user) {
    return null;
  }

  const user = userData.user;
  const email = user.email?.toLowerCase();
  const metadataRole = normalizeRole(user.app_metadata?.role ?? user.user_metadata?.role);
  const isAdmin = metadataRole === "admin" || (email ? resolveAdminEmails().includes(email) : false);

  if (isAdmin) {
    return {
      role: "admin",
      target: "/admin",
      userId: user.id,
      email: user.email ?? undefined
    };
  }

  const { data: application, error: applicationError } = await client
    .from("creator_applications")
    .select("status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (applicationError) {
    throw new Error("Failed to resolve redirect target");
  }

  if (application?.status === "approved") {
    const { data: creator, error: creatorError } = await client
      .from("creators")
      .select("id, contract_signed_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (creatorError) {
      throw new Error("Failed to resolve redirect target");
    }

    // Avoid redirect loops: an approved application must be provisioned as a creator
    // before the user can access /dashboard.
    if (creator?.id) {
      return {
        role: "affiliate",
        target: creator.contract_signed_at ? "/dashboard" : "/contract",
        userId: user.id,
        email: user.email ?? undefined
      };
    }
  }

  return {
    role: "affiliate",
    target: "/onboarding",
    userId: user.id,
    email: user.email ?? undefined
  };
}

export async function findCreatorIdForUserEmail(email: string | null | undefined): Promise<string | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const client = createSupabaseServerClient();

  // Back-compat fallback: match on email until creators.user_id is fully adopted.
  const normalizedEmail = email?.trim().toLowerCase();
  if (normalizedEmail) {
    const { data, error } = await client
      .from("creators")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (error) {
      throw new Error("Failed to resolve creator mapping");
    }

    return data?.id ?? null;
  }

  return null;
}

export async function findCreatorIdForUser(input: {
  userId: string | null | undefined;
  email?: string | null | undefined;
}): Promise<string | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const client = createSupabaseServerClient();

  if (input.userId) {
    const { data, error } = await client
      .from("creators")
      .select("id")
      .eq("user_id", input.userId)
      .maybeSingle();

    if (error) {
      throw new Error("Failed to resolve creator mapping");
    }

    if (data?.id) {
      return data.id;
    }
  }

  return findCreatorIdForUserEmail(input.email);
}
