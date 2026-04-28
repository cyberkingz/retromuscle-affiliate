import { getResendClient, isResendConfigured } from "./resend-client";

// ---------------------------------------------------------------------------
// Brand constants — resolved from design tokens (CSS vars can't be used in emails)
//
// Primary:   hsl(327,100%,66%) = #FF52B1  — vivid hot pink (brand primary)
// Primary BG: darker shade for CTA button backgrounds  = #D4006A
// Mint:       hsl(151,72%,42%) ≈ #1EB96E  — approved / success green
// Navy:       hsl(228,92%,25%) ≈ #060D38  — secondary / dark surfaces
// ---------------------------------------------------------------------------

const BRAND_PRIMARY_TEXT = "#D4006A"; // eyebrow labels, accent text (slightly darker for legibility on white)
const BRAND_PRIMARY_CTA = "#D4006A"; // CTA button backgrounds
const BRAND_MINT = "#1EB96E"; // success / approved state
const BRAND_AMBER = "#D97706"; // warning / revision state (slightly darker for light bg legibility)

const FROM = "RetroMuscle Affiliate <noreply@affiliate.retromuscle.net>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://affiliate.retromuscle.net";

// ---------------------------------------------------------------------------
// Escape user-supplied strings for safe insertion into HTML text nodes only.
// NOT safe for href/src attributes, unquoted attributes, <script> or CSS values.
// ---------------------------------------------------------------------------
function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ---------------------------------------------------------------------------
// Shared label map (kept local to avoid importing domain layer)
// ---------------------------------------------------------------------------
const VIDEO_TYPE_LABELS_EMAIL: Record<string, string> = {
  OOTD: "OOTD",
  TRAINING: "Training",
  BEFORE_AFTER: "Before/After",
  SPORTS_80S: "Sports 80s",
  CINEMATIC: "Cinematic"
};

// ---------------------------------------------------------------------------
// Shared shell — light card, wordmark, and page footer across all
// creator-facing emails. Light theme renders correctly in Gmail dark mode
// (Gmail properly inverts light emails; dark emails stay dark and look heavy).
// ---------------------------------------------------------------------------
function buildCreatorEmailShell(cardContent: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#f0eaf8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111827;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:40px auto;padding:0 20px;">
    <tr><td>
      <div style="background:#ffffff;border:1px solid #e4d8f4;border-radius:14px;padding:40px 36px;">
        <!-- Wordmark -->
        <p style="margin:0 0 32px;font-size:11px;font-weight:900;color:${BRAND_PRIMARY_CTA};text-transform:uppercase;letter-spacing:0.22em;">
          RETROMUSCLE
        </p>
        ${cardContent}
      </div>
      <p style="margin:20px 0 0;text-align:center;font-size:12px;color:#9ca3af;">
        &copy; ${new Date().getFullYear()} RetroMuscle &middot;
        <a href="${APP_URL}" style="color:#9ca3af;text-decoration:none;">affiliate.retromuscle.net</a>
      </p>
    </td></tr>
  </table>
</body>
</html>`.trim();
}

// Compact shell for internal admin notifications — no wordmark flourish needed.
function buildAdminEmailShell(cardContent: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#f0eaf8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111827;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:40px auto;padding:0 20px;">
    <tr><td>
      <div style="background:#ffffff;border:1px solid #e4d8f4;border-radius:14px;padding:36px 32px;">
        <!-- Wordmark -->
        <p style="margin:0 0 28px;font-size:10px;font-weight:900;color:#9ca3af;text-transform:uppercase;letter-spacing:0.22em;">
          RETROMUSCLE ADMIN
        </p>
        ${cardContent}
      </div>
      <p style="margin:16px 0 0;text-align:center;font-size:11px;color:#9ca3af;">
        RetroMuscle &middot; <a href="${APP_URL}/admin" style="color:#9ca3af;text-decoration:none;">affiliate.retromuscle.net/admin</a>
      </p>
    </td></tr>
  </table>
</body>
</html>`.trim();
}

