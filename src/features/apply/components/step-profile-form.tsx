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
  onBlurField?: (field: keyof ApplicationFormState) => void;
  errorField?: keyof ApplicationFormState | null;
  errorMessage?: string | null;
}

export function StepProfileForm({ form, disabled, onFieldChange, onBlurField, errorField, errorMessage }: StepProfileFormProps) {
  function inlineError(field: keyof ApplicationFormState) {
    return errorField === field ? errorMessage : null;
  }
  const tiktok = form.socialTiktok.trim();
  const instagram = form.socialInstagram.trim();

  const tiktokFollowersDigits = form.followersTiktok.replace(/[^\d]/g, "");
  const tiktokFollowersValue = tiktokFollowersDigits ? Number(tiktokFollowersDigits) : null;
  const tiktokFollowersFormatted =
    tiktokFollowersValue !== null && Number.isFinite(tiktokFollowersValue)
      ? new Intl.NumberFormat("fr-FR").format(tiktokFollowersValue)
      : null;

  const instagramFollowersDigits = form.followersInstagram.replace(/[^\d]/g, "");
  const instagramFollowersValue = instagramFollowersDigits ? Number(instagramFollowersDigits) : null;
  const instagramFollowersFormatted =
    instagramFollowersValue !== null && Number.isFinite(instagramFollowersValue)
      ? new Intl.NumberFormat("fr-FR").format(instagramFollowersValue)
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
        <div className="space-y-3">
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
            <span className="font-medium">Abonnes TikTok</span>
            <Input
              data-field="followersTiktok"
              name="followersTiktok"
              inputMode="numeric"
              value={tiktokFollowersDigits}
              onChange={(event) => onFieldChange("followersTiktok", event.target.value.replace(/[^\d]/g, ""))}
              onBlur={() => onBlurField?.("followersTiktok")}
              disabled={disabled}
              placeholder="10000"
              className={inlineError("followersTiktok") ? "border-destructive" : ""}
            />
            {inlineError("followersTiktok") ? (
              <p className="text-xs text-destructive">{inlineError("followersTiktok")}</p>
            ) : (
              <span className="block text-xs leading-relaxed text-foreground/55">
                Nombre d&apos;abonnes sur TikTok{tiktokFollowersFormatted ? ` (soit ${tiktokFollowersFormatted})` : ""}
              </span>
            )}
          </label>
        </div>
        <div className="space-y-3">
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
            <span className="font-medium">Abonnes Instagram</span>
            <Input
              data-field="followersInstagram"
              name="followersInstagram"
              inputMode="numeric"
              value={instagramFollowersDigits}
              onChange={(event) => onFieldChange("followersInstagram", event.target.value.replace(/[^\d]/g, ""))}
              onBlur={() => onBlurField?.("followersInstagram")}
              disabled={disabled}
              placeholder="10000"
              className={inlineError("followersInstagram") ? "border-destructive" : ""}
            />
            {inlineError("followersInstagram") ? (
              <p className="text-xs text-destructive">{inlineError("followersInstagram")}</p>
            ) : (
              <span className="block text-xs leading-relaxed text-foreground/55">
                Nombre d&apos;abonnes sur Instagram{instagramFollowersFormatted ? ` (soit ${instagramFollowersFormatted})` : ""}
              </span>
            )}
          </label>
        </div>
      </div>
    </fieldset>
  );
}
