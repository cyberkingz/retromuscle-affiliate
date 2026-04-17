import { getResendClient, isResendConfigured } from "./resend-client";

const FROM = "RetroMuscle Affiliate <noreply@affiliate.retromuscle.net>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://affiliate.retromuscle.net";

// ---------------------------------------------------------------------------
// Application approved
// ---------------------------------------------------------------------------
export async function sendApplicationApprovedEmail(input: {
  to: string;
  fullName: string;
}): Promise<void> {
  if (!isResendConfigured()) return;

  await getResendClient().emails.send({
    from: FROM,
    to: input.to,
    subject: "🎉 Candidature acceptée — Bienvenue chez RetroMuscle !",
    html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e5e5e5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:40px auto;padding:0 20px;">
    <tr><td>
      <div style="background:#111;border:1px solid #222;border-radius:12px;padding:40px 36px;">

        <!-- Eyebrow -->
        <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#d4006a;text-transform:uppercase;letter-spacing:0.12em;">
          Programme d'affiliation RetroMuscle
        </p>

        <!-- Headline -->
        <p style="margin:0 0 24px;font-size:22px;font-weight:700;color:#fff;">
          Bienvenue dans l'équipe, ${input.fullName} 🔥
        </p>

        <!-- Body -->
        <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#aaa;">
          Ta candidature a été <strong style="color:#d4006a;">acceptée</strong>.
          Tu rejoins officiellement le programme créateur RetroMuscle.
        </p>

        <!-- Next step block -->
        <div style="background:#1a0a12;border:1px solid #d4006a44;border-radius:10px;padding:24px 28px;margin:0 0 28px;text-align:center;">
          <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#d4006a;text-transform:uppercase;letter-spacing:0.12em;">
            Prochaine étape
          </p>
          <p style="margin:0 0 4px;font-size:20px;font-weight:900;color:#fff;letter-spacing:0.02em;">
            Signe ton contrat
          </p>
          <p style="margin:0;font-size:12px;color:#666;">
            Accède à ton espace · signe · commence à uploader
          </p>
        </div>

        <!-- CTA -->
        <a href="${APP_URL}/contract"
           style="display:block;background:#d4006a;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:700;font-size:15px;text-align:center;letter-spacing:0.04em;">
          Signer mon contrat →
        </a>

        <!-- Footer note -->
        <p style="margin:28px 0 0;font-size:14px;line-height:1.7;color:#777;">
          Une fois ton contrat signé, tu recevras ton kit créateur avec ton code promo
          pour commander ta première tenue de shoot.
        </p>

        <p style="margin:24px 0 0;font-size:13px;color:#555;">
          Des questions ? Réponds à cet email, on est là.
        </p>
      </div>
      <p style="margin:20px 0 0;text-align:center;font-size:12px;color:#444;">
        © ${new Date().getFullYear()} RetroMuscle ·
        <a href="${APP_URL}" style="color:#666;text-decoration:none;">affiliate.retromuscle.net</a>
      </p>
    </td></tr>
  </table>
</body>
</html>
    `.trim()
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

  const notesBlock = input.notes
    ? `<div style="background:#1a1a1a;border-left:3px solid #ef4444;border-radius:4px;padding:14px 16px;margin:20px 0;">
         <p style="margin:0;font-size:14px;color:#aaa;line-height:1.6;">${input.notes}</p>
       </div>`
    : "";

  await getResendClient().emails.send({
    from: FROM,
    to: input.to,
    subject: "Candidature RetroMuscle — Décision",
    html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e5e5e5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:40px auto;padding:0 20px;">
    <tr><td>
      <div style="background:#111;border:1px solid #222;border-radius:12px;padding:40px 36px;">
        <p style="margin:0 0 24px;font-size:22px;font-weight:700;color:#fff;">
          Bonjour ${input.fullName},
        </p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#aaa;">
          Après examen de ta candidature, nous ne sommes pas en mesure de t'intégrer au programme pour le moment.
        </p>
        ${notesBlock}
        <p style="margin:16px 0 0;font-size:15px;line-height:1.6;color:#aaa;">
          Tu peux re-soumettre une candidature à tout moment si ta situation évolue.
        </p>
        <p style="margin:28px 0 0;font-size:13px;color:#555;">
          Des questions ? Réponds à cet email.
        </p>
      </div>
      <p style="margin:20px 0 0;text-align:center;font-size:12px;color:#444;">
        © ${new Date().getFullYear()} RetroMuscle · <a href="${APP_URL}" style="color:#666;text-decoration:none;">${APP_URL}</a>
      </p>
    </td></tr>
  </table>
</body>
</html>
    `.trim()
  });
}

// ---------------------------------------------------------------------------
// Creator kit — sent immediately after contract signing
// ---------------------------------------------------------------------------
export const CREATOR_PROMO_CODE = "CREATOR20";
const STORE_URL = "https://retromuscle.net";

