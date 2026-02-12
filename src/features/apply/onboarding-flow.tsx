"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CardSection } from "@/components/layout/card-section";
import { SectionHeading } from "@/components/ui/section-heading";
import { FlashMessages } from "@/features/apply/components/flash-messages";
import { PendingReviewPanel } from "@/features/apply/components/pending-review-panel";
import { StepPersonalForm } from "@/features/apply/components/step-personal-form";
import { StepPlanForm } from "@/features/apply/components/step-plan-form";
import { StepProfileForm } from "@/features/apply/components/step-profile-form";
import { WizardActions } from "@/features/apply/components/wizard-actions";
import { WizardHeader } from "@/features/apply/components/wizard-header";
import { WizardStepper } from "@/features/apply/components/wizard-stepper";
import { useAuthRedirect } from "@/features/auth/client/use-auth-redirect";
import { useOnboardingFlow } from "@/features/apply/hooks/use-onboarding-flow";
import { WIZARD_STEPS, statusLabel, statusTone } from "@/features/apply/state";

export function OnboardingFlow() {
  const flow = useOnboardingFlow();
  const router = useRouter();
  const isPendingReview = flow.application?.status === "pending_review";
  const isRejected = flow.application?.status === "rejected";
  const focusField = flow.focusField;
  const clearFocusField = flow.clearFocusField;

  useAuthRedirect({
    hasSession: Boolean(flow.user),
    loading: flow.loadingSession,
    stayOn: "/onboarding",
    fallback: "/login",
  });

  useEffect(() => {
    if (!focusField) {
      return;
    }

    const field = focusField;
    // Defer to ensure the step content is rendered.
    requestAnimationFrame(() => {
      const element = document.querySelector<HTMLElement>(`[data-field="${field}"]`);
      if (element) {
        element.focus();
        element.scrollIntoView({ block: "center", behavior: "smooth" });
      }
      clearFocusField();
    });
  }, [focusField, clearFocusField]);

  function moveToStep(nextStep: number) {
    // When jumping forward, validate all intermediate steps first.
    if (nextStep > flow.step) {
      for (let s = flow.step; s < nextStep; s++) {
        if (!flow.validateStep(s)) {
          return;
        }
      }
    }
    flow.setStep(nextStep);
  }

  return (
    <section className="mx-auto w-full max-w-[860px] space-y-4">
      {!flow.user ? (
        <CardSection>
          <SectionHeading
            eyebrow="Onboarding"
            title="Connecte-toi pour continuer"
            subtitle="Ton onboarding est reserve aux comptes connectes."
          />
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild size="pill">
              <Link href="/login">Aller a la connexion</Link>
            </Button>
            <Button asChild size="pill" variant="outline">
              <Link href="/apply">Creer un compte</Link>
            </Button>
          </div>
        </CardSection>
      ) : (
        <CardSection>
          <SectionHeading
            eyebrow="Onboarding createur"
            title={isPendingReview ? "Dossier en cours de revue" : "Finalise ton inscription"}
            subtitle={isPendingReview ? "Notre equipe revient vers toi sous 48h." : "Renseigne ton profil, puis envoie ton dossier a la derniere etape."}
          />

          <div className="mt-5 space-y-4">
            <WizardHeader
              email={flow.user.email ?? undefined}
              statusLabel={flow.application ? statusLabel(flow.application.status) : undefined}
              statusTone={flow.application ? statusTone(flow.application.status) : "neutral"}
              onSignOut={async () => {
                await flow.signOut();
                router.replace("/apply");
              }}
            />

            {isRejected ? (
              <Card className="border-destructive/30 bg-destructive/5 p-5 sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-destructive">
                  Dossier refuse
                </p>
                <p className="mt-2 font-display text-lg uppercase leading-snug text-foreground/85 sm:text-xl">
                  Ton dossier n&apos;a pas ete retenu
                </p>
                {flow.application?.review_notes ? (
                  <div className="mt-3 rounded-xl border border-destructive/15 bg-white px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.12em] text-foreground/50">
                      Feedback equipe
                    </p>
                    <p className="mt-1 text-sm text-foreground/70">
                      {flow.application.review_notes}
                    </p>
                  </div>
                ) : null}
                <p className="mt-3 text-sm text-foreground/70">
                  Tu peux modifier ton dossier ci-dessous et le re-soumettre.
                </p>
                <Button
                  type="button"
                  size="pill"
                  className="mt-4"
                  onClick={() => moveToStep(0)}
                >
                  Modifier et re-soumettre
                </Button>
              </Card>
            ) : null}

            {isPendingReview ? (
              <>
                <Card className="border-line bg-white p-5 sm:p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground/50">
                    Recapitulatif de ton dossier
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {[
                      { label: "Nom complet", value: flow.application!.full_name },
                      { label: "Email", value: flow.application!.email },
                      { label: "WhatsApp", value: flow.application!.whatsapp },
                      { label: "Pays", value: flow.application!.country },
                      { label: "Handle", value: flow.application!.handle || undefined },
                      { label: "TikTok", value: flow.application!.social_tiktok },
                      { label: "Instagram", value: flow.application!.social_instagram },
                      { label: "Followers", value: flow.application!.followers ? String(flow.application!.followers) : undefined },
                      { label: "Portfolio", value: flow.application!.portfolio_url },
                    ]
                      .filter((item) => item.value)
                      .map((item) => (
                        <div key={item.label} className="rounded-xl border border-line bg-frost/40 px-3 py-2">
                          <p className="text-[11px] uppercase tracking-[0.1em] text-foreground/50">{item.label}</p>
                          <p className="mt-0.5 text-sm text-foreground/80">{item.value}</p>
                        </div>
                      ))}
                  </div>
                </Card>
                <PendingReviewPanel application={flow.application!} />
              </>
            ) : (
              <WizardStepper
                step={flow.step}
                stepPercent={flow.stepPercent}
                steps={WIZARD_STEPS}
                onSelect={moveToStep}
              />
            )}

            {!isPendingReview ? (
              <>
                <div className="space-y-4">
                  {isRejected && flow.application?.review_notes ? (
                    <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-destructive/70">
                        A corriger
                      </p>
                      <p className="mt-1 text-sm text-foreground/75">{flow.application.review_notes}</p>
                    </div>
                  ) : null}
                  <div className="space-y-4 rounded-[26px] border border-line bg-white p-5 sm:p-6">
                    {flow.step === 0 ? (
                      <StepPersonalForm
                        form={flow.form}
                        disabled={!flow.canEdit}
                        onFieldChange={flow.updateField}
                        onBlurField={flow.validateField}
                        errorField={flow.errorField}
                        errorMessage={flow.errorMessage}
                      />
                    ) : null}

                    {flow.step === 1 ? (
                      <StepProfileForm
                        form={flow.form}
                        disabled={!flow.canEdit}
                        onFieldChange={flow.updateField}
                        onBlurField={flow.validateField}
                        errorField={flow.errorField}
                        errorMessage={flow.errorMessage}
                      />
                    ) : null}

                    {flow.step === 2 ? (
                      <StepPlanForm
                        form={flow.form}
                        options={flow.options}
                        disabled={!flow.canEdit}
                        onFieldChange={flow.updateField}
                        errorField={flow.errorField}
                        errorMessage={flow.errorMessage}
                      />
                    ) : null}
                  </div>

                  <FlashMessages statusMessage={flow.statusMessage} errorMessage={flow.errorMessage} />

                  {flow.draftRestored ? (
                    <p className="text-center text-xs text-secondary/60 transition-opacity">
                      Brouillon restaure depuis ta derniere visite
                    </p>
                  ) : null}
                  {flow.draftSaved ? (
                    <p className="text-center text-xs text-foreground/40 transition-opacity">
                      Brouillon sauvegarde
                    </p>
                  ) : null}

                  <WizardActions
                    step={flow.step}
                    maxStep={WIZARD_STEPS.length - 1}
                    canEdit={flow.canEdit}
                    submitting={flow.submitting}
                    submittingTooLong={flow.submittingTooLong}
                    onPrev={() => moveToStep(flow.step - 1)}
                    onNext={() => {
                      if (!flow.validateStep(flow.step)) {
                        return;
                      }
                      moveToStep(flow.step + 1);
                    }}
                    onSubmit={flow.submitApplication}
                  />
                </div>
              </>
            ) : null}
          </div>

          {flow.application?.review_notes && !isRejected ? (
            <Card className="border-line bg-frost/70 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-foreground/50">Feedback equipe</p>
              <p className="mt-2 text-sm text-foreground/70">{flow.application.review_notes}</p>
            </Card>
          ) : null}
        </CardSection>
      )}
    </section>
  );
}
