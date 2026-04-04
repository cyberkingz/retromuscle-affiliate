import {
  extractInstagramProfileHandle,
  extractTiktokProfileHandle,
  isValidEmail,
  isValidInstagramUrl,
  isValidTiktokUrl
} from "@/lib/validation";

export interface ApplicationPayload {
  handle: string;
  fullName: string;
  email: string;
  whatsapp: string;
  country: string;
  address: string;
  socialTiktok?: string;
  socialInstagram?: string;
  followersTiktok: number;
  followersInstagram: number;
  submit: boolean;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function sanitizeOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
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

  const email = (options?.authEmail ?? "").trim().toLowerCase();
  if (!email || !isValidEmail(email)) {
    throw new Error("Email invalide.");
  }

  const followersTiktok = Number(input.followers_tiktok ?? 0);
  if (!Number.isFinite(followersTiktok) || !Number.isInteger(followersTiktok) || followersTiktok < 0 || followersTiktok > 100000000) {
    throw new Error("Le nombre d'abonnes TikTok est invalide.");
  }

  const followersInstagram = Number(input.followers_instagram ?? 0);
  if (!Number.isFinite(followersInstagram) || !Number.isInteger(followersInstagram) || followersInstagram < 0 || followersInstagram > 100000000) {
    throw new Error("Le nombre d'abonnes Instagram est invalide.");
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
    followersTiktok,
    followersInstagram,
    submit: Boolean(input.submit)
  };
}
