import type { ApplicationFieldUpdater, ApplicationFormState } from "@/features/apply/types";
import { Input } from "@/components/ui/input";

interface StepProfileFormProps {
  form: ApplicationFormState;
  disabled: boolean;
  onFieldChange: ApplicationFieldUpdater;
}

export function StepProfileForm({ form, disabled, onFieldChange }: StepProfileFormProps) {
  return (
    <fieldset className="space-y-3" disabled={disabled}>
      <legend className="text-xs uppercase tracking-[0.12em] text-foreground/55">Etape 2 - Profil createur</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium">TikTok</span>
          <Input
            value={form.socialTiktok}
            onChange={(event) => onFieldChange("socialTiktok", event.target.value)}
            disabled={disabled}
            placeholder="https://www.tiktok.com/@..."
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Instagram</span>
          <Input
            value={form.socialInstagram}
            onChange={(event) => onFieldChange("socialInstagram", event.target.value)}
            disabled={disabled}
            placeholder="https://www.instagram.com/..."
          />
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
            disabled={disabled}
            placeholder="https://..."
          />
        </label>
      </div>
    </fieldset>
  );
}
