import type { InputHTMLAttributes } from "react";
import type { ApplicationFieldUpdater, ApplicationFormState } from "@/features/apply/types";
import { cn } from "@/lib/cn";
import { Input } from "@/components/ui/input";
import { isValidInstagramUrl, isValidTiktokUrl } from "@/lib/validation";

// ---------------------------------------------------------------------------
// URL prefix constants — stored value is always the full URL.
// ---------------------------------------------------------------------------
const TIKTOK_PREFIX = "https://www.tiktok.com/@";
const INSTAGRAM_PREFIX = "https://www.instagram.com/";

/** Strip the known prefix and return just the handle, or empty string. */
function extractHandle(value: string, prefix: string): string {
  if (!value) return "";
  if (value.startsWith(prefix)) return value.slice(prefix.length);
  // Fallback: try to pull handle from any tiktok/instagram URL
  const domain = prefix.includes("tiktok") ? "tiktok.com" : "instagram.com";
  const match = value.match(new RegExp(domain.replace(".", "\\.") + "\\/@?([^/?\\s]+)"));
  if (match) return match[1];
  // Raw @handle typed directly
  if (value.startsWith("@")) return value.slice(1);
  // Plain handle (no dots/slashes = probably just the handle)
  if (!value.includes(".") && !value.includes("/")) return value;
  return "";
}

// ---------------------------------------------------------------------------
// PrefixInput — looks like our Input but shows a read-only domain prefix
// ---------------------------------------------------------------------------
interface PrefixInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  prefixLabel: string;
  value: string;
  onChange(handle: string): void;
  invalid?: boolean;
  describedBy?: string;
}

