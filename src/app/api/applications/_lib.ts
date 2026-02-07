import { MIX_NAMES } from "@/domain/types";
import {
  extractInstagramProfileHandle,
  extractTiktokProfileHandle,
  isValidEmail,
  isValidInstagramUrl,
  isValidTiktokUrl
} from "@/lib/validation";

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

export function parsePayload(
  body: unknown,
  options?: {
    authEmail?: string;
  }
): ApplicationPayload {
  if (!body || typeof body !== "object") {
    throw new Error("Payload invalide.");
  }

  const input = body as Record<string, unknown>;

  if (!isNonEmptyString(input.fullName)) {
    throw new Error("Ajoute ton nom complet.");
  }
  if (!isNonEmptyString(input.whatsapp)) {
    throw new Error("Ajoute ton numero WhatsApp.");
  }
  if (!isNonEmptyString(input.country)) {
    throw new Error("Ajoute ton pays.");
  }
  if (!isNonEmptyString(input.address)) {
    throw new Error("Ajoute ton adresse de livraison.");
  }
  if (!isPackageTier(input.packageTier)) {
    throw new Error("Choisis un package valide.");
  }
  if (!isMixName(input.mixName)) {
    throw new Error("Choisis un mix valide.");
  }

  const email = (options?.authEmail ?? "").trim().toLowerCase();
  if (!email || !isValidEmail(email)) {
    throw new Error("Email invalide.");
  }

  const followers = Number(input.followers);
  if (!Number.isFinite(followers) || !Number.isInteger(followers) || followers < 0 || followers > 100000000) {
    throw new Error("Le nombre de followers est invalide.");
  }

  const socialTiktok = sanitizeOptionalString(input.socialTiktok);
  const socialInstagram = sanitizeOptionalString(input.socialInstagram);

  if (socialTiktok && !isValidTiktokUrl(socialTiktok)) {
    throw new Error("Lien TikTok invalide. Exemple: https://www.tiktok.com/@toncompte");
  }
  if (socialInstagram && !isValidInstagramUrl(socialInstagram)) {
    throw new Error("Lien Instagram invalide. Exemple: https://www.instagram.com/toncompte");
  }

  const derivedHandle =
    (socialTiktok ? extractTiktokProfileHandle(socialTiktok) : null) ??
    (socialInstagram ? extractInstagramProfileHandle(socialInstagram) : null);

  const handle = derivedHandle ?? "";

  if (!handle) {
    throw new Error("Ajoute un lien TikTok ou Instagram valide (profil public) pour detecter ton handle.");
  }

  return {
    handle,
    fullName: input.fullName.trim(),
    email,
    whatsapp: input.whatsapp.trim(),
    country: input.country.trim(),
    address: input.address.trim(),
    socialTiktok,
    socialInstagram,
    followers,
    packageTier: input.packageTier,
    mixName: input.mixName,
    submit: Boolean(input.submit)
  };
}
