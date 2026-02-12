/**
 * CSV utilities extracted from the payments export route for testability.
 */

/** Escape a value for safe inclusion in a CSV cell. Prevents formula injection. */
export function csvEscape(value: unknown): string {
  let text = value === null || value === undefined ? "" : String(value);
  // Prevent CSV formula injection: strip leading characters that spreadsheets interpret as formulas.
  if (/^[=+\-@\t\r]/.test(text)) {
    text = "'" + text;
  }
  if (/[\",\n\r]/.test(text)) {
    return `"${text.replace(/\"/g, "\"\"")}"`;
  }
  return text;
}

/** Mask IBAN: show first 4 and last 4, asterisks in between. e.g. FR76****...****4521 */
export function maskIban(iban: string | null | undefined): string {
  if (!iban) return "";
  const clean = iban.replace(/\s+/g, "");
  if (clean.length <= 8) return "****";
  return clean.slice(0, 4) + "****...****" + clean.slice(-4);
}

/** Mask email: show first 3 chars + domain. e.g. joh***@example.com */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return "";
  const atIndex = email.indexOf("@");
  if (atIndex <= 0) return "***";
  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex);
  const visible = local.slice(0, 3);
  return visible + "***" + domain;
}
