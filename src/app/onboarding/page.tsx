import { PageShell } from "@/components/layout/page-shell";
import { OnboardingFlow } from "@/features/apply/onboarding-flow";
import { protectPage } from "@/features/auth/server/route-guards";
import { createPageMetadata } from "@/app/_lib/metadata";

export const metadata = createPageMetadata({
  title: "Onboarding Programme Affilie RetroMuscle",
  description: "Finalise ton dossier: profil, reseaux, pack, puis soumets pour validation.",
  path: "/onboarding"
});

export default async function OnboardingPage() {
  await protectPage("/onboarding");

  return (
    <PageShell currentPath="/onboarding">
      <OnboardingFlow />
    </PageShell>
  );
}
