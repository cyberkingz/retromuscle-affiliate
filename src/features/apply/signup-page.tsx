"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { ApplyMarketingColumn } from "@/features/apply/components/apply-marketing-column";
import { AuthCredentialsPanel } from "@/features/apply/components/auth-credentials-panel";
import { FlashMessages } from "@/features/apply/components/flash-messages";
import { useSignupFlow } from "@/features/apply/hooks/use-signup-flow";
import type { ApplyMarketingData } from "@/features/apply/types";
import { resolveRedirectTarget } from "@/features/auth/client/resolve-redirect-target";

interface SignupPageProps {
  marketing: ApplyMarketingData;
}

export function SignupPage({ marketing }: SignupPageProps) {
  const flow = useSignupFlow("signup");
  const router = useRouter();

  useEffect(() => {
    if (!flow.loadingSession && flow.session) {
      let cancelled = false;

      resolveRedirectTarget(flow.session.access_token).then((target) => {
        if (!cancelled) {
          router.replace(target);
        }
      }).catch(() => {
        if (!cancelled) {
          router.replace("/onboarding");
        }
      });

      return () => {
        cancelled = true;
      };
    }
  }, [flow.loadingSession, flow.session, router]);

  return (
    <div className="mx-auto max-w-[1120px] space-y-7 pt-8 sm:space-y-8 sm:pt-10">
      <section className="mx-auto w-full max-w-[760px] space-y-4">
        <Card className="border-line bg-white/95 p-5 sm:p-7">
          <SectionHeading
            eyebrow="Inscription"
            title="Cree ton compte createur"
            subtitle="Inscris-toi avec email + mot de passe pour rejoindre le programme."
          />

          <div className="mt-5 rounded-2xl border border-line bg-frost/70 p-4 sm:p-5">
            {flow.loadingSession ? (
              <p className="text-sm text-foreground/70">Chargement session...</p>
            ) : flow.session ? (
              <div className="space-y-4">
                <p className="text-sm text-foreground/75">Connecte en tant que {flow.session.user.email}.</p>
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

          {!flow.loadingSession && !flow.session ? (
            <p className="mt-3 text-sm text-foreground/70">
              Deja inscrit ?{" "}
              <Link href="/login" className="font-semibold underline underline-offset-4">
                Se connecter
              </Link>
            </p>
          ) : null}
        </Card>

        <FlashMessages statusMessage={flow.statusMessage} />
      </section>

      <ApplyMarketingColumn data={marketing} authenticated={Boolean(flow.session)} />
    </div>
  );
}
