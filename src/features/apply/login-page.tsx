"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { AuthCredentialsPanel } from "@/features/apply/components/auth-credentials-panel";
import { FlashMessages } from "@/features/apply/components/flash-messages";
import { useSignupFlow } from "@/features/apply/hooks/use-signup-flow";
import { resolveRedirectTarget } from "@/features/auth/client/resolve-redirect-target";

export function LoginPage() {
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
    <div className="mx-auto max-w-[760px] space-y-4 pt-8 sm:pt-10">
      <Card className="border-line bg-white/95 p-5 sm:p-7">
        <SectionHeading
          eyebrow="Connexion"
          title="Connecte ton compte createur"
          subtitle="Entre tes identifiants pour acceder a ton espace."
        />

        <div className="mt-5 rounded-2xl border border-line bg-frost/70 p-4 sm:p-5">
          {flow.loadingSession ? (
            <p className="text-sm text-foreground/70">Chargement session...</p>
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

        <p className="mt-3 text-sm text-foreground/70">
          Pas encore de compte ?{" "}
          <Link href="/apply" className="font-semibold underline underline-offset-4">
            S&apos;inscrire
          </Link>
        </p>
      </Card>

      <FlashMessages statusMessage={flow.statusMessage} />
    </div>
  );
}
