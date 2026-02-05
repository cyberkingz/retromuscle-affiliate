import { Button } from "@/components/ui/button";

interface WizardActionsProps {
  step: number;
  maxStep: number;
  canEdit: boolean;
  submitting: boolean;
  onPrev(): void;
  onNext(): void;
  onSaveDraft(): void;
  onSubmit(): void;
}

export function WizardActions({
  step,
  maxStep,
  canEdit,
  submitting,
  onPrev,
  onNext,
  onSaveDraft,
  onSubmit
}: WizardActionsProps) {
  return (
    <div className="glass-panel flex flex-wrap items-center justify-between gap-3 rounded-[24px] px-4 py-4 sm:px-5">
      <div className="flex gap-2">
        <Button
          type="button"
          onClick={onPrev}
          disabled={step === 0}
          variant="outline"
          size="pill"
        >
          Precedent
        </Button>
        <Button
          type="button"
          onClick={onNext}
          disabled={step === maxStep}
          variant="outline"
          size="pill"
        >
          Suivant
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          onClick={onSaveDraft}
          disabled={submitting || !canEdit}
          variant="outline"
          size="pill"
        >
          Sauver brouillon
        </Button>
        <Button
          type="button"
          onClick={onSubmit}
          disabled={submitting || !canEdit}
          size="pill"
        >
          Soumettre dossier
        </Button>
      </div>
    </div>
  );
}
