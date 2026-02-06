const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const SAFE_ID_PATTERN = /^[a-zA-Z0-9_-]{3,80}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

export function parseMonthParam(value: string | null | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  if (!MONTH_PATTERN.test(trimmed)) {
    throw new Error("month must follow YYYY-MM");
  }

  return trimmed;
}

export function isSafeEntityId(value: string): boolean {
  return SAFE_ID_PATTERN.test(value.trim());
}

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value.trim());
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function normalizeHttpUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  // Keep handles as-is so we can show a helpful validation message.
  if (trimmed.startsWith("@")) {
    return trimmed;
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  if (trimmed.startsWith("www.")) {
    return `https://${trimmed}`;
  }

  return `https://${trimmed}`;
}

function parseHttpUrl(value: string): URL | null {
  const normalized = normalizeHttpUrl(value);
  if (!normalized) {
    return null;
  }

  try {
    const url = new URL(normalized);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

export function isValidPublicHttpUrl(value: string): boolean {
  const url = parseHttpUrl(value);
  if (!url) {
    return false;
  }

  // Avoid accepting weird hostnames like "https://tiktok" with no TLD.
  if (url.hostname === "localhost") {
    return true;
  }

  return url.hostname.includes(".");
}

export function isValidTiktokUrl(value: string): boolean {
  const url = parseHttpUrl(value);
  if (!url) {
    return false;
  }

  return url.hostname.toLowerCase().endsWith("tiktok.com");
}

export function isValidInstagramUrl(value: string): boolean {
  const url = parseHttpUrl(value);
  if (!url) {
    return false;
  }

  const hostname = url.hostname.toLowerCase();
  return hostname.endsWith("instagram.com") || hostname === "instagr.am";
}
