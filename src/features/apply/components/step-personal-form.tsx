import type { ApplicationFieldUpdater, ApplicationFormState } from "@/features/apply/types";
import { Input } from "@/components/ui/input";

interface StepPersonalFormProps {
  form: ApplicationFormState;
  disabled: boolean;
  onFieldChange: ApplicationFieldUpdater;
}

export function StepPersonalForm({ form, disabled, onFieldChange }: StepPersonalFormProps) {
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
            disabled={disabled}
            placeholder="Prenom Nom"
          />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium">WhatsApp</span>
          <Input
            data-field="whatsapp"
            name="whatsapp"
            value={form.whatsapp}
            onChange={(event) => onFieldChange("whatsapp", event.target.value)}
            disabled={disabled}
            placeholder="+33 ..."
          />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium">Pays</span>
          <Input
            data-field="country"
            name="country"
            value={form.country}
            onChange={(event) => onFieldChange("country", event.target.value)}
            disabled={disabled}
            placeholder="FR"
          />
        </label>
        <label className="space-y-2 text-sm sm:col-span-2">
          <span className="font-medium">Adresse livraison</span>
          <Input
            data-field="address"
            name="address"
            value={form.address}
            onChange={(event) => onFieldChange("address", event.target.value)}
            disabled={disabled}
            placeholder="Rue, ville, code postal"
          />
        </label>
      </div>
    </fieldset>
  );
}
