"use client";
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

export function WizardActions({ step, maxStep, canEdit, submitting, submittingTooLong, onPrev, onNext, onSubmit }: WizardActionsProps) {
  const isLastStep = step >= maxStep;
  const [confirming, setConfirming] = useState(false);

  function handleSubmitClick() {
    if (!confirming) { setConfirming(true); return; }
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
          Vérifie bien tes informations avant d&apos;envoyer. Tout est bon ?
        </div>
      ) : null}
      {submitting && submittingTooLong ? (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-50 px-4 py-3 text-center text-sm text-amber-800">
          Toujours en cours... Si ça prend trop longtemps, recharge la page et réessaie.
        </div>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {isLastStep ? (
          <Button
            type="button"
            onClick={handleSubmitClick}
            disabled={submitting || !canEdit}
            size="lg"
            className="w-full sm:w-auto sm:ml-auto"
          >
            {submitting ? "Soumission..." : confirming ? "Confirmer et envoyer →" : "Soumettre le dossier →"}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={onNext}
            size="lg"
            className="w-full sm:w-auto sm:ml-auto"
          >
            Suivant →
          </Button>
        )}
        {step > 0 ? (
          <Button
            type="button"
            onClick={handlePrev}
            variant="ghost"
            size="sm"
            className="w-full text-foreground/60 sm:order-first sm:w-auto"
          >
            ← Précédent
          </Button>
        ) : null}
      </div>
    </div>
  );
}
