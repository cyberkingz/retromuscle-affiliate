import type { ApplicationFieldUpdater, ApplicationFormState } from "@/features/apply/types";
import { Input } from "@/components/ui/input";
import {
  isValidInstagramUrl,
  isValidTiktokUrl,
  normalizeHttpUrl
} from "@/lib/validation";

interface StepProfileFormProps {
  form: ApplicationFormState;
  disabled: boolean;
  onFieldChange: ApplicationFieldUpdater;
}

export function StepProfileForm({ form, disabled, onFieldChange }: StepProfileFormProps) {
  const tiktok = form.socialTiktok.trim();
  const instagram = form.socialInstagram.trim();
  const followersDigits = form.followers.replace(/[^\d]/g, "");
  const followersValue = followersDigits ? Number(followersDigits) : null;
  const followersFormatted =
    followersValue !== null && Number.isFinite(followersValue)
      ? new Intl.NumberFormat("fr-FR").format(followersValue)
      : null;

  const shouldValidateTiktok =
    tiktok.length > 0 &&
    (tiktok.startsWith("@") ||
      tiktok.startsWith("http") ||
      tiktok.startsWith("www.") ||
      tiktok.includes(".") ||
      tiktok.includes("/"));
  const shouldValidateInstagram =
    instagram.length > 0 &&
    (instagram.startsWith("@") ||
      instagram.startsWith("http") ||
      instagram.startsWith("www.") ||
      instagram.includes(".") ||
      instagram.includes("/"));

  const tiktokError = shouldValidateTiktok && !isValidTiktokUrl(tiktok);
  const instagramError = shouldValidateInstagram && !isValidInstagramUrl(instagram);

  return (
    <fieldset className="space-y-3" disabled={disabled}>
      <legend className="text-xs uppercase tracking-[0.12em] text-foreground/55">Etape 2 - Profil createur</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span className="font-medium">TikTok</span>
          <Input
            data-field="socialTiktok"
            name="socialTiktok"
            value={form.socialTiktok}
            onChange={(event) => onFieldChange("socialTiktok", event.target.value)}
            onBlur={(event) => {
              const nextValue = normalizeHttpUrl(event.target.value);
              if (nextValue && nextValue !== event.target.value) {
                onFieldChange("socialTiktok", nextValue);
              }
            }}
            disabled={disabled}
            placeholder="https://www.tiktok.com/@..."
          />
          {tiktokError ? (
            <span className="block text-xs leading-relaxed text-destructive">
              Colle un lien TikTok valide (ex: https://www.tiktok.com/@toncompte).
            </span>
          ) : (
            <span className="block text-xs leading-relaxed text-foreground/55">
              Ton profil TikTok (lien public).
            </span>
          )}
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium">Instagram</span>
          <Input
            data-field="socialInstagram"
            name="socialInstagram"
            value={form.socialInstagram}
            onChange={(event) => onFieldChange("socialInstagram", event.target.value)}
            onBlur={(event) => {
              const nextValue = normalizeHttpUrl(event.target.value);
              if (nextValue && nextValue !== event.target.value) {
                onFieldChange("socialInstagram", nextValue);
              }
            }}
            disabled={disabled}
            placeholder="https://www.instagram.com/..."
          />
          {instagramError ? (
            <span className="block text-xs leading-relaxed text-destructive">
              Colle un lien Instagram valide (ex: https://www.instagram.com/toncompte).
            </span>
          ) : (
            <span className="block text-xs leading-relaxed text-foreground/55">
              Ton profil Instagram (lien public).
            </span>
          )}
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium">Followers</span>
          <Input
            data-field="followers"
            name="followers"
            inputMode="numeric"
            value={followersDigits}
            onChange={(event) => onFieldChange("followers", event.target.value.replace(/[^\d]/g, ""))}
            disabled={disabled}
            placeholder="10000"
          />
          <span className="block text-xs leading-relaxed text-foreground/55">
            Exemple: 12500 {followersFormatted ? ` (soit ${followersFormatted})` : ""}
          </span>
        </label>
      </div>
    </fieldset>
  );
}
