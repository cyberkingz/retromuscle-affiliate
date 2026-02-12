"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { CardSection } from "@/components/layout/card-section";
import { SectionHeading } from "@/components/ui/section-heading";
import { ApplyMarketingColumn } from "@/features/apply/components/apply-marketing-column";
import { AuthCredentialsPanel } from "@/features/apply/components/auth-credentials-panel";
import { FlashMessages } from "@/features/apply/components/flash-messages";
import { useSignupFlow } from "@/features/apply/hooks/use-signup-flow";
import type { ApplyMarketingData } from "@/features/apply/types";
import { useAuthRedirect } from "@/features/auth/client/use-auth-redirect";

interface LoginPageProps {
  marketing: ApplyMarketingData;
}

export function LoginPage({ marketing }: LoginPageProps) {
  const flow = useSignupFlow("signin");
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");
  const { redirecting } = useAuthRedirect({
    hasSession: Boolean(flow.user),
    loading: flow.loadingSession,
  });

  return (
    <div className="mx-auto max-w-[1280px]">
      <div className="grid gap-8 lg:grid-cols-[1fr_400px] lg:items-stretch xl:grid-cols-[1fr_420px]">
        <section className="space-y-4">
          <CardSection padding="lg">
            <SectionHeading
              eyebrow="Connexion"
              title="Connecte ton compte"
              subtitle="Entre tes identifiants pour acceder a ton espace."
            />

            {reason ? (
              <div className="mt-5 rounded-2xl border border-secondary/20 bg-frost/60 p-4 text-sm text-foreground/75">
                {reason === "expired"
                  ? "Ta session a expire. Reconnecte-toi pour continuer."
                  : reason === "unauthorized"
                    ? "Tu n'as pas acces a cette page. Connecte-toi avec le bon compte."
                    : "Connecte-toi pour acceder a cette page."}
              </div>
            ) : null}

            <div className="mt-6 rounded-2xl border border-line bg-frost/70 p-4 sm:p-6">
              {flow.loadingSession || redirecting ? (
                <div className="flex h-40 items-center justify-center">
                  <p className="text-sm animate-pulse text-foreground/70">
                    {redirecting ? "Redirection en cours..." : "Chargement session..."}
                  </p>
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

            <p className="mt-5 text-center text-sm text-foreground/70 sm:text-left">
              Pas encore de compte ?{" "}
              <Link href="/apply" className="font-semibold text-secondary underline underline-offset-4 hover:text-secondary/80">
                S&apos;inscrire
              </Link>
            </p>
          </CardSection>

          <FlashMessages statusMessage={flow.statusMessage} />
        </section>

        <aside className="hidden lg:block">
          <ApplyMarketingColumn data={marketing} authenticated={Boolean(flow.user)} />
        </aside>

        <aside className="lg:hidden">
          <ApplyMarketingColumn data={marketing} authenticated={Boolean(flow.user)} />
        </aside>
      </div>
    </div>
  );
}
