"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { CardSection } from "@/components/layout/card-section";
import { SectionHeading } from "@/components/ui/section-heading";
import { ApplyMarketingColumn } from "@/features/apply/components/apply-marketing-column";
import { AuthCredentialsPanel } from "@/features/apply/components/auth-credentials-panel";
import { FlashMessages } from "@/features/apply/components/flash-messages";
import { useSignupFlow } from "@/features/apply/hooks/use-signup-flow";
import type { ApplyMarketingData } from "@/features/apply/types";
import { useAuthRedirect } from "@/features/auth/client/use-auth-redirect";

interface SignupPageProps {
  marketing: ApplyMarketingData;
}

export function SignupPage({ marketing }: SignupPageProps) {
  const flow = useSignupFlow("signup");
  const { redirecting } = useAuthRedirect({
    hasSession: Boolean(flow.user),
    loading: flow.loadingSession,
  });

  return (
    <div className="mx-auto max-w-[1280px]">
      <div className="grid gap-8 lg:grid-cols-[1fr_400px] lg:items-stretch xl:grid-cols-[1fr_420px]">
        {/* Left Column: Sign up Form */}
        <section className="space-y-4">
          <CardSection padding="lg">
            <SectionHeading
              eyebrow="Inscription"
              title="Cree ton compte createur"
              subtitle="Inscris-toi avec email + mot de passe pour rejoindre le programme."
            />

            <div className="mt-6 rounded-2xl border border-line bg-frost/70 p-4 sm:p-6">
              {flow.loadingSession ? (
                <div className="flex h-40 items-center justify-center">
                  <p className="text-sm animate-pulse text-foreground/70">Chargement session...</p>
                </div>
              ) : flow.user && redirecting ? (
                <div className="flex h-40 items-center justify-center">
                  <p className="text-sm animate-pulse text-foreground/70">Redirection en cours...</p>
                </div>
              ) : flow.user ? (
                <div className="space-y-4 py-4">
                  <div className="rounded-xl border border-mint/20 bg-mint/5 p-4 text-sm text-foreground/80">
                    Connecte en tant que <span className="font-semibold">{flow.user.email}</span>.
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild size="pill">
                      <Link href="/onboarding">Continuer l&apos;onboarding</Link>
                    </Button>
                    <Button type="button" variant="outline" size="pill" onClick={flow.signOut}>
                      Se deconnecter
                    </Button>
                  </div>
                </div>
              ) : (
                <AuthCredentialsPanel
                  mode={flow.mode}
                  email={flow.email}
                  password={flow.password}
                  confirmPassword={flow.confirmPassword}
                  submitting={flow.submitting}
                  errorMessage={flow.errorMessage}
                  showModeSwitch={false}
                  onModeChange={flow.setMode}
                  onEmailChange={flow.setEmail}
                  onPasswordChange={flow.setPassword}
                  onConfirmPasswordChange={flow.setConfirmPassword}
                  onSubmit={flow.submitCredentials}
                />
              )}
            </div>

            {!flow.loadingSession && !flow.user ? (
              <p className="mt-5 text-center text-sm text-foreground/70 sm:text-left">
                Deja inscrit ?{" "}
                <Link href="/login" className="font-semibold text-secondary underline underline-offset-4 hover:text-secondary/80">
                  Se connecter
                </Link>
              </p>
            ) : null}
          </CardSection>

          <FlashMessages statusMessage={flow.statusMessage} />

          {flow.needsEmailConfirmation ? (
            <div className="rounded-2xl border border-line bg-frost/70 p-4 sm:p-5">
              <p className="text-sm text-foreground/75">
                Tu n&apos;as pas recu l&apos;email ? Verifie tes spams ou clique ci-dessous pour en recevoir un nouveau.
              </p>
              <Button
                type="button"
                size="pill"
                variant="outline"
                className="mt-3"
                disabled={flow.resending}
                onClick={flow.resendVerificationEmail}
              >
                {flow.resending ? "Envoi en cours..." : "Renvoyer l'email"}
              </Button>
            </div>
          ) : null}
        </section>

        {/* Right Column: Marketing info */}
        <aside className="hidden lg:block">
          <ApplyMarketingColumn data={marketing} authenticated={Boolean(flow.user)} />
        </aside>

        {/* Mobile Marketing info (shown below on small screens) */}
        <aside className="lg:hidden">
          <ApplyMarketingColumn data={marketing} authenticated={Boolean(flow.user)} />
        </aside>
      </div>
    </div>
  );
}
