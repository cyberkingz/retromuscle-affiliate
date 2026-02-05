const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const SAFE_ID_PATTERN = /^[a-zA-Z0-9_-]{3,80}$/;

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

export function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
