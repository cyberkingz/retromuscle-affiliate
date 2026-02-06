import { Button } from "@/components/ui/button";

interface WizardActionsProps {
  step: number;
  maxStep: number;
  canEdit: boolean;
  submitting: boolean;
  onPrev(): void;
  onNext(): void;
  onSubmit(): void;
}

export function WizardActions({
  step,
  maxStep,
  canEdit,
  submitting,
  onPrev,
  onNext,
  onSubmit
}: WizardActionsProps) {
  const isLastStep = step >= maxStep;

  return (
    <div className="glass-panel flex flex-wrap items-center justify-between gap-3 rounded-[24px] px-4 py-4 sm:px-5">
      <Button type="button" onClick={onPrev} disabled={step === 0} variant="outline" size="pill">
        Precedent
      </Button>

      {isLastStep ? (
        <Button type="button" onClick={onSubmit} disabled={submitting || !canEdit} size="pill">
          {submitting ? "Soumission..." : "Soumettre le dossier"}
        </Button>
      ) : (
        <Button type="button" onClick={onNext} variant="outline" size="pill">
          Suivant
        </Button>
      )}
    </div>
  );
}
