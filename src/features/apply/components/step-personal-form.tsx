import type { ApplicationFieldUpdater, ApplicationFormState } from "@/features/apply/types";
import { Input } from "@/components/ui/input";

interface StepPersonalFormProps {
  form: ApplicationFormState;
  disabled: boolean;
  onFieldChange: ApplicationFieldUpdater;
  onBlurField?: (field: keyof ApplicationFormState) => void;
  errorField?: keyof ApplicationFormState | null;
  errorMessage?: string | null;
}

export function StepPersonalForm({ form, disabled, onFieldChange, onBlurField, errorField, errorMessage }: StepPersonalFormProps) {
  function fieldError(field: keyof ApplicationFormState) {
    return errorField === field ? errorMessage : null;
  }

  return (
    <fieldset className="space-y-3" disabled={disabled}>
      <legend className="text-xs uppercase tracking-[0.12em] text-foreground/55">Etape 1 - Infos personnelles</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span className="font-medium">Nom complet</span>
          <Input
            data-field="fullName"
            name="fullName"
            value={form.fullName}
            onChange={(event) => onFieldChange("fullName", event.target.value)}
            onBlur={() => onBlurField?.("fullName")}
            disabled={disabled}
            placeholder="Prenom Nom"
            className={fieldError("fullName") ? "border-destructive" : ""}
          />
          {fieldError("fullName") ? <p className="text-xs text-destructive">{fieldError("fullName")}</p> : null}
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium">WhatsApp</span>
          <Input
            data-field="whatsapp"
            name="whatsapp"
            value={form.whatsapp}
            onChange={(event) => onFieldChange("whatsapp", event.target.value)}
            onBlur={() => onBlurField?.("whatsapp")}
            disabled={disabled}
            placeholder="+33 ..."
            className={fieldError("whatsapp") ? "border-destructive" : ""}
          />
          {fieldError("whatsapp") ? <p className="text-xs text-destructive">{fieldError("whatsapp")}</p> : null}
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium">Pays</span>
          <Input
            data-field="country"
            name="country"
            value={form.country}
            onChange={(event) => onFieldChange("country", event.target.value)}
            onBlur={() => onBlurField?.("country")}
            disabled={disabled}
            placeholder="FR"
            className={fieldError("country") ? "border-destructive" : ""}
          />
          {fieldError("country") ? <p className="text-xs text-destructive">{fieldError("country")}</p> : null}
        </label>
        <label className="space-y-2 text-sm sm:col-span-2">
          <span className="font-medium">Adresse livraison</span>
          <Input
            data-field="address"
            name="address"
            value={form.address}
            onChange={(event) => onFieldChange("address", event.target.value)}
            onBlur={() => onBlurField?.("address")}
            disabled={disabled}
            placeholder="Rue, ville, code postal"
            className={fieldError("address") ? "border-destructive" : ""}
          />
          {fieldError("address") ? <p className="text-xs text-destructive">{fieldError("address")}</p> : null}
        </label>
      </div>
    </fieldset>
  );
}