function PrefixInput({
  prefixLabel,
  value,
  onChange,
  invalid,
  describedBy,
  placeholder,
  disabled,
  id
}: PrefixInputProps) {
  return (
    <div
      className={cn(
        "flex h-10 w-full overflow-hidden rounded-md border border-input bg-background text-sm ring-offset-background",
        "focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        invalid && "border-destructive",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <span className="flex shrink-0 select-none items-center border-r border-input bg-muted px-2.5 text-xs text-foreground/50 whitespace-nowrap">
        {prefixLabel}
      </span>
      <input
        id={id}
        type="text"
        inputMode="text"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        className="min-w-0 flex-1 bg-transparent px-3 text-base outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed md:text-sm"
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        onChange={(e) => {
          // Strip any accidental @ or spaces the user might type
          const raw = e.target.value.replace(/[@\s]/g, "");
          onChange(raw);
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
interface StepProfileFormProps {
  form: ApplicationFormState;
  disabled: boolean;
  onFieldChange: ApplicationFieldUpdater;
  onBlurField?: (field: keyof ApplicationFormState) => void;
  errorField?: keyof ApplicationFormState | null;
  errorMessage?: string | null;
}

export function StepProfileForm({
  form,
  disabled,
  onFieldChange,
  onBlurField,
  errorField,
  errorMessage
}: StepProfileFormProps) {
  function inlineError(field: keyof ApplicationFormState) {
    return errorField === field ? errorMessage : null;
  }

  // Derive handles for display — prefix input shows only the handle part
  const tiktokHandle = extractHandle(form.socialTiktok, TIKTOK_PREFIX);
  const instagramHandle = extractHandle(form.socialInstagram, INSTAGRAM_PREFIX);

  // Inline URL validation (only when something is typed)
  const tiktokFull = form.socialTiktok.trim();
  const instagramFull = form.socialInstagram.trim();
  const tiktokError = tiktokFull.length > 0 && !isValidTiktokUrl(tiktokFull);
  const instagramError = instagramFull.length > 0 && !isValidInstagramUrl(instagramFull);

  // Followers formatting
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

  return (
    <fieldset className="space-y-4" disabled={disabled}>
      <legend className="sr-only">Étape 2 – Profil créateur</legend>

      {/* Section header with optional badge */}
      <div className="flex items-center gap-2">
        <p className="text-xs uppercase tracking-[0.12em] text-foreground/70">
          Étape 2 – Profil créateur
        </p>
        <span className="rounded-full bg-secondary/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-secondary">
          Optionnel
        </span>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {/* ── TikTok ── */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="socialTiktok" className="text-sm font-medium">
              TikTok
            </label>
            <PrefixInput
              id="socialTiktok"
              prefixLabel="tiktok.com/@"
              value={tiktokHandle}
              onChange={(handle) =>
                onFieldChange("socialTiktok", handle ? TIKTOK_PREFIX + handle : "")
              }
              placeholder="toncompte"
              disabled={disabled}
              invalid={tiktokError || errorField === "socialTiktok"}
              describedBy={
                tiktokError || errorField === "socialTiktok"
                  ? "socialTiktok-error"
                  : "socialTiktok-hint"
              }
            />
            {tiktokError || errorField === "socialTiktok" ? (
              <span id="socialTiktok-error" className="block text-xs leading-relaxed text-destructive">
                {errorField === "socialTiktok"
                  ? errorMessage
                  : "Handle TikTok invalide (ex\u00a0: toncompte)."}
              </span>
            ) : (
              <span id="socialTiktok-hint" className="block text-xs leading-relaxed text-foreground/50">
                Ton handle TikTok, sans le @.
              </span>
            )}
          </div>

          {/* Followers TikTok — only shown when a TikTok handle is entered */}
          {tiktokHandle ? (
            <div className="space-y-2">
              <label htmlFor="followersTiktok" className="text-sm font-medium">
                Abonnés TikTok
              </label>
              <Input
                id="followersTiktok"
                data-field="followersTiktok"
                name="followersTiktok"
                inputMode="numeric"
                value={tiktokFollowersDigits}
                onChange={(event) =>
                  onFieldChange("followersTiktok", event.target.value.replace(/[^\d]/g, ""))
                }
                onBlur={() => onBlurField?.("followersTiktok")}
                disabled={disabled}
                placeholder="10000"
                aria-invalid={!!inlineError("followersTiktok")}
                aria-describedby={
                  inlineError("followersTiktok") ? "followersTiktok-error" : "followersTiktok-hint"
                }
                className={
                  inlineError("followersTiktok")
                    ? "border-destructive text-base md:text-sm"
                    : "text-base md:text-sm"
                }
              />
              {inlineError("followersTiktok") ? (
                <p id="followersTiktok-error" className="text-xs text-destructive">
                  {inlineError("followersTiktok")}
                </p>
              ) : (
                <span
                  id="followersTiktok-hint"
                  className="block text-xs leading-relaxed text-foreground/50"
                >
                  Nombre d&apos;abonnés sur TikTok
                  {tiktokFollowersFormatted ? ` (soit ${tiktokFollowersFormatted})` : ""}
                </span>
              )}
            </div>
          ) : null}
        </div>

        {/* ── Instagram ── */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="socialInstagram" className="text-sm font-medium">
              Instagram
            </label>
            <PrefixInput
              id="socialInstagram"
              prefixLabel="instagram.com/"
              value={instagramHandle}
              onChange={(handle) =>
                onFieldChange("socialInstagram", handle ? INSTAGRAM_PREFIX + handle : "")
              }
              placeholder="toncompte"
              disabled={disabled}
              invalid={instagramError || errorField === "socialInstagram"}
              describedBy={
                instagramError || errorField === "socialInstagram"
                  ? "socialInstagram-error"
                  : "socialInstagram-hint"
              }
            />
            {instagramError || errorField === "socialInstagram" ? (
              <span
                id="socialInstagram-error"
                className="block text-xs leading-relaxed text-destructive"
              >
                {errorField === "socialInstagram"
                  ? errorMessage
                  : "Handle Instagram invalide (ex\u00a0: toncompte)."}
              </span>
            ) : (
              <span
                id="socialInstagram-hint"
                className="block text-xs leading-relaxed text-foreground/50"
              >
                Ton handle Instagram, sans le @.
              </span>
            )}
          </div>

          {/* Followers Instagram — only shown when an Instagram handle is entered */}
          {instagramHandle ? (
            <div className="space-y-2">
              <label htmlFor="followersInstagram" className="text-sm font-medium">
                Abonnés Instagram
              </label>
              <Input
                id="followersInstagram"
                data-field="followersInstagram"
                name="followersInstagram"
                inputMode="numeric"
                value={instagramFollowersDigits}
                onChange={(event) =>
                  onFieldChange("followersInstagram", event.target.value.replace(/[^\d]/g, ""))
                }
                onBlur={() => onBlurField?.("followersInstagram")}
                disabled={disabled}
                placeholder="1000"
                aria-invalid={!!inlineError("followersInstagram")}
                aria-describedby={
                  inlineError("followersInstagram")
                    ? "followersInstagram-error"
                    : "followersInstagram-hint"
                }
                className={
                  inlineError("followersInstagram")
                    ? "border-destructive text-base md:text-sm"
                    : "text-base md:text-sm"
                }
              />
              {inlineError("followersInstagram") ? (
                <p id="followersInstagram-error" className="text-xs text-destructive">
                  {inlineError("followersInstagram")}
                </p>
              ) : (
                <span
                  id="followersInstagram-hint"
                  className="block text-xs leading-relaxed text-foreground/50"
                >
                  Nombre d&apos;abonnés sur Instagram
                  {instagramFollowersFormatted ? ` (soit ${instagramFollowersFormatted})` : ""}
                </span>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <p className="text-xs text-foreground/40">
        Tu pourras compléter ces informations plus tard si tu n&apos;as pas tes liens sous la main.
      </p>
    </fieldset>
  );
}
