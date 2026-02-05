"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { ApplyMarketingColumn } from "@/features/apply/components/apply-marketing-column";
import { AuthCredentialsPanel } from "@/features/apply/components/auth-credentials-panel";
import { FlashMessages } from "@/features/apply/components/flash-messages";
import { useSignupFlow } from "@/features/apply/hooks/use-signup-flow";
import type { ApplyMarketingData } from "@/features/apply/types";
import { resolveRedirectTarget } from "@/features/auth/client/resolve-redirect-target";

interface LoginPageProps {
  marketing: ApplyMarketingData;
}

export function LoginPage({ marketing }: LoginPageProps) {
  const flow = useSignupFlow("signin");
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
    <div className="mx-auto max-w-[1280px] pt-2 sm:pt-4 md:pt-6">
      <div className="grid gap-8 lg:grid-cols-[1fr_400px] lg:items-stretch xl:grid-cols-[1fr_420px]">
        <section className="space-y-4">
          <Card className="border-line bg-white/95 p-5 sm:p-7 md:p-8">
            <SectionHeading
              eyebrow="Connexion"
              title="Connecte ton compte"
              subtitle="Entre tes identifiants pour acceder a ton espace."
            />

            <div className="mt-6 rounded-2xl border border-line bg-frost/70 p-4 sm:p-6">
              {flow.loadingSession ? (
                <div className="flex h-40 items-center justify-center">
                  <p className="text-sm animate-pulse text-foreground/70">Chargement session...</p>
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
          </Card>

          <FlashMessages statusMessage={flow.statusMessage} />
        </section>

        <aside className="hidden lg:block">
          <ApplyMarketingColumn data={marketing} authenticated={Boolean(flow.session)} />
        </aside>

        <aside className="lg:hidden">
          <ApplyMarketingColumn data={marketing} authenticated={Boolean(flow.session)} />
        </aside>
      </div>
    </div>
  );
}
