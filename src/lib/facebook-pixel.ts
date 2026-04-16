export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID ?? "";

/** Fire a standard PageView — called on every route change */
export function pageview() {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("track", "PageView");
}

/**
 * Lead — fire when a user submits their creator application.
 * Maps to: "Soumettre le dossier" in the onboarding wizard.
 */
export function lead() {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("track", "Lead");
}

/**
 * CompleteRegistration — fire when a user successfully creates an account.
 * Maps to: successful signup on /apply.
 */
export function completeRegistration() {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("track", "CompleteRegistration", { currency: "EUR", status: true });
}