// Reusable inset highlight block (replaces AI-slop left-border pattern).
// Use for promo codes, next-step callouts, and action summaries.
function insetBlock({
  eyebrow,
  heading,
  subtext,
  accentColor = BRAND_PRIMARY_TEXT
}: {
  eyebrow: string;
  heading: string;
  subtext?: string;
  accentColor?: string;
}): string {
  return `
<div style="background:#faf7ff;border:1px solid ${accentColor}33;border-radius:10px;padding:22px 26px;margin:0 0 28px;text-align:center;">
  <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:${accentColor};text-transform:uppercase;letter-spacing:0.12em;">
    ${eyebrow}
  </p>
  <p style="margin:0${subtext ? " 0 6px" : ""};font-size:20px;font-weight:900;color:#111827;letter-spacing:0.02em;">
    ${heading}
  </p>
  ${subtext ? `<p style="margin:0;font-size:12px;color:#6b7280;">${subtext}</p>` : ""}
</div>`.trim();
}

// Reusable note block for rejection reasons and revision instructions.
// No left-border accent — uses a subtle inset treatment instead.
function noteBlock({
  label,
  body,
  accentColor = BRAND_PRIMARY_TEXT
}: {
  label: string;
  body: string;
  accentColor?: string;
}): string {
  return `
<div style="background:#faf7ff;border:1px solid ${accentColor}33;border-radius:8px;padding:16px 18px;margin:20px 0;">
  <p style="margin:0 0 6px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${accentColor};">
    ${label}
  </p>
  <p style="margin:0;font-size:14px;line-height:1.6;color:#374151;">${body}</p>
</div>`.trim();
}

// Primary CTA button — always full-width, always brand pink.
function ctaButton(href: string, label: string): string {
  return `
<a href="${href}"
   style="display:block;background:${BRAND_PRIMARY_CTA};color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:700;font-size:15px;text-align:center;letter-spacing:0.04em;">
  ${label}
</a>`.trim();
}

// ---------------------------------------------------------------------------
// Application approved
// ---------------------------------------------------------------------------
export async function sendApplicationApprovedEmail(input: {
  to: string;
  fullName: string;
}): Promise<void> {
  if (!isResendConfigured()) return;

  const safeFullName = escapeHtml(input.fullName);

  const content = `
<!-- Eyebrow -->
<p style="margin:0 0 6px;font-size:11px;font-weight:700;color:${BRAND_PRIMARY_TEXT};text-transform:uppercase;letter-spacing:0.12em;">
  Programme d&rsquo;affiliation RetroMuscle
</p>

<!-- Headline -->
<p style="margin:0 0 20px;font-size:22px;font-weight:700;color:#111827;">
  Bienvenue dans l&rsquo;&eacute;quipe, ${safeFullName}&nbsp;🔥
</p>

<!-- Body -->
<p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#4b5563;">
  Ta candidature a &eacute;t&eacute; <strong style="color:${BRAND_PRIMARY_TEXT};">accept&eacute;e</strong>.
  Tu rejoins officiellement le programme cr&eacute;ateur RetroMuscle.
</p>

<!-- Next step block -->
${insetBlock({
  eyebrow: "Prochaine étape",
  heading: "Signe ton contrat",
  subtext: "Accède à ton espace &middot; signe &middot; commence à uploader",
  accentColor: BRAND_PRIMARY_TEXT
})}

<!-- CTA -->
${ctaButton(`${APP_URL}/contract`, "Signer mon contrat →")}

<!-- Footer note -->
<p style="margin:28px 0 0;font-size:14px;line-height:1.7;color:#6b7280;">
  Une fois ton contrat sign&eacute;, tu recevras ton kit cr&eacute;ateur avec ton code promo
  pour commander ta premi&egrave;re tenue de shoot.
</p>
<p style="margin:20px 0 0;font-size:13px;color:#9ca3af;">
  Des questions&nbsp;? R&eacute;ponds &agrave; cet email, on est l&agrave;.
</p>`;

  await getResendClient().emails.send({
    from: FROM,
    to: input.to,
    subject: "🎉 Candidature acceptée — Bienvenue chez RetroMuscle !",
    html: buildCreatorEmailShell(content)
  });
}

