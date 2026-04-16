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
          <div className="relative">
            <select
              data-field="country"
              name="country"
              value={form.country}
              onChange={(event) => onFieldChange("country", event.target.value)}
              onBlur={() => onBlurField?.("country")}
              disabled={disabled}
              aria-invalid={!!fieldError("country")}
              aria-describedby={fieldError("country") ? "country-error" : undefined}
              className={[
                "flex h-10 w-full appearance-none rounded-xl border bg-white px-3 pr-9 text-base md:text-sm ring-offset-background",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-50",
                fieldError("country") ? "border-destructive" : "border-line"
              ].join(" ")}
            >
              <option value="">Sélectionner un pays</option>
              <optgroup label="Europe francophone">
                <option value="FR">France</option>
                <option value="BE">Belgique</option>
                <option value="CH">Suisse</option>
                <option value="LU">Luxembourg</option>
                <option value="MC">Monaco</option>
              </optgroup>
              <optgroup label="Maghreb">
                <option value="MA">Maroc</option>
                <option value="DZ">Algérie</option>
                <option value="TN">Tunisie</option>
              </optgroup>
              <optgroup label="Amérique">
                <option value="CA">Canada</option>
                <option value="US">États-Unis</option>
              </optgroup>
              <optgroup label="Europe">
                <option value="DE">Allemagne</option>
                <option value="ES">Espagne</option>
                <option value="IT">Italie</option>
                <option value="PT">Portugal</option>
                <option value="NL">Pays-Bas</option>
                <option value="GB">Royaume-Uni</option>
              </optgroup>
              <optgroup label="Autre">
                <option value="OTHER">Autre pays</option>
              </optgroup>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
              <svg className="h-4 w-4 text-foreground/50" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
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
