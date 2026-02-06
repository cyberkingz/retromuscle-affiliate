import type { ApplicationFieldUpdater, ApplicationFormState } from "@/features/apply/types";
import { Input } from "@/components/ui/input";
import {
  isValidInstagramUrl,
  isValidPublicHttpUrl,
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
  const portfolio = form.portfolioUrl.trim();

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
  const shouldValidatePortfolio =
    portfolio.length > 0 &&
    (portfolio.startsWith("http") ||
      portfolio.startsWith("www.") ||
      portfolio.includes(".") ||
      portfolio.includes("/"));

  const tiktokError = shouldValidateTiktok && !isValidTiktokUrl(tiktok);
  const instagramError = shouldValidateInstagram && !isValidInstagramUrl(instagram);
  const portfolioError = shouldValidatePortfolio && !isValidPublicHttpUrl(portfolio);

  return (
    <fieldset className="space-y-3" disabled={disabled}>
      <legend className="text-xs uppercase tracking-[0.12em] text-foreground/55">Etape 2 - Profil createur</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium">TikTok</span>
          <Input
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
            <span className="block text-xs text-destructive">
              Colle un lien TikTok valide (ex: https://www.tiktok.com/@toncompte).
            </span>
          ) : (
            <span className="block text-xs text-foreground/55">
              Ton profil TikTok (lien public).
            </span>
          )}
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Instagram</span>
          <Input
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
            <span className="block text-xs text-destructive">
              Colle un lien Instagram valide (ex: https://www.instagram.com/toncompte).
            </span>
          ) : (
            <span className="block text-xs text-foreground/55">
              Ton profil Instagram (lien public).
            </span>
          )}
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Followers</span>
          <Input
            type="number"
            value={form.followers}
            onChange={(event) => onFieldChange("followers", event.target.value)}
            disabled={disabled}
            placeholder="10000"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Portfolio (URL)</span>
          <Input
            value={form.portfolioUrl}
            onChange={(event) => onFieldChange("portfolioUrl", event.target.value)}
            onBlur={(event) => {
              const nextValue = normalizeHttpUrl(event.target.value);
              if (nextValue && nextValue !== event.target.value) {
                onFieldChange("portfolioUrl", nextValue);
              }
            }}
            disabled={disabled}
            placeholder="https://..."
          />
          {portfolioError ? (
            <span className="block text-xs text-destructive">
              Ajoute un lien portfolio valide (ex: https://tonsite.com).
            </span>
          ) : (
            <span className="block text-xs text-foreground/55">
              Un lien pour voir ton travail (Drive, Notion, site, etc.).
            </span>
          )}
        </label>
      </div>
    </fieldset>
  );
}
