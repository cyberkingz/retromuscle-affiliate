import type { ApplicationFieldUpdater, ApplicationFormState } from "@/features/apply/types";
import { CountrySelect } from "@/components/ui/country-select";
import { Input } from "@/components/ui/input";

interface StepPersonalFormProps {
  form: ApplicationFormState;
  disabled: boolean;
  onFieldChange: ApplicationFieldUpdater;
  onBlurField?: (field: keyof ApplicationFormState) => void;
  errorField?: keyof ApplicationFormState | null;
  errorMessage?: string | null;
}

export function StepPersonalForm({
  form,
  disabled,
  onFieldChange,
  onBlurField,
  errorField,
  errorMessage
}: StepPersonalFormProps) {
  function fieldError(field: keyof ApplicationFormState) {
    return errorField === field ? errorMessage : null;
  }

  return (
    <fieldset className="space-y-3" disabled={disabled}>
      <legend className="text-xs uppercase tracking-[0.12em] text-foreground/70">
        Étape 1 - Infos personnelles
      </legend>
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
            aria-invalid={!!fieldError("fullName")}
            aria-describedby={fieldError("fullName") ? "fullName-error" : undefined}
            className={fieldError("fullName") ? "border-destructive text-base md:text-sm" : "text-base md:text-sm"}
          />
          {fieldError("fullName") ? (
            <p id="fullName-error" className="text-xs text-destructive">
              {fieldError("fullName")}
            </p>
          ) : null}
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
            aria-invalid={!!fieldError("whatsapp")}
            aria-describedby={fieldError("whatsapp") ? "whatsapp-error" : undefined}
            className={fieldError("whatsapp") ? "border-destructive text-base md:text-sm" : "text-base md:text-sm"}
          />
          {fieldError("whatsapp") ? (
            <p id="whatsapp-error" className="text-xs text-destructive">
              {fieldError("whatsapp")}
            </p>
          ) : null}
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium">Pays</span>
          <CountrySelect
            value={form.country}
            onChange={(val) => onFieldChange("country", val)}
            onBlur={() => onBlurField?.("country")}
            disabled={disabled}
            invalid={!!fieldError("country")}
            describedBy={fieldError("country") ? "country-error" : undefined}
          />
          {fieldError("country") ? (
            <p id="country-error" className="text-xs text-destructive">
              {fieldError("country")}
            </p>
          ) : null}
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
            aria-invalid={!!fieldError("address")}
            aria-describedby={fieldError("address") ? "address-error" : undefined}
            className={fieldError("address") ? "border-destructive text-base md:text-sm" : "text-base md:text-sm"}
          />
          {fieldError("address") ? (
            <p id="address-error" className="text-xs text-destructive">
              {fieldError("address")}
            </p>
          ) : null}
        </label>
      </div>
    </fieldset>
  );
}