// ---------------------------------------------------------------------------
// Application rejected
// ---------------------------------------------------------------------------
export async function sendApplicationRejectedEmail(input: {
  to: string;
  fullName: string;
  notes?: string | null;
}): Promise<void> {
  if (!isResendConfigured()) return;

  const safeFullName = escapeHtml(input.fullName);
  const notesSection = input.notes
    ? noteBlock({ label: "Note", body: escapeHtml(input.notes), accentColor: "#6b7280" })
    : "";

  const content = `
<!-- Eyebrow -->
<p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.12em;">
  D&eacute;cision candidature
</p>

<!-- Headline -->
<p style="margin:0 0 20px;font-size:22px;font-weight:700;color:#111827;">
  Bonjour ${safeFullName},
</p>

<!-- Body -->
<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#4b5563;">
  Apr&egrave;s examen de ta candidature, nous ne sommes pas en mesure de t&rsquo;int&eacute;grer
  au programme pour le moment.
</p>
${notesSection}
<p style="margin:16px 0 0;font-size:15px;line-height:1.6;color:#4b5563;">
  Tu peux re-soumettre une candidature &agrave; tout moment si ta situation &eacute;volue.
</p>
<p style="margin:28px 0 0;font-size:13px;color:#9ca3af;">
  Des questions&nbsp;? R&eacute;ponds &agrave; cet email.
</p>`;

  await getResendClient().emails.send({
    from: FROM,
    to: input.to,
    subject: "Candidature RetroMuscle — Décision",
    html: buildCreatorEmailShell(content)
  });
}

// ---------------------------------------------------------------------------
// Creator kit — sent after per-creator Shopify promo code has been minted
// ---------------------------------------------------------------------------
const DEFAULT_STORE_URL = "https://retromuscle.net";

export async function sendKitWelcomeEmail(input: {
  to: string;
  displayName: string;
  promoCode: string;
  storeUrl?: string;
}): Promise<void> {
  if (!isResendConfigured()) return;

  const storeUrl = input.storeUrl ?? DEFAULT_STORE_URL;
  const safePromoCode = escapeHtml(input.promoCode);
  const safeDisplayName = escapeHtml(input.displayName);

  const content = `
<!-- Eyebrow -->
<p style="margin:0 0 6px;font-size:11px;font-weight:700;color:${BRAND_PRIMARY_TEXT};text-transform:uppercase;letter-spacing:0.12em;">
  Kit Cr&eacute;ateur RetroMuscle
</p>

<!-- Headline -->
<p style="margin:0 0 20px;font-size:22px;font-weight:700;color:#111827;">
  Ton contrat est sign&eacute;, ${safeDisplayName}&nbsp;🔥
</p>

<!-- Body -->
<p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#4b5563;">
  Avant de commencer &agrave; filmer, commande ta premi&egrave;re tenue RetroMuscle.
  C&rsquo;est ton &eacute;quipement pour cr&eacute;er du contenu authentique avec les vrais produits de la marque.
</p>

<!-- Promo code block -->
<div style="background:#faf7ff;border:1px solid ${BRAND_PRIMARY_TEXT}33;border-radius:10px;padding:24px 28px;margin:0 0 28px;text-align:center;">
  <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:${BRAND_PRIMARY_TEXT};text-transform:uppercase;letter-spacing:0.12em;">
    Ton code kit cr&eacute;ateur personnel
  </p>
  <p style="margin:0 0 10px;font-size:32px;font-weight:900;color:#111827;letter-spacing:0.1em;font-variant-numeric:tabular-nums;">
    ${safePromoCode}
  </p>
  <p style="margin:0;font-size:12px;color:#6b7280;">
    &minus;20% sur ta commande &middot; Valable 1 fois &middot; Usage personnel uniquement
  </p>
</div>

<!-- CTA -->
${ctaButton(`${storeUrl}?utm_source=creator-email&utm_medium=kit&utm_campaign=welcome`, "Commander ma tenue de shoot →")}

<!-- Footer note -->
<p style="margin:28px 0 0;font-size:14px;line-height:1.7;color:#6b7280;">
  Une fois ta commande pass&eacute;e, tu peux commencer &agrave; soumettre tes premiers contenus
  depuis ton <a href="${APP_URL}/dashboard" style="color:${BRAND_PRIMARY_TEXT};text-decoration:none;">espace cr&eacute;ateur</a>.
</p>
<p style="margin:20px 0 0;font-size:13px;color:#9ca3af;">
  Des questions&nbsp;? R&eacute;ponds &agrave; cet email, on est l&agrave;.
</p>`;

  await getResendClient().emails.send({
    from: FROM,
    to: input.to,
    subject: "Bienvenue dans l'équipe RetroMuscle — voici ton kit créateur 🎽",
    html: buildCreatorEmailShell(content)
  });
}

