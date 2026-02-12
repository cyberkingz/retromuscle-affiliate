import type {
  ApplicationFieldUpdater,
  ApplicationFormState,
  OnboardingOptions
} from "@/features/apply/types";
import { SelectableCardButton } from "@/components/ui/selectable-card-button";

interface StepPlanFormProps {
  form: ApplicationFormState;
  options: OnboardingOptions | null;
  disabled: boolean;
  onFieldChange: ApplicationFieldUpdater;
  errorField?: keyof ApplicationFormState | null;
  errorMessage?: string | null;
}

export function StepPlanForm({ form, options, disabled, onFieldChange, errorField, errorMessage }: StepPlanFormProps) {
  return (
    <fieldset className="space-y-3" disabled={disabled}>
      <legend className="text-xs uppercase tracking-[0.12em] text-foreground/55">Etape 3 - Package et mix</legend>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <p className="text-sm font-medium">Package mensuel</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {options?.packages.map((pkg) => (
              <SelectableCardButton
                key={pkg.tier}
                disabled={disabled}
                onClick={() => onFieldChange("packageTier", pkg.tier)}
                selected={form.packageTier === pkg.tier}
                className="px-3 py-3 text-sm"
              >
                <p className="font-semibold">Pack {pkg.tier}</p>
                <p className="text-xs opacity-80">{pkg.quotaVideos} videos / mois</p>
                <p className="text-xs opacity-80">Credits: {pkg.monthlyCredits} EUR</p>
              </SelectableCardButton>
            ))}
          </div>
          {errorField === "packageTier" ? <p className="text-xs text-destructive">{errorMessage}</p> : null}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Mix de videos</p>
          <div className="grid gap-2">
            {options?.mixes.map((mix) => (
              <SelectableCardButton
                key={mix.name}
                disabled={disabled}
                onClick={() => onFieldChange("mixName", mix.name)}
                selected={form.mixName === mix.name}
                className="px-3 py-3 text-sm"
              >
                <p className="font-semibold">{mix.name}</p>
                <p className="text-xs opacity-80">{mix.positioning}</p>
              </SelectableCardButton>
            ))}
          </div>
          {errorField === "mixName" ? <p className="text-xs text-destructive">{errorMessage}</p> : null}
        </div>
      </div>
    </fieldset>
  );
}
