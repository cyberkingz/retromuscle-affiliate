import { useState } from "react";

import { Button } from "@/components/ui/button";

interface WizardActionsProps {
  step: number;
  maxStep: number;
  canEdit: boolean;
  submitting: boolean;
  submittingTooLong?: boolean;
  onPrev(): void;
  onNext(): void;
  onSubmit(): void;
}

export function WizardActions({
  step,
  maxStep,
  canEdit,
  submitting,
  submittingTooLong,
  onPrev,
  onNext,
  onSubmit
}: WizardActionsProps) {
  const isLastStep = step >= maxStep;
  const [confirming, setConfirming] = useState(false);

  function handleSubmitClick() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    onSubmit();
  }

  function handlePrev() {
    setConfirming(false);
    onPrev();
  }

  return (
    <div className="space-y-3">
      {confirming && !submitting ? (
        <div className="rounded-2xl border border-secondary/20 bg-frost/60 px-4 py-3 text-center text-sm text-foreground/75">
          Verifie bien tes informations avant d&apos;envoyer. Tout est bon ?
        </div>
      ) : null}
      {submitting && submittingTooLong ? (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-50 px-4 py-3 text-center text-sm text-amber-800">
          Toujours en cours... Si ca prend trop longtemps, recharge la page et reessaie.
        </div>
      ) : null}
      <div className="glass-panel flex flex-wrap items-center justify-between gap-3 rounded-[24px] px-4 py-5 sm:px-6">
        <Button type="button" onClick={handlePrev} disabled={step === 0} variant="outline" size="pill">
          Precedent
        </Button>

        {isLastStep ? (
          <Button type="button" onClick={handleSubmitClick} disabled={submitting || !canEdit} size="pill">
            {submitting ? "Soumission..." : confirming ? "Confirmer et envoyer" : "Soumettre le dossier"}
          </Button>
        ) : (
          <Button type="button" onClick={onNext} variant="outline" size="pill">
            Suivant
          </Button>
        )}
      </div>
    </div>
  );
}