export async function sendCreatorKitEmail(input: {
  to: string;
  displayName: string;
}): Promise<void> {
  if (!isResendConfigured()) return;

  await getResendClient().emails.send({
    from: FROM,
    to: input.to,
    subject: "Bienvenue dans l'équipe RetroMuscle — voici ton kit créateur 🎽",
    html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e5e5e5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:40px auto;padding:0 20px;">
    <tr><td>
      <div style="background:#111;border:1px solid #222;border-radius:12px;padding:40px 36px;">

        <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#d4006a;text-transform:uppercase;letter-spacing:0.12em;">
          Kit Créateur RetroMuscle
        </p>
        <p style="margin:0 0 24px;font-size:22px;font-weight:700;color:#fff;">
          Ton contrat est signé, ${input.displayName} 🔥
        </p>

        <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#aaa;">
          Avant de commencer à filmer, commande ta première tenue RetroMuscle.
          C'est ton équipement pour créer du contenu authentique avec les vrais produits de la marque.
        </p>

        <!-- Promo code block -->
        <div style="background:#1a0a12;border:1px solid #d4006a44;border-radius:10px;padding:24px 28px;margin:0 0 28px;text-align:center;">
          <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#d4006a;text-transform:uppercase;letter-spacing:0.12em;">
            Ton code kit créateur
          </p>
          <p style="margin:0 0 10px;font-size:38px;font-weight:900;color:#fff;letter-spacing:0.08em;font-variant-numeric:tabular-nums;">
            ${CREATOR_PROMO_CODE}
          </p>
          <p style="margin:0;font-size:12px;color:#666;">
            Valable 1 fois · Usage personnel uniquement
          </p>
        </div>

        <a href="${STORE_URL}?utm_source=creator-email&utm_medium=kit&utm_campaign=welcome"
           style="display:block;background:#d4006a;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:700;font-size:15px;text-align:center;letter-spacing:0.04em;">
          Commander ma tenue de shoot →
        </a>

        <p style="margin:28px 0 0;font-size:14px;line-height:1.7;color:#777;">
          Une fois ta commande passée, tu peux commencer à soumettre tes premiers contenus
          depuis ton <a href="${APP_URL}/dashboard" style="color:#d4006a;text-decoration:none;">espace créateur</a>.
        </p>

        <p style="margin:24px 0 0;font-size:13px;color:#555;">
          Des questions ? Réponds à cet email, on est là.
        </p>
      </div>
      <p style="margin:20px 0 0;text-align:center;font-size:12px;color:#444;">
        © ${new Date().getFullYear()} RetroMuscle ·
        <a href="${APP_URL}" style="color:#666;text-decoration:none;">affiliate.retromuscle.net</a>
      </p>
    </td></tr>
  </table>
</body>
</html>
    `.trim()
  });
}

// ---------------------------------------------------------------------------
// Video rejected
// ---------------------------------------------------------------------------
const VIDEO_TYPE_LABELS: Record<string, string> = {
  OOTD: "OOTD",
  TRAINING: "Training",
  BEFORE_AFTER: "Before/After",
  SPORTS_80S: "Sports 80s",
  CINEMATIC: "Cinematic"
};

export async function sendVideoRejectedEmail(input: {
  to: string;
  creatorName: string;
  videoType: string;
  reason?: string | null;
}): Promise<void> {
  if (!isResendConfigured()) return;

  const typeLabel = VIDEO_TYPE_LABELS[input.videoType] ?? input.videoType;
  const reasonBlock = input.reason
    ? `<div style="background:#1a1a1a;border-left:3px solid #ef4444;border-radius:4px;padding:14px 16px;margin:20px 0;">
         <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#666;text-transform:uppercase;letter-spacing:0.05em;">Raison</p>
         <p style="margin:0;font-size:14px;color:#aaa;line-height:1.6;">${input.reason}</p>
       </div>`
    : "";

  await getResendClient().emails.send({
    from: FROM,
    to: input.to,
    subject: `Vidéo refusée — ${typeLabel}`,
    html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e5e5e5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:40px auto;padding:0 20px;">
    <tr><td>
      <div style="background:#111;border:1px solid #222;border-radius:12px;padding:40px 36px;">
        <p style="margin:0 0 24px;font-size:22px;font-weight:700;color:#fff;">
          Bonjour ${input.creatorName},
        </p>
        <p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:#aaa;">
          Ta vidéo <strong style="color:#fff;">${typeLabel}</strong> n'a pas été validée.
        </p>
        ${reasonBlock}
        <p style="margin:16px 0 28px;font-size:15px;line-height:1.6;color:#aaa;">
          Tu peux uploader une nouvelle version directement depuis ton espace.
        </p>
        <a href="${APP_URL}/uploads"
           style="display:inline-block;background:#ef4444;color:#fff;text-decoration:none;padding:13px 28px;border-radius:8px;font-weight:600;font-size:15px;">
          Re-uploader →
        </a>
        <p style="margin:32px 0 0;font-size:13px;color:#555;">
          Des questions ? Réponds à cet email.
        </p>
      </div>
      <p style="margin:20px 0 0;text-align:center;font-size:12px;color:#444;">
        © ${new Date().getFullYear()} RetroMuscle · <a href="${APP_URL}" style="color:#666;text-decoration:none;">${APP_URL}</a>
      </p>
    </td></tr>
  </table>
</body>
</html>
    `.trim()
  });
}
