import { NextResponse } from "next/server";

import { MIX_NAMES } from "@/domain/types";
import { readBearerToken } from "@/features/auth/server/resolve-auth-session";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server-client";
import { isValidEmail, isValidHttpUrl } from "@/lib/validation";

const PACKAGE_TIERS = [10, 20, 30, 40] as const;

export interface ApplicationPayload {
  handle: string;
  fullName: string;
  email: string;
  whatsapp: string;
  country: string;
  address: string;
  socialTiktok?: string;
  socialInstagram?: string;
  followers: number;
  portfolioUrl?: string;
  packageTier: (typeof PACKAGE_TIERS)[number];
  mixName: (typeof MIX_NAMES)[number];
  submit: boolean;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function sanitizeOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function isPackageTier(value: unknown): value is (typeof PACKAGE_TIERS)[number] {
  return typeof value === "number" && PACKAGE_TIERS.includes(value as (typeof PACKAGE_TIERS)[number]);
}

function isMixName(value: unknown): value is (typeof MIX_NAMES)[number] {
  return typeof value === "string" && MIX_NAMES.includes(value as (typeof MIX_NAMES)[number]);
}

export function parsePayload(body: unknown): ApplicationPayload {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid payload");
  }

  const input = body as Record<string, unknown>;

  if (!isNonEmptyString(input.handle)) {
    throw new Error("handle is required");
  }
  if (!isNonEmptyString(input.fullName)) {
    throw new Error("fullName is required");
  }
  if (!isNonEmptyString(input.email)) {
    throw new Error("email is required");
  }
  if (!isNonEmptyString(input.whatsapp)) {
    throw new Error("whatsapp is required");
  }
  if (!isNonEmptyString(input.country)) {
    throw new Error("country is required");
  }
  if (!isNonEmptyString(input.address)) {
    throw new Error("address is required");
  }
  if (!isPackageTier(input.packageTier)) {
    throw new Error("packageTier is invalid");
  }
  if (!isMixName(input.mixName)) {
    throw new Error("mixName is invalid");
  }
  if (!isValidEmail(input.email.trim())) {
    throw new Error("email format is invalid");
  }

  const followers = Number(input.followers);
  if (!Number.isFinite(followers) || !Number.isInteger(followers) || followers < 0 || followers > 100000000) {
    throw new Error("followers is invalid");
  }

  const socialTiktok = sanitizeOptionalString(input.socialTiktok);
  const socialInstagram = sanitizeOptionalString(input.socialInstagram);
  const portfolioUrl = sanitizeOptionalString(input.portfolioUrl);

  if (socialTiktok && !isValidHttpUrl(socialTiktok)) {
    throw new Error("socialTiktok must be a valid URL");
  }
  if (socialInstagram && !isValidHttpUrl(socialInstagram)) {
    throw new Error("socialInstagram must be a valid URL");
  }
  if (portfolioUrl && !isValidHttpUrl(portfolioUrl)) {
    throw new Error("portfolioUrl must be a valid URL");
  }

  return {
    handle: input.handle.trim(),
    fullName: input.fullName.trim(),
    email: input.email.trim(),
    whatsapp: input.whatsapp.trim(),
    country: input.country.trim(),
    address: input.address.trim(),
    socialTiktok,
    socialInstagram,
    followers,
    portfolioUrl,
    packageTier: input.packageTier,
    mixName: input.mixName,
    submit: Boolean(input.submit)
  };
}

export async function requireUserFromRequest(request: Request): Promise<{
  client: ReturnType<typeof createSupabaseServerClient>;
  userId: string;
  email?: string;
}> {
  const token = readBearerToken(request.headers.get("authorization"));
  if (!token) {
    throw new Error("Missing bearer token");
  }

  const client = createSupabaseServerClient();
  const { data, error } = await client.auth.getUser(token);

  if (error || !data.user) {
    throw new Error("Invalid auth token");
  }

  return {
    client,
    userId: data.user.id,
    email: data.user.email ?? undefined
  };
}

export function badRequest(message: string) {
  return NextResponse.json({ message }, { status: 400 });
}

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ message }, { status: 401 });
}