// ---------------------------------------------------------------------------
// Video approved (creator notification)
// ---------------------------------------------------------------------------
export async function sendVideoApprovedEmail(input: {
  to: string;
  creatorName: string;
  videoType: string;
}): Promise<void> {
  if (!isResendConfigured()) return;

  const typeLabel = escapeHtml(VIDEO_TYPE_LABELS_EMAIL[input.videoType] ?? input.videoType);
  const safeCreatorName = escapeHtml(input.creatorName);

  const content = `
<!-- Eyebrow -->
<p style="margin:0 0 6px;font-size:11px;font-weight:700;color:${BRAND_MINT};text-transform:uppercase;letter-spacing:0.12em;">
  Vid&eacute;o valid&eacute;e
</p>

<!-- Headline -->
<p style="margin:0 0 20px;font-size:22px;font-weight:700;color:#111827;">
  Bonne nouvelle, ${safeCreatorName}&nbsp;🎉
</p>

<!-- Body -->
<p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#4b5563;">
  Ta vid&eacute;o <strong style="color:#111827;">${typeLabel}</strong> a &eacute;t&eacute;
  <strong style="color:${BRAND_MINT};">valid&eacute;e</strong> et comptabilis&eacute;e dans tes gains du mois.
</p>

<!-- Action block -->
${insetBlock({
  eyebrow: "Continue sur ta lancée",
  heading: "Upload ta prochaine vidéo",
  subtext: "Maximise tes gains ce mois-ci.",
  accentColor: BRAND_MINT
})}

<!-- CTA -->
${ctaButton(`${APP_URL}/uploads`, "Uploader une vidéo →")}

<p style="margin:28px 0 0;font-size:13px;color:#9ca3af;">
  Des questions&nbsp;? R&eacute;ponds &agrave; cet email, on est l&agrave;.
</p>`;

  await getResendClient().emails.send({
    from: FROM,
    to: input.to,
    subject: `Vidéo validée ✅ — ${typeLabel}`,
    html: buildCreatorEmailShell(content)
  });
}

// ---------------------------------------------------------------------------
// Video rejected
// ---------------------------------------------------------------------------
export async function sendVideoRejectedEmail(input: {
  to: string;
  creatorName: string;
  videoType: string;
  reason?: string | null;
}): Promise<void> {
  if (!isResendConfigured()) return;

  const typeLabel = escapeHtml(VIDEO_TYPE_LABELS_EMAIL[input.videoType] ?? input.videoType);
  const safeCreatorName = escapeHtml(input.creatorName);
  const reasonSection = input.reason
    ? noteBlock({ label: "Raison du refus", body: escapeHtml(input.reason), accentColor: "#6b7280" })
    : "";

  const content = `
<!-- Eyebrow -->
<p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.12em;">
  Vid&eacute;o refus&eacute;e
</p>

<!-- Headline -->
<p style="margin:0 0 20px;font-size:22px;font-weight:700;color:#111827;">
  Bonjour ${safeCreatorName},
</p>

<!-- Body -->
<p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:#4b5563;">
  Ta vid&eacute;o <strong style="color:#111827;">${typeLabel}</strong> n&rsquo;a pas &eacute;t&eacute; valid&eacute;e.
</p>
${reasonSection}
<p style="margin:16px 0 28px;font-size:15px;line-height:1.6;color:#4b5563;">
  Tu peux uploader une nouvelle version depuis ton espace.
</p>

<!-- CTA -->
${ctaButton(`${APP_URL}/uploads`, "Re-uploader →")}

<p style="margin:28px 0 0;font-size:13px;color:#9ca3af;">
  Des questions&nbsp;? R&eacute;ponds &agrave; cet email.
</p>`;

  await getResendClient().emails.send({
    from: FROM,
    to: input.to,
    subject: `Vidéo refusée — ${typeLabel}`,
    html: buildCreatorEmailShell(content)
  });
}

