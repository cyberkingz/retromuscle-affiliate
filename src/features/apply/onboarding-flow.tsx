"use client";

import Link from "next/link";
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
import { resolveRedirectTarget } from "@/features/auth/client/resolve-redirect-target";
import { useOnboardingFlow } from "@/features/apply/hooks/use-onboarding-flow";
import { WIZARD_STEPS, statusLabel, statusTone } from "@/features/apply/state";
import { useEffect } from "react";

export function OnboardingFlow() {
  const flow = useOnboardingFlow();
  const router = useRouter();
  const isPendingReview = flow.application?.status === "pending_review";
  const focusField = flow.focusField;
  const clearFocusField = flow.clearFocusField;

  useEffect(() => {
    if (flow.loadingSession || !flow.user) {
      return;
    }

    let cancelled = false;
    resolveRedirectTarget()
      .then((target) => {
        if (!cancelled && target !== "/onboarding") {
          router.replace(target);
        }
      })
      .catch(() => {
        if (!cancelled) {
          router.replace("/login");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [flow.loadingSession, flow.user, router]);

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
            title="Finalise ton inscription"
            subtitle="Renseigne ton profil, puis envoie ton dossier a la derniere etape."
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

            {isPendingReview ? (
              <PendingReviewPanel application={flow.application!} />
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
                  <div className="space-y-4 rounded-[26px] border border-line bg-white p-5 sm:p-6">
                    {flow.step === 0 ? (
                      <StepPersonalForm
                        form={flow.form}
                        disabled={!flow.canEdit}
                        onFieldChange={flow.updateField}
                      />
                    ) : null}

                    {flow.step === 1 ? (
                      <StepProfileForm
                        form={flow.form}
                        disabled={!flow.canEdit}
                        onFieldChange={flow.updateField}
                      />
                    ) : null}

                    {flow.step === 2 ? (
                      <StepPlanForm
                        form={flow.form}
                        options={flow.options}
                        disabled={!flow.canEdit}
                        onFieldChange={flow.updateField}
                      />
                    ) : null}
                  </div>

                  <FlashMessages statusMessage={flow.statusMessage} errorMessage={flow.errorMessage} />

                  <WizardActions
                    step={flow.step}
                    maxStep={WIZARD_STEPS.length - 1}
                    canEdit={flow.canEdit}
                    submitting={flow.submitting}
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

          {flow.application?.review_notes ? (
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