// ---------------------------------------------------------------------------
// Video revision requested
// ---------------------------------------------------------------------------
export async function sendVideoRevisionRequestedEmail(input: {
  to: string;
  creatorName: string;
  videoType: string;
  revisionNote: string;
}): Promise<void> {
  if (!isResendConfigured()) return;

  const typeLabel = escapeHtml(VIDEO_TYPE_LABELS_EMAIL[input.videoType] ?? input.videoType);
  const safeCreatorName = escapeHtml(input.creatorName);
  const safeRevisionNote = escapeHtml(input.revisionNote);

  const content = `
<!-- Eyebrow -->
<p style="margin:0 0 6px;font-size:11px;font-weight:700;color:${BRAND_AMBER};text-transform:uppercase;letter-spacing:0.12em;">
  Modifications demand&eacute;es
</p>

<!-- Headline -->
<p style="margin:0 0 20px;font-size:22px;font-weight:700;color:#111827;">
  Bonjour ${safeCreatorName},
</p>

<!-- Body -->
<p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:#4b5563;">
  Ta vid&eacute;o <strong style="color:#111827;">${typeLabel}</strong> n&eacute;cessite quelques modifications avant validation.
</p>

<!-- Revision note block -->
${noteBlock({ label: "Ce qu'on te demande", body: safeRevisionNote, accentColor: BRAND_AMBER })}

<p style="margin:16px 0 28px;font-size:15px;line-height:1.6;color:#4b5563;">
  Prends en compte ces retours et uploade une nouvelle version depuis ton espace.
</p>

<!-- CTA — primary brand pink, not amber -->
${ctaButton(`${APP_URL}/uploads`, "Modifier et ré-uploader →")}

<p style="margin:28px 0 0;font-size:13px;color:#9ca3af;">
  Des questions&nbsp;? R&eacute;ponds &agrave; cet email.
</p>`;

  await getResendClient().emails.send({
    from: FROM,
    to: input.to,
    subject: `Modifications demandées — ${typeLabel}`,
    html: buildCreatorEmailShell(content)
  });
}

// ---------------------------------------------------------------------------
// New upload admin notification
// ---------------------------------------------------------------------------
const ADMIN_NOTIFICATION_EMAILS = ["redimpact.group@gmail.com", "RetroMuscle1000@gmail.com"];

export async function sendNewUploadAdminEmail(input: {
  creatorHandle: string;
  creatorId: string;
  videoType: string;
  isRevision?: boolean;
}): Promise<void> {
  if (!isResendConfigured()) return;

  const typeLabel = escapeHtml(VIDEO_TYPE_LABELS_EMAIL[input.videoType] ?? input.videoType);
  const safeHandle = escapeHtml(input.creatorHandle);
  const subject = input.isRevision
    ? `[RetroMuscle] Révision soumise — ${safeHandle} · ${typeLabel}`
    : `[RetroMuscle] Nouveau contenu — ${safeHandle} · ${typeLabel}`;

  const content = `
<!-- Eyebrow -->
<p style="margin:0 0 6px;font-size:11px;font-weight:700;color:${BRAND_PRIMARY_TEXT};text-transform:uppercase;letter-spacing:0.12em;">
  ${input.isRevision ? "R&eacute;vision soumise" : "Nouveau contenu re&ccedil;u"}
</p>

<!-- Headline -->
<p style="margin:0 0 20px;font-size:20px;font-weight:700;color:#111827;">
  ${safeHandle} a upload&eacute; &mdash; ${typeLabel}
</p>

<!-- Details block -->
<div style="background:#faf7ff;border:1px solid #e4d8f4;border-radius:8px;padding:16px 18px;margin:0 0 24px;">
  <p style="margin:0 0 4px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#9ca3af;">Cr&eacute;ateur</p>
  <p style="margin:0 0 14px;font-size:14px;color:#111827;font-weight:600;">${safeHandle}</p>
  <p style="margin:0 0 4px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#9ca3af;">Type de contenu</p>
  <p style="margin:0;font-size:14px;color:#374151;">
    ${typeLabel}${input.isRevision ? `&nbsp;<span style="color:${BRAND_AMBER};">(r&eacute;vision)</span>` : ""}
  </p>
</div>

<!-- CTA -->
${ctaButton(`${APP_URL}/admin/videos`, "Valider le contenu →")}`;

  await getResendClient().emails.send({
    from: FROM,
    to: ADMIN_NOTIFICATION_EMAILS,
    subject,
    html: buildAdminEmailShell(content)
  });
}
